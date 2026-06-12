import { useState, useRef, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Send, Bot, User, ArrowLeft, Leaf, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { chatWithGemini, getApiKey, setApiKey, type ChatTurn } from '@/lib/gemini';
import { searchByTextEmbedding, type VectorHit } from '@/lib/db';
import { climateForCity, CLIMATE_LABEL_PT } from '@/hooks/useGeolocation';
import { PlantDetailDialog } from '@/components/PlantDetailDialog';
import type { Plant } from '@/types';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  plants?: Plant[]; // plantas do catálogo citadas como contexto desta resposta
}

const SUGGESTIONS = [
  'Quero uma planta para meu apartamento que quase não pega sol',
  'Tenho gato — o que é seguro e fácil de cuidar?',
  'Procuro um presente de aniversário até R$ 80',
];

// Estado da conversa vive no módulo: sobrevive à navegação chat -> vitrine ->
// chat (o componente desmonta, a sessão não).
let sessionMessages: Message[] = [];
const sessionHistory: ChatTurn[] = [];
const sessionPlants = new Map<string, Plant>();
let sessionGreeted = false;

function buildSystemPrompt(tenantName: string, plants: Plant[], city?: string): string {
  const catalog = plants
    .map((p) => {
      const env = p.environment.join(', ');
      return (
        `- ${p.name} (${p.scientificName}) | R$ ${p.price.toFixed(2)} | ` +
        `categoria: ${p.category} | ambientes: ${env} | cuidado: ${p.careLevel} | ` +
        `luz: ${p.sunlight} | clima: ${p.climate.join('/')} | ` +
        `${p.petFriendly ? 'segura para pets' : 'TÓXICA para pets'} | ` +
        `estoque: ${p.stock} | ${p.description}`
      );
    })
    .join('\n');

  const locationNote = city
    ? `O cliente está em ${city}, região de clima ${
        CLIMATE_LABEL_PT[climateForCity(city)] ?? 'tropical'
      } — dê preferência a plantas adaptadas a esse clima e mencione isso quando for relevante.\n\n`
    : '';

  return (
    `Você é o assistente virtual da floricultura "${tenantName}" no Brasil. ` +
    `Converse em português brasileiro, de forma simpática, natural e CONCISA ` +
    `(no máximo ~4 frases por resposta; use no máximo 1 emoji). ` +
    `Seu objetivo é entender a necessidade do cliente (ambiente, luz, pets, orçamento, ocasião) ` +
    `e recomendar plantas. Faça no máximo uma pergunta por vez quando precisar de mais contexto.\n\n` +
    locationNote +
    `REGRAS IMPORTANTES:\n` +
    `1. Recomende SOMENTE plantas da lista de estoque abaixo (busca pelo catálogo da loja ` +
    `relacionada à última mensagem do cliente). Nunca invente plantas ou preços.\n` +
    `2. Ao recomendar, cite nome e preço. Recomende no máximo 3 por resposta.\n` +
    `3. Se o cliente tem pets, jamais recomende plantas marcadas como tóxicas.\n` +
    `4. Se nada da lista servir, diga isso honestamente e faça outra pergunta.\n` +
    `5. Não use formatação markdown (sem **, listas com - são ok).\n\n` +
    `ESTOQUE RELEVANTE AGORA:\n${catalog || '(nenhum resultado para esta busca)'}`
  );
}

export function ChatBot() {
  const { tenant, setView, appState } = useTenant();
  const [messages, setMessages] = useState<Message[]>(() => sessionMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(() => Boolean(getApiKey()));
  const [keyInput, setKeyInput] = useState('');
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Plantas já apresentadas na conversa: precisam continuar no contexto do
  // modelo nos turnos seguintes ("qual delas é a mais barata?"), senão o RAG
  // da nova mensagem as remove e o modelo acha que inventou as anteriores.
  const historyRef = useRef<ChatTurn[]>(sessionHistory);
  const contextPlantsRef = useRef<Map<string, Plant>>(sessionPlants);

  useEffect(() => {
    sessionMessages = messages;
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Saudação inicial (uma vez por sessão; guard cobre o duplo-mount do StrictMode)
  useEffect(() => {
    if (sessionGreeted) return;
    sessionGreeted = true;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    setMessages([
      {
        id: 'greeting',
        type: 'bot',
        content:
          `${greeting}! 🌿 Sou o assistente da ${tenant.name}. ` +
          `Me conta o que você procura — ambiente, luz, pets, ocasião, orçamento — ` +
          `e eu encontro a planta certa no nosso estoque.`,
      },
    ]);
  }, [tenant.name]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, type: 'user', content: trimmed }]);
    setInputValue('');
    setIsTyping(true);

    try {
      // RAG: busca vetorial no catálogo guiada pela conversa recente,
      // contexto entregue ao Gemini via system prompt.
      let hits: VectorHit[] = [];
      try {
        const { embedQuery } = await import('@/lib/embedder');
        // Inclui a mensagem anterior do usuário: follow-ups curtos
        // ("qual a mais barata?") não carregam a intenção sozinhos.
        const prevUser = historyRef.current.filter((t) => t.role === 'user').slice(-1)[0];
        const query = prevUser ? `${prevUser.text}. ${trimmed}` : trimmed;
        const queryEmb = await embedQuery(query);
        hits = await searchByTextEmbedding(queryEmb, tenant.id, 8);
      } catch (err) {
        console.error('Busca vetorial falhou (seguindo sem contexto):', err);
      }

      // Novos hits + plantas de turnos anteriores (cap para não inchar o prompt)
      for (const h of hits) contextPlantsRef.current.set(h.plant.id, h.plant);
      const contextPlants = [
        ...hits.map((h) => h.plant),
        ...[...contextPlantsRef.current.values()].filter(
          (p) => !hits.some((h) => h.plant.id === p.id)
        ),
      ].slice(0, 14);

      historyRef.current.push({ role: 'user', text: trimmed });
      const reply = await chatWithGemini(
        buildSystemPrompt(tenant.name, contextPlants, appState.preferences.city),
        historyRef.current
      );
      historyRef.current.push({ role: 'model', text: reply });

      // Quais plantas do contexto o modelo realmente citou na resposta
      const cited = contextPlants
        .filter((p) => reply.toLowerCase().includes(p.name.toLowerCase()))
        .slice(0, 3);

      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, type: 'bot', content: reply, plants: cited },
      ]);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === 'invalid-api-key'
          ? 'Sua chave da API do Gemini parece inválida. Confira a chave e tente de novo.'
          : err instanceof Error && err.message === 'missing-api-key'
            ? 'Configure sua chave da API do Gemini para conversar comigo.'
            : 'Tive um problema para responder agora. Pode tentar de novo?';
      if (err instanceof Error && err.message === 'missing-api-key') setHasKey(false);
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, type: 'bot', content: msg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const saveKey = () => {
    if (!keyInput.trim()) return;
    setApiKey(keyInput);
    setKeyInput('');
    setHasKey(true);
  };

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: tenant.theme.colors.background }}
    >
      {/* Header */}
      <header
        className="w-full px-4 sm:px-6 lg:px-8 py-4"
        style={{
          backgroundColor: tenant.theme.colors.surface,
          borderBottom: `1px solid ${tenant.theme.colors.border}`,
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setView('landing')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: tenant.theme.colors.primary }}
            >
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold" style={{ color: tenant.theme.colors.text }}>
              Assistente {tenant.name}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('results')}
            className="gap-2"
            style={{ color: tenant.theme.colors.primary }}
          >
            <Leaf className="w-4 h-4" />
            Vitrine
          </Button>
        </div>
      </header>

      {/* Configuração da chave (uma vez só) */}
      {!hasKey && (
        <div className="px-4 sm:px-6 lg:px-8 pt-4">
          <Card
            className="max-w-3xl mx-auto p-4"
            style={{
              backgroundColor: tenant.theme.colors.surface,
              borderColor: tenant.theme.colors.warning,
            }}
          >
            <div className="flex items-start gap-3">
              <KeyRound
                className="w-5 h-5 mt-1 flex-shrink-0"
                style={{ color: tenant.theme.colors.warning }}
              />
              <div className="flex-1 space-y-2">
                <p className="text-sm" style={{ color: tenant.theme.colors.text }}>
                  Para conversar com a IA (Google Gemini), cole sua chave da API — crie uma
                  gratuita em{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    style={{ color: tenant.theme.colors.primary }}
                  >
                    aistudio.google.com/apikey
                  </a>
                  . A chave fica salva só neste navegador.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                    placeholder="AIza..."
                    className="flex-1"
                  />
                  <Button
                    onClick={saveKey}
                    disabled={!keyInput.trim()}
                    style={{ backgroundColor: tenant.theme.colors.primary }}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Mensagens */}
      <ScrollArea className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div ref={scrollRef} className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.type === 'bot' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback
                    className="text-white text-xs"
                    style={{ backgroundColor: tenant.theme.colors.primary }}
                  >
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn('max-w-[80%] space-y-2', message.type === 'user' && 'items-end')}>
                <Card
                  className={cn(
                    'p-3',
                    message.type === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'
                  )}
                  style={{
                    backgroundColor:
                      message.type === 'user'
                        ? tenant.theme.colors.primary
                        : tenant.theme.colors.surface,
                    color: message.type === 'user' ? 'white' : tenant.theme.colors.text,
                    borderColor:
                      message.type === 'user'
                        ? tenant.theme.colors.primary
                        : tenant.theme.colors.border,
                  }}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </Card>

                {/* Plantas citadas na resposta */}
                {message.plants && message.plants.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.plants.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setDetailPlant(p)}
                        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-xs border transition-colors hover:shadow"
                        style={{
                          backgroundColor: tenant.theme.colors.background,
                          borderColor: tenant.theme.colors.border,
                          color: tenant.theme.colors.text,
                        }}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-medium">{p.name}</span>
                        <span style={{ color: tenant.theme.colors.primary }}>
                          R$ {p.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback
                    className="text-white text-xs"
                    style={{ backgroundColor: tenant.theme.colors.secondary }}
                  >
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Sugestões iniciais */}
          {messages.length === 1 && !isTyping && (
            <div className="flex flex-wrap gap-2 pl-11">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(s)}
                  className="gap-1 text-xs"
                  style={{
                    borderColor: tenant.theme.colors.border,
                    backgroundColor: tenant.theme.colors.background,
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  {s}
                </Button>
              ))}
            </div>
          )}

          {/* Indicador de digitação */}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback
                  className="text-white text-xs"
                  style={{ backgroundColor: tenant.theme.colors.primary }}
                >
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <Card
                className="p-3 rounded-tl-none"
                style={{
                  backgroundColor: tenant.theme.colors.surface,
                  borderColor: tenant.theme.colors.border,
                }}
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: tenant.theme.colors.primary,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div
        className="px-4 sm:px-6 lg:px-8 py-4"
        style={{
          backgroundColor: tenant.theme.colors.surface,
          borderTop: `1px solid ${tenant.theme.colors.border}`,
        }}
      >
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputValue)}
            placeholder={hasKey ? 'Digite sua mensagem...' : 'Configure a chave da API acima'}
            className="flex-1"
            disabled={isTyping || !hasKey}
            style={{ borderColor: tenant.theme.colors.border }}
          />
          <Button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping || !hasKey}
            style={{ backgroundColor: tenant.theme.colors.primary }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p
          className="text-center text-xs mt-2"
          style={{ color: tenant.theme.colors.textMuted }}
        >
          Assistente da {tenant.name} • Google Gemini + busca vetorial no estoque real
        </p>
      </div>

      <PlantDetailDialog plant={detailPlant} onClose={() => setDetailPlant(null)} />
    </div>
  );
}

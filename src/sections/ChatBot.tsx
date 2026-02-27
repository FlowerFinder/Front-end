import { useState, useRef, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { 
  Send, Bot, User, Sparkles, ArrowLeft, 
  MapPin, Home, Sun, Heart, DollarSign,
  Leaf, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { UserPreferences, EnvironmentType, CareLevel, PlantCategory } from '@/types';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  options?: ChatOption[];
  timestamp: Date;
}

interface ChatOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface ChatState {
  step: 'greeting' | 'location' | 'environment' | 'experience' | 'pets' | 'budget' | 'style' | 'confirm' | 'results';
  preferences: Partial<UserPreferences>;
  isTyping: boolean;
}

export function ChatBot() {
  const { tenant, setView, updatePreferences } = useTenant();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatState, setChatState] = useState<ChatState>({
    step: 'greeting',
    preferences: {},
    isTyping: false,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll automático para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Foco no input
  useEffect(() => {
    if (!chatState.isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatState.isTyping]);

  // Iniciar conversa
  useEffect(() => {
    sendBotMessage(getGreetingMessage(), getInitialOptions());
  }, []);

  const getGreetingMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Olá';
    if (hour < 12) greeting = 'Bom dia';
    else if (hour < 18) greeting = 'Boa tarde';
    else greeting = 'Boa noite';

    return `${greeting}! 🌿 Sou o assistente virtual da ${tenant.name}. Estou aqui para ajudar você a encontrar a planta perfeita! 

Posso fazer algumas perguntinhas rápidas para entender melhor o que você procura?`;
  };

  const getInitialOptions = (): ChatOption[] => [
    { label: 'Vamos lá!', value: 'start', icon: <Sparkles className="w-4 h-4" /> },
    { label: 'Ver todas as plantas', value: 'skip', icon: <Leaf className="w-4 h-4" /> },
  ];

  const sendBotMessage = (content: string, options?: ChatOption[]) => {
    setChatState(prev => ({ ...prev, isTyping: true }));
    
    // Simular digitação
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content,
        options,
        timestamp: new Date(),
      }]);
      setChatState(prev => ({ ...prev, isTyping: false }));
    }, 800 + Math.random() * 500);
  };

  const sendUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    }]);
  };

  const handleOptionClick = (option: ChatOption) => {
    sendUserMessage(option.label);
    processUserInput(option.value, option.label);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const message = inputValue.trim();
    sendUserMessage(message);
    setInputValue('');
    processUserInput(message.toLowerCase(), message);
  };

  const processUserInput = (value: string, originalMessage: string) => {
    const { step, preferences } = chatState;

    switch (step) {
      case 'greeting':
        if (value === 'start' || value.includes('sim') || value.includes('vamos') || value.includes('ok')) {
          setChatState(prev => ({ ...prev, step: 'location' }));
          setTimeout(() => {
            sendBotMessage(
              'Perfeito! Para começar, qual é a sua cidade ou região? 📍\n\nIsso me ajuda a sugerir plantas que se adaptam melhor ao clima da sua área.',
              [{ label: 'Usar minha localização', value: 'geolocation', icon: <MapPin className="w-4 h-4" /> }]
            );
          }, 500);
        } else if (value === 'skip' || value.includes('ver') || value.includes('todas')) {
          goToResults();
        }
        break;

      case 'location':
        // Extrair cidade da mensagem
        const city = extractCity(originalMessage);
        if (city) {
          setChatState(prev => ({ 
            ...prev, 
            step: 'environment',
            preferences: { ...prev.preferences, city }
          }));
          setTimeout(() => {
            sendBotMessage(
              `Entendido! ${city} é uma ótima região para plantas. 🌱\n\nAgora me conta: onde você pretende colocar a planta?`,
              [
                { label: 'Dentro de casa', value: 'indoor', icon: <Home className="w-4 h-4" /> },
                { label: 'Varanda/Terraço', value: 'balcony', icon: <Sun className="w-4 h-4" /> },
                { label: 'Jardim/Quintal', value: 'outdoor', icon: <Leaf className="w-4 h-4" /> },
                { label: 'Escritório', value: 'office', icon: <span className="text-sm">💼</span> },
              ]
            );
          }, 500);
        } else if (value === 'geolocation') {
          // Simular geolocalização
          const mockCities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Sorocaba'];
          const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];
          setChatState(prev => ({ 
            ...prev, 
            step: 'environment',
            preferences: { ...prev.preferences, city: randomCity }
          }));
          setTimeout(() => {
            sendBotMessage(
              `Detectei que você está em ${randomCity}! 📍\n\nAgora me conta: onde você pretende colocar a planta?`,
              [
                { label: 'Dentro de casa', value: 'indoor', icon: <Home className="w-4 h-4" /> },
                { label: 'Varanda/Terraço', value: 'balcony', icon: <Sun className="w-4 h-4" /> },
                { label: 'Jardim/Quintal', value: 'outdoor', icon: <Leaf className="w-4 h-4" /> },
                { label: 'Escritório', value: 'office', icon: <span className="text-sm">💼</span> },
              ]
            );
          }, 500);
        } else {
          sendBotMessage('Não consegui identificar sua cidade. Pode me dizer o nome da cidade novamente?');
        }
        break;

      case 'environment':
        const env = extractEnvironment(value);
        if (env) {
          setChatState(prev => ({ 
            ...prev, 
            step: 'experience',
            preferences: { ...prev.preferences, environment: env }
          }));
          setTimeout(() => {
            sendBotMessage(
              'Ótima escolha! 🌿\n\nE quanto à experiência com plantas, como você se considera?',
              [
                { label: '🌱 Iniciante - Nunca tive plantas', value: 'beginner' },
                { label: '🌿 Iniciante - Tenho algumas', value: 'easy' },
                { label: '🌳 Intermediário - Cuido regularmente', value: 'moderate' },
                { label: '🌴 Experiente - Sou praticamente um jardineiro!', value: 'advanced' },
              ]
            );
          }, 500);
        }
        break;

      case 'experience':
        const careLevel = extractCareLevel(value);
        if (careLevel) {
          setChatState(prev => ({ 
            ...prev, 
            step: 'pets',
            preferences: { ...prev.preferences, careLevel }
          }));
          setTimeout(() => {
            sendBotMessage(
              'Entendido! 💚\n\nVocê tem pets em casa? Algumas plantas podem ser tóxicas para cachorros e gatos.',
              [
                { label: 'Sim, tenho cachorro 🐕', value: 'dog', icon: <Heart className="w-4 h-4" /> },
                { label: 'Sim, tenho gato 🐈', value: 'cat', icon: <Heart className="w-4 h-4" /> },
                { label: 'Tenho ambos! 🐕🐈', value: 'both', icon: <Heart className="w-4 h-4" /> },
                { label: 'Não tenho pets', value: 'no', icon: <span className="text-sm">🏠</span> },
              ]
            );
          }, 500);
        }
        break;

      case 'pets':
        const petFriendly = value === 'no' ? false : true;
        setChatState(prev => ({ 
          ...prev, 
          step: 'budget',
          preferences: { ...prev.preferences, petFriendly }
        }));
        setTimeout(() => {
          sendBotMessage(
            petFriendly 
              ? 'Perfeito! Vou buscar apenas plantas seguras para pets. 🐾\n\nQual é a sua faixa de preço?'
              : 'Entendido! 🏠\n\nQual é a sua faixa de preço?',
            [
              { label: 'Até R$ 50', value: '0-50', icon: <DollarSign className="w-4 h-4" /> },
              { label: 'R$ 50 a R$ 100', value: '50-100', icon: <DollarSign className="w-4 h-4" /> },
              { label: 'R$ 100 a R$ 200', value: '100-200', icon: <DollarSign className="w-4 h-4" /> },
              { label: 'Acima de R$ 200', value: '200+', icon: <DollarSign className="w-4 h-4" /> },
              { label: 'Qualquer preço', value: 'any', icon: <span className="text-sm">💰</span> },
            ]
          );
        }, 500);
        break;

      case 'budget':
        const budget = extractBudget(value);
        setChatState(prev => ({ 
          ...prev, 
          step: 'style',
          preferences: { ...prev.preferences, budgetRange: budget }
        }));
        setTimeout(() => {
          sendBotMessage(
            'Ótimo! 💚\n\nPor último, que tipo de planta você mais gosta? (Pode escolher várias)',
            [
              { label: '🌺 Flores coloridas', value: 'flowers' },
              { label: '🌵 Suculentas e cactos', value: 'succulents' },
              { label: '🌿 Folhagens verdes', value: 'foliage' },
              { label: '🌳 Árvores e palmeiras', value: 'trees' },
              { label: '🌱 Ervas aromáticas', value: 'herbs' },
              { label: '🌸 Orquídeas', value: 'orchids' },
              { label: 'Todas! Surpreenda-me', value: 'all' },
            ]
          );
        }, 500);
        break;

      case 'style':
        const categories = extractCategories(value);
        const updatedPreferences = { 
          ...preferences, 
          categories,
          budgetRange: preferences.budgetRange || [0, 500]
        };
        
        setChatState(prev => ({ 
          ...prev, 
          step: 'confirm',
          preferences: updatedPreferences
        }));

        setTimeout(() => {
          const summary = generateSummary(updatedPreferences);
          sendBotMessage(
            `Perfeito! 🎉 Deixa eu confirmar o que entendi:\n\n${summary}\n\nEstá tudo certo?`,
            [
              { label: 'Sim, mostrar plantas! 🌿', value: 'confirm', icon: <Sparkles className="w-4 h-4" /> },
              { label: 'Quero refazer', value: 'restart', icon: <RefreshCw className="w-4 h-4" /> },
            ]
          );
        }, 500);
        break;

      case 'confirm':
        if (value === 'confirm' || value.includes('sim') || value.includes('mostrar')) {
          goToResults();
        } else if (value === 'restart' || value.includes('refazer')) {
          setChatState({
            step: 'greeting',
            preferences: {},
            isTyping: false,
          });
          setMessages([]);
          setTimeout(() => {
            sendBotMessage(getGreetingMessage(), getInitialOptions());
          }, 500);
        }
        break;
    }
  };

  const extractCity = (message: string): string | null => {
    // Cidades comuns do Brasil
    const cities = [
      'são paulo', 'rio de janeiro', 'belo horizonte', 'curitiba', 'porto alegre',
      'salvador', 'brasília', 'fortaleza', 'recife', 'sorocaba', 'campinas',
      'santos', 'florianópolis', 'vitória', 'goiânia', 'manaus', 'belém',
      'são luís', 'teresina', 'natal', 'joão pessoa', 'maceió', 'aracaju',
      'cuiabá', 'campo grande', 'porto velho', 'boa vista', 'macapá',
      'são josé dos campos', 'ribeirão preto', 'são bernardo', 'santo andré',
      'osasco', 'guarulhos', 'barueri', 'alphaville', 'granja viana'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    // Procurar cidade na mensagem
    for (const city of cities) {
      if (lowerMessage.includes(city)) {
        return city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    
    // Se não encontrou cidade conhecida, tentar extrair qualquer palavra maiúscula
    const words = message.split(' ');
    for (const word of words) {
      if (word.length > 3 && word[0] === word[0].toUpperCase()) {
        return word;
      }
    }
    
    // Se a mensagem tem mais de 3 caracteres, assumir que é uma cidade
    if (message.length > 3 && message.length < 30) {
      return message.charAt(0).toUpperCase() + message.slice(1);
    }
    
    return null;
  };

  const extractEnvironment = (value: string): EnvironmentType | null => {
    if (value.includes('indoor') || value.includes('casa') || value.includes('dentro')) return 'indoor';
    if (value.includes('balcony') || value.includes('varanda') || value.includes('terraço')) return 'balcony';
    if (value.includes('outdoor') || value.includes('jardim') || value.includes('quintal')) return 'outdoor';
    if (value.includes('office') || value.includes('escritório') || value.includes('trabalho')) return 'office';
    return null;
  };

  const extractCareLevel = (value: string): CareLevel | null => {
    if (value.includes('beginner') || value.includes('iniciante') || value.includes('nunca')) return 'beginner';
    if (value.includes('easy') || value.includes('algumas')) return 'easy';
    if (value.includes('moderate') || value.includes('intermediário') || value.includes('regularmente')) return 'moderate';
    if (value.includes('advanced') || value.includes('experiente') || value.includes('jardineiro')) return 'advanced';
    if (value.includes('expert')) return 'expert';
    return null;
  };

  const extractBudget = (value: string): [number, number] => {
    if (value.includes('0-50')) return [0, 50];
    if (value.includes('50-100')) return [50, 100];
    if (value.includes('100-200')) return [100, 200];
    if (value.includes('200+') || value.includes('acima')) return [200, 1000];
    return [0, 500];
  };

  const extractCategories = (value: string): PlantCategory[] => {
    const categories: PlantCategory[] = [];
    const lowerValue = value.toLowerCase();
    
    if (lowerValue.includes('all') || lowerValue.includes('todas') || lowerValue.includes('surpreenda')) {
      return ['flowers', 'succulents', 'foliage', 'trees', 'herbs', 'orchids', 'cacti', 'bonsai'];
    }
    
    if (lowerValue.includes('flower') || lowerValue.includes('flor')) categories.push('flowers');
    if (lowerValue.includes('succulent') || lowerValue.includes('cacto')) categories.push('succulents', 'cacti');
    if (lowerValue.includes('foliage') || lowerValue.includes('folhagem')) categories.push('foliage');
    if (lowerValue.includes('tree') || lowerValue.includes('árvore') || lowerValue.includes('palmeira')) categories.push('trees');
    if (lowerValue.includes('herb') || lowerValue.includes('erva')) categories.push('herbs');
    if (lowerValue.includes('orchid') || lowerValue.includes('orquídea')) categories.push('orchids');
    if (lowerValue.includes('bonsai')) categories.push('bonsai');
    
    return categories.length > 0 ? categories : ['flowers', 'succulents', 'foliage'];
  };

  const generateSummary = (prefs: Partial<UserPreferences>): string => {
    const parts: string[] = [];
    
    if (prefs.city) parts.push(`📍 Local: ${prefs.city}`);
    if (prefs.environment) {
      const envLabels: Record<string, string> = {
        indoor: 'Dentro de casa',
        outdoor: 'Área externa',
        balcony: 'Varanda/Terraço',
        office: 'Escritório',
        garden: 'Jardim',
      };
      parts.push(`🏠 Ambiente: ${envLabels[prefs.environment] || prefs.environment}`);
    }
    if (prefs.careLevel) {
      const careLabels: Record<string, string> = {
        beginner: 'Iniciante',
        easy: 'Fácil',
        moderate: 'Moderado',
        advanced: 'Avançado',
        expert: 'Expert',
      };
      parts.push(`🌱 Experiência: ${careLabels[prefs.careLevel]}`);
    }
    if (prefs.petFriendly !== undefined) {
      parts.push(prefs.petFriendly ? '🐾 Pet friendly: Sim' : '🏠 Pet friendly: Não necessário');
    }
    if (prefs.budgetRange) {
      parts.push(`💰 Orçamento: R$ ${prefs.budgetRange[0]} - R$ ${prefs.budgetRange[1]}`);
    }
    if (prefs.categories && prefs.categories.length > 0) {
      const catLabels: Record<string, string> = {
        flowers: 'Flores',
        succulents: 'Suculentas',
        foliage: 'Folhagens',
        trees: 'Árvores',
        herbs: 'Ervas',
        orchids: 'Orquídeas',
        cacti: 'Cactos',
        bonsai: 'Bonsais',
      };
      parts.push(`🌿 Tipos: ${prefs.categories.map(c => catLabels[c] || c).join(', ')}`);
    }
    
    return parts.join('\n');
  };

  const goToResults = () => {
    // Atualizar preferências globais
    const finalPreferences: UserPreferences = {
      environment: chatState.preferences.environment || 'indoor',
      careLevel: chatState.preferences.careLevel || 'easy',
      petFriendly: chatState.preferences.petFriendly ?? false,
      budgetRange: chatState.preferences.budgetRange || [0, 500],
      categories: chatState.preferences.categories || ['flowers', 'succulents', 'foliage'],
      location: null,
      city: chatState.preferences.city,
    };
    
    updatePreferences(finalPreferences);
    
    // Mensagem final do bot
    sendBotMessage('Ótimo! 🌿 Deixa eu buscar as melhores opções para você...');
    
    // Ir para resultados
    setTimeout(() => {
      setView('results');
    }, 1500);
  };

  const handleBack = () => {
    setView('landing');
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: tenant.theme.colors.background }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-4"
        style={{ 
          backgroundColor: tenant.theme.colors.surface,
          borderBottom: `1px solid ${tenant.theme.colors.border}` 
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
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
            <span 
              className="font-semibold"
              style={{ color: tenant.theme.colors.text }}
            >
              Assistente {tenant.name}
            </span>
          </div>
          
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      {/* Área de mensagens */}
      <ScrollArea className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div ref={scrollRef} className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? "justify-end" : "justify-start"
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
              
              <div className={cn(
                "max-w-[80%] space-y-2",
                message.type === 'user' && "items-end"
              )}>
                <Card
                  className={cn(
                    "p-3",
                    message.type === 'user' && "rounded-tr-none",
                    message.type === 'bot' && "rounded-tl-none"
                  )}
                  style={{
                    backgroundColor: message.type === 'user' 
                      ? tenant.theme.colors.primary 
                      : tenant.theme.colors.surface,
                    color: message.type === 'user' ? 'white' : tenant.theme.colors.text,
                    borderColor: message.type === 'user' 
                      ? tenant.theme.colors.primary 
                      : tenant.theme.colors.border,
                  }}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </Card>
                
                {/* Opções rápidas */}
                {message.options && message.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.options.map((option, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleOptionClick(option)}
                        className="gap-1 text-xs"
                        style={{
                          borderColor: tenant.theme.colors.border,
                          backgroundColor: tenant.theme.colors.background,
                        }}
                      >
                        {option.icon}
                        {option.label}
                      </Button>
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
          
          {/* Indicador de digitação */}
          {chatState.isTyping && (
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
                  <span 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: tenant.theme.colors.primary }}
                  />
                  <span 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: tenant.theme.colors.primary, animationDelay: '0.1s' }}
                  />
                  <span 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: tenant.theme.colors.primary, animationDelay: '0.2s' }}
                  />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div 
        className="px-4 sm:px-6 lg:px-8 py-4"
        style={{ 
          backgroundColor: tenant.theme.colors.surface,
          borderTop: `1px solid ${tenant.theme.colors.border}` 
        }}
      >
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={chatState.isTyping}
            style={{
              borderColor: tenant.theme.colors.border,
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatState.isTyping}
            style={{
              backgroundColor: tenant.theme.colors.primary,
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <p 
          className="text-center text-xs mt-2"
          style={{ color: tenant.theme.colors.textMuted }}
        >
          Assistente virtual da {tenant.name} • Respostas automáticas
        </p>
      </div>
    </div>
  );
}

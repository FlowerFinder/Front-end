import { useTenant } from '@/contexts/TenantContext';
import { Bot, ListChecks, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ModeSelection() {
  const { tenant, setView } = useTenant();

  const handleChatMode = () => {
    setView('chat');
  };

  const handleQuizMode = () => {
    setView('quiz-step-1');
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: tenant.theme.colors.background }}
    >
      {/* Header */}
      <header className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('landing')}
          >
            ← Voltar
          </Button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          
          {/* Título */}
          <div className="space-y-3">
            <Badge 
              variant="outline"
              className="mb-2"
              style={{ borderColor: tenant.theme.colors.primary, color: tenant.theme.colors.primary }}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Assistente Inteligente
            </Badge>
            <h1 
              className="text-3xl sm:text-4xl font-bold"
              style={{ 
                color: tenant.theme.colors.text,
                fontFamily: tenant.theme.typography.headingFont 
              }}
            >
              Como você prefere encontrar sua planta?
            </h1>
            <p 
              className="text-base sm:text-lg"
              style={{ color: tenant.theme.colors.textMuted }}
            >
              Escolha a forma que funciona melhor para você
            </p>
          </div>

          {/* Opções */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opção ChatBot */}
            <Card
              onClick={handleChatMode}
              className="p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group relative overflow-hidden"
              style={{ 
                backgroundColor: tenant.theme.colors.surface,
                borderColor: tenant.theme.colors.primary,
                borderWidth: '2px',
                borderRadius: tenant.theme.borderRadius.lg 
              }}
            >
              {/* Badge recomendado */}
              <div 
                className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: tenant.theme.colors.primary,
                  color: 'white'
                }}
              >
                Recomendado
              </div>

              <div className="space-y-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ backgroundColor: `${tenant.theme.colors.primary}20` }}
                >
                  <Bot 
                    className="w-8 h-8 transition-transform group-hover:scale-110" 
                    style={{ color: tenant.theme.colors.primary }} 
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 
                    className="text-xl font-semibold"
                    style={{ color: tenant.theme.colors.text }}
                  >
                    Conversar com a IA
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: tenant.theme.colors.textMuted }}
                  >
                    Converse naturalmente com nosso assistente virtual. 
                    Ele vai entender suas necessidades e sugerir as melhores opções.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="text-xs">🤖 Inteligente</Badge>
                  <Badge variant="secondary" className="text-xs">💬 Natural</Badge>
                  <Badge variant="secondary" className="text-xs">⚡ Rápido</Badge>
                </div>

                <Button 
                  className="w-full gap-2"
                  style={{ 
                    backgroundColor: tenant.theme.colors.primary,
                    borderRadius: tenant.theme.borderRadius.md 
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Iniciar Conversa
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Opção Quiz */}
            <Card
              onClick={handleQuizMode}
              className="p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group"
              style={{ 
                backgroundColor: tenant.theme.colors.surface,
                borderColor: tenant.theme.colors.border,
                borderRadius: tenant.theme.borderRadius.lg 
              }}
            >
              <div className="space-y-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ backgroundColor: `${tenant.theme.colors.secondary}20` }}
                >
                  <ListChecks 
                    className="w-8 h-8 transition-transform group-hover:scale-110" 
                    style={{ color: tenant.theme.colors.secondary }} 
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 
                    className="text-xl font-semibold"
                    style={{ color: tenant.theme.colors.text }}
                  >
                    Responder Quiz
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: tenant.theme.colors.textMuted }}
                  >
                    Responda perguntas objetivas em etapas. 
                    Um jeito direto e estruturado de encontrar sua planta ideal.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="text-xs">📋 Estruturado</Badge>
                  <Badge variant="secondary" className="text-xs">🎯 Direto</Badge>
                  <Badge variant="secondary" className="text-xs">✓ Simples</Badge>
                </div>

                <Button 
                  variant="outline"
                  className="w-full gap-2"
                  style={{ 
                    borderColor: tenant.theme.colors.border,
                    borderRadius: tenant.theme.borderRadius.md 
                  }}
                >
                  <ListChecks className="w-4 h-4" />
                  Iniciar Quiz
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Dica */}
          <div 
            className="p-4 rounded-xl text-sm"
            style={{ 
              backgroundColor: `${tenant.theme.colors.accent}15`,
              color: tenant.theme.colors.text 
            }}
          >
            <span className="font-medium">💡 Dica:</span> O modo conversa é mais rápido e personalizado, 
            mas se você preferir um processo mais estruturado, o quiz é ideal!
          </div>
        </div>
      </main>
    </div>
  );
}

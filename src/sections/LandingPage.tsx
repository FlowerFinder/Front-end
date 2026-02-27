import { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, ArrowRight, Sparkles, Leaf, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function LandingPage() {
  const { tenant, setView, updatePreferences } = useTenant();
  const { 
    requestLocation, 
    city, 
    state, 
    isLoading, 
    error, 
    permission 
  } = useGeolocation();
  const [hasRequested, setHasRequested] = useState(false);

  // Atualizar preferências quando obtiver localização
  useEffect(() => {
    if (city && state) {
      updatePreferences({ city, state });
    }
  }, [city, state, updatePreferences]);

  const handleRequestLocation = async () => {
    setHasRequested(true);
    await requestLocation();
  };

  const handleStart = () => {
    setView('mode-selection');
  };

  const handleSkipLocation = () => {
    setView('mode-selection');
  };

  // Cores do tema
  const primaryColor = tenant.theme.colors.primary;
  const secondaryColor = tenant.theme.colors.secondary;
  const textColor = tenant.theme.colors.text;

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: tenant.theme.colors.background }}
    >
      {/* Header */}
      <header className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span 
              className="text-xl font-bold"
              style={{ 
                color: textColor,
                fontFamily: tenant.theme.typography.headingFont 
              }}
            >
              {tenant.name}
            </span>
          </div>
          
          {/* Badge de modo */}
          <Badge 
            variant="outline"
            className="hidden sm:flex items-center gap-1"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <Sparkles className="w-3 h-3" />
            Assistente IA
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          
          {/* Título Principal */}
          <div className="space-y-4">
            <h1 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ 
                color: textColor,
                fontFamily: tenant.theme.typography.headingFont 
              }}
            >
              Descubra a{' '}
              <span style={{ color: primaryColor }}>planta ideal</span>
              <br />
              para você
            </h1>
            <p 
              className="text-base sm:text-lg max-w-lg mx-auto"
              style={{ color: tenant.theme.colors.textMuted }}
            >
              Nosso assistente inteligente analisa suas preferências e o clima da sua região 
              para sugerir as melhores plantas do nosso estoque.
            </p>
          </div>

          {/* Card de Geolocalização */}
          <Card 
            className="p-6 sm:p-8 text-left"
            style={{ 
              backgroundColor: tenant.theme.colors.surface,
              borderColor: tenant.theme.colors.border,
              borderRadius: tenant.theme.borderRadius.lg 
            }}
          >
            {!hasRequested ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: textColor }}>
                      Permitir localização
                    </h3>
                    <p className="text-sm" style={{ color: tenant.theme.colors.textMuted }}>
                      Para sugestões mais precisas baseadas no clima
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleRequestLocation}
                    className="flex-1 h-12 text-base"
                    style={{ 
                      backgroundColor: primaryColor,
                      borderRadius: tenant.theme.borderRadius.md
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Usar minha localização
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSkipLocation}
                    className="h-12"
                    style={{ 
                      borderColor: tenant.theme.colors.border,
                      borderRadius: tenant.theme.borderRadius.md
                    }}
                  >
                    Pular
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ) : permission === 'granted' && city ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: textColor }}>
                      Localização detectada
                    </h3>
                    <p className="text-sm" style={{ color: tenant.theme.colors.textMuted }}>
                      {city}, {state}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleStart}
                  className="w-full h-12 text-base"
                  style={{ 
                    backgroundColor: primaryColor,
                    borderRadius: tenant.theme.borderRadius.md
                  }}
                >
                  Encontrar minha planta ideal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${tenant.theme.colors.error}20` }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: tenant.theme.colors.error }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: textColor }}>
                      {permission === 'denied' ? 'Localização negada' : 'Erro na localização'}
                    </h3>
                    <p className="text-sm" style={{ color: tenant.theme.colors.textMuted }}>
                      {error || 'Não foi possível obter sua localização'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleStart}
                    className="flex-1 h-12 text-base"
                    style={{ 
                      backgroundColor: primaryColor,
                      borderRadius: tenant.theme.borderRadius.md
                    }}
                  >
                    Continuar sem localização
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  {permission !== 'denied' && (
                    <Button
                      variant="outline"
                      onClick={() => setHasRequested(false)}
                      className="h-12"
                      style={{ 
                        borderColor: tenant.theme.colors.border,
                        borderRadius: tenant.theme.borderRadius.md
                      }}
                    >
                      Tentar novamente
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Sparkles className="w-5 h-5" />}
              title="IA Inteligente"
              description="Sugestões personalizadas baseadas nas suas preferências"
              color={primaryColor}
            />
            <FeatureCard
              icon={<Heart className="w-5 h-5" />}
              title="Pet Friendly"
              description="Filtre plantas seguras para seus animais de estimação"
              color={secondaryColor}
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="Estoque Real"
              description="Apenas plantas disponíveis na floricultura"
              color={tenant.theme.colors.accent}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="w-full px-4 sm:px-6 lg:px-8 py-4 text-center text-sm"
        style={{ color: tenant.theme.colors.textMuted }}
      >
        <p>© 2024 {tenant.name} - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  const { tenant } = useTenant();
  
  return (
    <div 
      className="flex flex-col items-center text-center p-4 rounded-lg"
      style={{ 
        backgroundColor: tenant.theme.colors.surface,
        borderRadius: tenant.theme.borderRadius.md 
      }}
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <h4 
        className="font-medium text-sm mb-1"
        style={{ color: tenant.theme.colors.text }}
      >
        {title}
      </h4>
      <p 
        className="text-xs"
        style={{ color: tenant.theme.colors.textMuted }}
      >
        {description}
      </p>
    </div>
  );
}

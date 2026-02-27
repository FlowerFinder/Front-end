import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import type { EnvironmentType, CareLevel, PlantCategory } from '@/types';
import { 
  Home, Sun, Building2, Briefcase, Flower2, 
  Heart, ArrowLeft, ArrowRight, Check, Dog, Cat,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { plantCategories, careLevels, environmentTypes } from '@/data/plants';

const TOTAL_STEPS = 4;

export function QuizWizard() {
  const { tenant, appState, updatePreferences, setView } = useTenant();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<PlantCategory[]>([]);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 500]);

  const { preferences } = appState;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalizar quiz e ir para resultados
      setView('results');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setView('landing');
    }
  };

  const handleEnvironmentSelect = (env: EnvironmentType) => {
    updatePreferences({ environment: env });
    handleNext();
  };

  const handleCareLevelSelect = (level: CareLevel) => {
    updatePreferences({ careLevel: level });
    handleNext();
  };

  const handlePetFriendlySelect = (friendly: boolean) => {
    updatePreferences({ petFriendly: friendly });
    handleNext();
  };

  const handleCategoryToggle = (category: PlantCategory) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      
      updatePreferences({ categories: newCategories });
      return newCategories;
    });
  };

  const handleBudgetChange = (value: number[]) => {
    setBudgetRange([value[0], value[1]]);
    updatePreferences({ budgetRange: [value[0], value[1]] });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepEnvironment
            selected={preferences.environment}
            onSelect={handleEnvironmentSelect}
          />
        );
      case 2:
        return (
          <StepCareLevel
            selected={preferences.careLevel}
            onSelect={handleCareLevelSelect}
          />
        );
      case 3:
        return (
          <StepPetFriendly
            selected={preferences.petFriendly}
            onSelect={handlePetFriendlySelect}
          />
        );
      case 4:
        return (
          <StepCategoriesAndBudget
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            budgetRange={budgetRange}
            onBudgetChange={handleBudgetChange}
            onFinish={handleNext}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: tenant.theme.colors.background }}
    >
      {/* Header com progresso */}
      <header className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <span 
              className="text-sm font-medium"
              style={{ color: tenant.theme.colors.textMuted }}
            >
              Passo {currentStep} de {TOTAL_STEPS}
            </span>
          </div>
          
          {/* Barra de progresso */}
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i < currentStep 
                    ? tenant.theme.colors.primary 
                    : tenant.theme.colors.border,
                }}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Conteúdo do passo */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-2xl">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}

// Passo 1: Ambiente
interface StepEnvironmentProps {
  selected: EnvironmentType | null;
  onSelect: (env: EnvironmentType) => void;
}

function StepEnvironment({ selected, onSelect }: StepEnvironmentProps) {
  const { tenant } = useTenant();
  
  const icons: Record<string, React.ReactNode> = {
    indoor: <Home className="w-6 h-6" />,
    outdoor: <Sun className="w-6 h-6" />,
    balcony: <Building2 className="w-6 h-6" />,
    office: <Briefcase className="w-6 h-6" />,
    garden: <Flower2 className="w-6 h-6" />,
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 
          className="text-2xl sm:text-3xl font-bold"
          style={{ 
            color: tenant.theme.colors.text,
            fontFamily: tenant.theme.typography.headingFont 
          }}
        >
          Onde vai ficar a planta?
        </h2>
        <p style={{ color: tenant.theme.colors.textMuted }}>
          Escolha o ambiente ideal para sua nova planta
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {environmentTypes.map((env) => (
          <button
            key={env.value}
            onClick={() => onSelect(env.value as EnvironmentType)}
            className={cn(
              "p-6 rounded-xl text-left transition-all duration-200 border-2",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
            style={{
              backgroundColor: selected === env.value 
                ? `${tenant.theme.colors.primary}15`
                : tenant.theme.colors.surface,
              borderColor: selected === env.value 
                ? tenant.theme.colors.primary 
                : tenant.theme.colors.border,
              borderRadius: tenant.theme.borderRadius.lg,
            }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: selected === env.value 
                  ? tenant.theme.colors.primary 
                  : `${tenant.theme.colors.primary}20`,
                color: selected === env.value 
                  ? 'white' 
                  : tenant.theme.colors.primary 
              }}
            >
              {icons[env.value]}
            </div>
            <h3 
              className="font-semibold text-lg mb-1"
              style={{ color: tenant.theme.colors.text }}
            >
              {env.label}
            </h3>
            <p 
              className="text-sm"
              style={{ color: tenant.theme.colors.textMuted }}
            >
              {env.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Passo 2: Nível de Cuidado
interface StepCareLevelProps {
  selected: CareLevel | null;
  onSelect: (level: CareLevel) => void;
}

function StepCareLevel({ selected, onSelect }: StepCareLevelProps) {
  const { tenant } = useTenant();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 
          className="text-2xl sm:text-3xl font-bold"
          style={{ 
            color: tenant.theme.colors.text,
            fontFamily: tenant.theme.typography.headingFont 
          }}
        >
          Qual seu nível de experiência?
        </h2>
        <p style={{ color: tenant.theme.colors.textMuted }}>
          Isso nos ajuda a sugerir plantas compatíveis com seus cuidados
        </p>
      </div>

      <div className="space-y-3">
        {careLevels.map((level, index) => (
          <button
            key={level.value}
            onClick={() => onSelect(level.value as CareLevel)}
            className={cn(
              "w-full p-5 rounded-xl text-left transition-all duration-200 border-2 flex items-center gap-4",
              "hover:scale-[1.01] active:scale-[0.99]"
            )}
            style={{
              backgroundColor: selected === level.value 
                ? `${tenant.theme.colors.primary}15`
                : tenant.theme.colors.surface,
              borderColor: selected === level.value 
                ? tenant.theme.colors.primary 
                : tenant.theme.colors.border,
              borderRadius: tenant.theme.borderRadius.lg,
            }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ 
                backgroundColor: selected === level.value 
                  ? tenant.theme.colors.primary 
                  : `${tenant.theme.colors.primary}20`,
                color: selected === level.value 
                  ? 'white' 
                  : tenant.theme.colors.primary 
              }}
            >
              {index + 1}
            </div>
            <div className="flex-1">
              <h3 
                className="font-semibold mb-0.5"
                style={{ color: tenant.theme.colors.text }}
              >
                {level.label}
              </h3>
              <p 
                className="text-sm"
                style={{ color: tenant.theme.colors.textMuted }}
              >
                {level.description}
              </p>
            </div>
            {selected === level.value && (
              <Check 
                className="w-5 h-5 flex-shrink-0" 
                style={{ color: tenant.theme.colors.primary }} 
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Passo 3: Pet Friendly
interface StepPetFriendlyProps {
  selected: boolean | null;
  onSelect: (friendly: boolean) => void;
}

function StepPetFriendly({ selected, onSelect }: StepPetFriendlyProps) {
  const { tenant } = useTenant();

  const options = [
    { value: true, label: 'Sim, tenho pets', icon: <Heart className="w-6 h-6" />, description: 'Mostrar apenas plantas seguras' },
    { value: false, label: 'Não tenho pets', icon: <span className="text-2xl">🏠</span>, description: 'Todas as plantas são válidas' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center gap-2 mb-4">
          <Dog className="w-8 h-8" style={{ color: tenant.theme.colors.primary }} />
          <Cat className="w-8 h-8" style={{ color: tenant.theme.colors.secondary }} />
        </div>
        <h2 
          className="text-2xl sm:text-3xl font-bold"
          style={{ 
            color: tenant.theme.colors.text,
            fontFamily: tenant.theme.typography.headingFont 
          }}
        >
          Você tem pets em casa?
        </h2>
        <p style={{ color: tenant.theme.colors.textMuted }}>
          Algumas plantas podem ser tóxicas para animais
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <button
            key={String(option.value)}
            onClick={() => onSelect(option.value)}
            className={cn(
              "p-6 rounded-xl text-center transition-all duration-200 border-2",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
            style={{
              backgroundColor: selected === option.value 
                ? `${tenant.theme.colors.primary}15`
                : tenant.theme.colors.surface,
              borderColor: selected === option.value 
                ? tenant.theme.colors.primary 
                : tenant.theme.colors.border,
              borderRadius: tenant.theme.borderRadius.lg,
            }}
          >
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ 
                backgroundColor: selected === option.value 
                  ? tenant.theme.colors.primary 
                  : `${tenant.theme.colors.primary}20`,
                color: selected === option.value 
                  ? 'white' 
                  : tenant.theme.colors.primary 
              }}
            >
              {option.icon}
            </div>
            <h3 
              className="font-semibold text-lg mb-1"
              style={{ color: tenant.theme.colors.text }}
            >
              {option.label}
            </h3>
            <p 
              className="text-sm"
              style={{ color: tenant.theme.colors.textMuted }}
            >
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Passo 4: Categorias e Orçamento
interface StepCategoriesAndBudgetProps {
  selectedCategories: PlantCategory[];
  onCategoryToggle: (category: PlantCategory) => void;
  budgetRange: [number, number];
  onBudgetChange: (value: number[]) => void;
  onFinish: () => void;
}

function StepCategoriesAndBudget({
  selectedCategories,
  onCategoryToggle,
  budgetRange,
  onBudgetChange,
  onFinish,
}: StepCategoriesAndBudgetProps) {
  const { tenant } = useTenant();

  const categoryIcons: Record<string, React.ReactNode> = {
    flowers: <Flower2 className="w-5 h-5" />,
    succulents: <span className="text-lg">🌵</span>,
    trees: <span className="text-lg">🌳</span>,
    foliage: <span className="text-lg">🌿</span>,
    herbs: <span className="text-lg">🌱</span>,
    cacti: <span className="text-lg">🌵</span>,
    orchids: <span className="text-lg">🌺</span>,
    bonsai: <span className="text-lg">🎋</span>,
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 
          className="text-2xl sm:text-3xl font-bold"
          style={{ 
            color: tenant.theme.colors.text,
            fontFamily: tenant.theme.typography.headingFont 
          }}
        >
          Quais tipos de plantas?
        </h2>
        <p style={{ color: tenant.theme.colors.textMuted }}>
          Selecione uma ou mais categorias que te interessam
        </p>
      </div>

      {/* Grid de categorias */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {plantCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryToggle(cat.value as PlantCategory)}
            className={cn(
              "p-4 rounded-xl text-center transition-all duration-200 border-2",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
            style={{
              backgroundColor: selectedCategories.includes(cat.value as PlantCategory)
                ? `${tenant.theme.colors.primary}15`
                : tenant.theme.colors.surface,
              borderColor: selectedCategories.includes(cat.value as PlantCategory)
                ? tenant.theme.colors.primary 
                : tenant.theme.colors.border,
              borderRadius: tenant.theme.borderRadius.lg,
            }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ 
                backgroundColor: selectedCategories.includes(cat.value as PlantCategory)
                  ? tenant.theme.colors.primary 
                  : `${tenant.theme.colors.primary}20`,
                color: selectedCategories.includes(cat.value as PlantCategory)
                  ? 'white' 
                  : tenant.theme.colors.primary 
              }}
            >
              {categoryIcons[cat.value]}
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color: tenant.theme.colors.text }}
            >
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Orçamento */}
      <Card 
        className="p-6"
        style={{ 
          backgroundColor: tenant.theme.colors.surface,
          borderColor: tenant.theme.colors.border,
          borderRadius: tenant.theme.borderRadius.lg 
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Wallet 
            className="w-5 h-5" 
            style={{ color: tenant.theme.colors.primary }} 
          />
          <span 
            className="font-medium"
            style={{ color: tenant.theme.colors.text }}
          >
            Faixa de preço
          </span>
        </div>
        
        <Slider
          defaultValue={[0, 500]}
          max={500}
          step={10}
          value={[budgetRange[0], budgetRange[1]]}
          onValueChange={onBudgetChange}
          className="mb-4"
        />
        
        <div className="flex justify-between text-sm">
          <span style={{ color: tenant.theme.colors.textMuted }}>
            R$ {budgetRange[0]}
          </span>
          <span style={{ color: tenant.theme.colors.textMuted }}>
            R$ {budgetRange[1]}+
          </span>
        </div>
      </Card>

      {/* Botão de finalizar */}
      <Button
        onClick={onFinish}
        disabled={selectedCategories.length === 0}
        className="w-full h-14 text-lg"
        style={{ 
          backgroundColor: tenant.theme.colors.primary,
          borderRadius: tenant.theme.borderRadius.lg,
          opacity: selectedCategories.length === 0 ? 0.5 : 1
        }}
      >
        Ver sugestões
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}

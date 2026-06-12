import { useEffect, useRef, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { usePlantSuggestions, useFavorites } from '@/hooks/usePlantSuggestions';
import {
  ArrowLeft, Heart, MapPin, Sparkles,
  ShoppingCart, Check, X, ChevronDown, SlidersHorizontal, Search, Loader2
} from 'lucide-react';
import { searchByTextEmbedding, type VectorHit } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { plantCategories } from '@/data/plants';
import { PlantDetailDialog } from '@/components/PlantDetailDialog';
import { TenantBrand } from '@/components/TenantBrand';
import type { Plant } from '@/types';
import { cn } from '@/lib/utils';

export function ResultsPage() {
  const { tenant, appState, setView, updatePreferences } = useTenant();
  const { preferences } = appState;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'name'>('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHits, setSearchHits] = useState<VectorHit[] | null>(null);
  const [searchState, setSearchState] = useState<'idle' | 'loading-model' | 'searching'>('idle');
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);

  const { 
    suggestions, 
    isLoading, 
    error, 
    generateSuggestions,
    filterByCategory,
    sortBy: setSortType
  } = usePlantSuggestions();
  
  const { toggleFavorite, isFavorite } = useFavorites(tenant.id);

  // Gerar sugestões ao montar
  useEffect(() => {
    generateSuggestions(preferences, tenant.id);
  }, []);

  // Aplicar filtros
  const filteredSuggestions = selectedCategory
    ? filterByCategory(selectedCategory)
    : suggestions;

  // Resultados da busca vetorial têm prioridade sobre os do quiz/chat.
  // Similaridades de cosseno do e5 se concentram em ~0.80-0.90, então o score
  // exibido é rescalado dentro do conjunto retornado (melhor hit ≈ 98%).
  let displayResults = filteredSuggestions;
  if (searchHits) {
    // O filtro de categoria também vale para a busca semântica
    const inCategory = selectedCategory
      ? searchHits.filter((h) => h.plant.category === selectedCategory)
      : searchHits;
    // Corte de relevância: mantém só hits próximos do melhor (evita encher a
    // lista com correspondências fracas quando a consulta é específica).
    const best = inCategory[0]?.similarity ?? 0;
    const relevant = inCategory.filter((h) => h.similarity >= best - 0.035);
    const sims = relevant.map((h) => h.similarity);
    const max = Math.max(...sims);
    const min = Math.min(...sims);
    const spread = Math.max(max - min, 1e-6);
    displayResults = relevant.map((hit) => ({
      plant: hit.plant,
      matchScore: Math.round(60 + 38 * ((hit.similarity - min) / spread)),
      matchReasons: ['Correspondência com sua busca'],
    }));
  }

  // Aplicar ordenação
  useEffect(() => {
    setSortType(sortBy);
  }, [sortBy, setSortType]);

  // De onde o usuário entrou na vitrine (chat ou quiz) — capturado na montagem
  const cameFromChat = useRef(appState.previousView === 'chat');

  const handleBack = () => {
    setView(cameFromChat.current ? 'chat' : 'quiz-step-4');
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
  };

  // Busca vetorial: embedding da pergunta no navegador (e5-small via
  // transformers.js) + ranking por cosseno no DuckDB-WASM sobre o parquet.
  const handleSemanticSearch = async () => {
    const query = searchQuery.trim();
    if (!query || searchState !== 'idle') return;
    try {
      setSearchState('loading-model');
      // Import dinâmico: transformers.js (~30 MB de modelo) só carrega na primeira busca
      const { embedQuery } = await import('@/lib/embedder');
      // Os passages das plantas mencionam o clima em português — anexar o
      // clima da cidade aproxima a consulta das plantas adaptadas à região
      const { climateForCity, CLIMATE_LABEL_PT } = await import('@/hooks/useGeolocation');
      const withLocation = preferences.city
        ? `${query} (clima ${CLIMATE_LABEL_PT[climateForCity(preferences.city)] ?? 'tropical'})`
        : query;
      const queryEmb = await embedQuery(withLocation);
      setSearchState('searching');
      const hits = await searchByTextEmbedding(queryEmb, tenant.id, 24);
      setSearchHits(hits);
    } catch (err) {
      console.error('Erro na busca semântica:', err);
    } finally {
      setSearchState('idle');
    }
  };

  const clearSemanticSearch = () => {
    setSearchHits(null);
    setSearchQuery('');
  };

  const handleStartOver = () => {
    updatePreferences({
      environment: null,
      careLevel: null,
      petFriendly: null,
      budgetRange: null,
      categories: [],
    });
    setView('landing');
  };

  if (isLoading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: tenant.theme.colors.background }}
      >
        <div className="text-center space-y-4">
          <X className="w-16 h-16 mx-auto" style={{ color: tenant.theme.colors.error }} />
          <h2 
            className="text-xl font-semibold"
            style={{ color: tenant.theme.colors.text }}
          >
            {error}
          </h2>
          <Button 
            onClick={() => generateSuggestions(preferences, tenant.id)}
            style={{ backgroundColor: tenant.theme.colors.primary }}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: tenant.theme.colors.background }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-4 backdrop-blur-md"
        style={{ 
          backgroundColor: `${tenant.theme.colors.background}95`,
          borderBottom: `1px solid ${tenant.theme.colors.border}` 
        }}
      >
        <div className="max-w-6xl mx-auto">
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

            <TenantBrand />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartOver}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Nova busca
            </Button>
          </div>

          {/* Título e localização */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 
                className="text-xl sm:text-2xl font-bold"
                style={{ 
                  color: tenant.theme.colors.text,
                  fontFamily: tenant.theme.typography.headingFont 
                }}
              >
                Plantas recomendadas
              </h1>
              {preferences.city && (
                <div 
                  className="flex items-center gap-1 text-sm mt-1"
                  style={{ color: tenant.theme.colors.textMuted }}
                >
                  <MapPin className="w-3 h-3" />
                  <span>Para o clima de {preferences.city}</span>
                </div>
              )}
            </div>
            
            <span
              className="text-sm"
              style={{ color: tenant.theme.colors.textMuted }}
            >
              {displayResults.length} resultado{displayResults.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      {/* Busca semântica (vetorial, 100% no navegador) */}
      <div
        className="w-full px-4 sm:px-6 lg:px-8 py-4"
        style={{ borderBottom: `1px solid ${tenant.theme.colors.border}` }}
      >
        <div className="max-w-6xl mx-auto space-y-2">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
              placeholder='Busca inteligente: ex. "planta que purifica o ar para apartamento escuro"'
              className="flex-1"
              disabled={searchState !== 'idle'}
              style={{ borderColor: tenant.theme.colors.border }}
            />
            <Button
              onClick={handleSemanticSearch}
              disabled={!searchQuery.trim() || searchState !== 'idle'}
              className="gap-2"
              style={{ backgroundColor: tenant.theme.colors.primary }}
            >
              {searchState === 'idle' ? (
                <Search className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span className="hidden sm:inline">
                {searchState === 'loading-model'
                  ? 'Carregando IA...'
                  : searchState === 'searching'
                    ? 'Buscando...'
                    : 'Buscar com IA'}
              </span>
            </Button>
          </div>
          {searchHits && (
            <div className="flex items-center gap-2 text-sm">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${tenant.theme.colors.primary}15`,
                  color: tenant.theme.colors.primary,
                }}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Busca semântica ativa
              </Badge>
              <button
                onClick={clearSemanticSearch}
                className="underline"
                style={{ color: tenant.theme.colors.textMuted }}
              >
                Voltar às sugestões do quiz
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros e ordenação */}
      <div 
        className="w-full px-4 sm:px-6 lg:px-8 py-4"
        style={{ borderBottom: `1px solid ${tenant.theme.colors.border}` }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3">
          {/* Filtro de categorias - Scroll horizontal em mobile */}
          <div className="flex-1 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2">
              <button
                onClick={() => handleCategoryFilter(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === null && "text-white"
                )}
                style={{
                  backgroundColor: selectedCategory === null 
                    ? tenant.theme.colors.primary 
                    : tenant.theme.colors.surface,
                  color: selectedCategory === null 
                    ? 'white' 
                    : tenant.theme.colors.text,
                  border: `1px solid ${selectedCategory === null 
                    ? tenant.theme.colors.primary 
                    : tenant.theme.colors.border}`,
                }}
              >
                Todas
              </button>
              {plantCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryFilter(cat.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    selectedCategory === cat.value && "text-white"
                  )}
                  style={{
                    backgroundColor: selectedCategory === cat.value 
                      ? tenant.theme.colors.primary 
                      : tenant.theme.colors.surface,
                    color: selectedCategory === cat.value 
                      ? 'white' 
                      : tenant.theme.colors.text,
                    border: `1px solid ${selectedCategory === cat.value 
                      ? tenant.theme.colors.primary 
                      : tenant.theme.colors.border}`,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ordenação */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Ordenar
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('relevance')}>
                <Check className={cn("w-4 h-4 mr-2", sortBy !== 'relevance' && "opacity-0")} />
                Relevância
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price-asc')}>
                <Check className={cn("w-4 h-4 mr-2", sortBy !== 'price-asc' && "opacity-0")} />
                Menor preço
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price-desc')}>
                <Check className={cn("w-4 h-4 mr-2", sortBy !== 'price-desc' && "opacity-0")} />
                Maior preço
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                <Check className={cn("w-4 h-4 mr-2", sortBy !== 'name' && "opacity-0")} />
                Nome
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid de resultados */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          {displayResults.length === 0 ? (
            <div className="text-center py-12">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${tenant.theme.colors.primary}15` }}
              >
                <Sparkles 
                  className="w-10 h-10" 
                  style={{ color: tenant.theme.colors.primary }} 
                />
              </div>
              <h3 
                className="text-lg font-semibold mb-2"
                style={{ color: tenant.theme.colors.text }}
              >
                Nenhuma planta encontrada
              </h3>
              <p 
                className="mb-4"
                style={{ color: tenant.theme.colors.textMuted }}
              >
                Tente ajustar seus filtros ou preferências
              </p>
              <Button
                onClick={handleStartOver}
                style={{ backgroundColor: tenant.theme.colors.primary }}
              >
                Refazer busca
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {displayResults.map((result) => (
                <PlantCard
                  key={result.plant.id}
                  result={result}
                  isFavorite={isFavorite(result.plant.id)}
                  onToggleFavorite={() => toggleFavorite(result.plant.id)}
                  onOpenDetail={() => setDetailPlant(result.plant as Plant)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <PlantDetailDialog plant={detailPlant} onClose={() => setDetailPlant(null)} />
    </div>
  );
}

// Card de planta
interface PlantCardProps {
  result: {
    plant: {
      id: string;
      name: string;
      scientificName: string;
      description: string;
      price: number;
      originalPrice?: number;
      image: string;
      category: string;
      petFriendly: boolean;
      stock: number;
      careLevel: string;
    };
    matchScore: number;
    matchReasons: string[];
  };
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenDetail: () => void;
}

function PlantCard({ result, isFavorite, onToggleFavorite, onOpenDetail }: PlantCardProps) {
  const { tenant } = useTenant();
  const { plant, matchScore, matchReasons } = result;

  const categoryLabels: Record<string, string> = {
    flowers: 'Flor',
    succulents: 'Suculenta',
    trees: 'Árvore',
    foliage: 'Folhagem',
    herbs: 'Erva',
    cacti: 'Cacto',
    orchids: 'Orquídea',
    bonsai: 'Bonsai',
  };

  const careLevelLabels: Record<string, string> = {
    beginner: 'Iniciante',
    easy: 'Fácil',
    moderate: 'Moderado',
    advanced: 'Avançado',
    expert: 'Expert',
  };

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:shadow-lg group"
      style={{ 
        backgroundColor: tenant.theme.colors.surface,
        borderColor: tenant.theme.colors.border,
        borderRadius: tenant.theme.borderRadius.lg 
      }}
    >
      {/* Imagem */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer"
        onClick={onOpenDetail}
      >
        <img
          src={plant.image}
          alt={plant.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x400/${tenant.theme.colors.primary.replace('#', '')}/white?text=${encodeURIComponent(plant.name)}`;
          }}
        />
        
        {/* Badge de match */}
        <div 
          className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: tenant.theme.colors.primary,
            color: 'white'
          }}
        >
          {matchScore}% match
        </div>

        {/* Badge de estoque */}
        {plant.stock <= 5 && plant.stock > 0 && (
          <div 
            className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: tenant.theme.colors.warning,
              color: 'white'
            }}
          >
            Apenas {plant.stock} restantes
          </div>
        )}

        {/* Botão de favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ 
            backgroundColor: isFavorite 
              ? tenant.theme.colors.error 
              : 'white',
            color: isFavorite ? 'white' : tenant.theme.colors.textMuted
          }}
        >
          <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
        </button>

        {/* Badge Pet Friendly */}
        {plant.petFriendly && (
          <div 
            className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
            style={{ 
              backgroundColor: tenant.theme.colors.success,
              color: 'white'
            }}
          >
            <span>🐾</span>
            Pet friendly
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {/* Categoria e nível */}
        <div className="flex items-center gap-2 mb-2">
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{ 
              backgroundColor: `${tenant.theme.colors.primary}15`,
              color: tenant.theme.colors.primary 
            }}
          >
            {categoryLabels[plant.category] || plant.category}
          </Badge>
          <Badge 
            variant="outline" 
            className="text-xs"
          >
            {careLevelLabels[plant.careLevel]}
          </Badge>
        </div>

        {/* Nome */}
        <h3
          className="font-semibold text-lg mb-1 line-clamp-1 cursor-pointer hover:underline"
          style={{ color: tenant.theme.colors.text }}
          onClick={onOpenDetail}
        >
          {plant.name}
        </h3>
        <p 
          className="text-xs italic mb-2"
          style={{ color: tenant.theme.colors.textMuted }}
        >
          {plant.scientificName}
        </p>

        {/* Razões do match */}
        <div className="flex flex-wrap gap-1 mb-3">
          {matchReasons.slice(0, 2).map((reason, i) => (
            <span 
              key={i}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${tenant.theme.colors.secondary}15`,
                color: tenant.theme.colors.secondary 
              }}
            >
              {reason}
            </span>
          ))}
        </div>

        {/* Preço e ação */}
        <div className="flex items-center justify-between">
          <div>
            <span 
              className="text-lg font-bold"
              style={{ color: tenant.theme.colors.primary }}
            >
              R$ {plant.price.toFixed(2)}
            </span>
            {plant.originalPrice && (
              <span 
                className="text-sm line-through ml-2"
                style={{ color: tenant.theme.colors.textMuted }}
              >
                R$ {plant.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          <Button
            size="sm"
            className="gap-1"
            style={{ 
              backgroundColor: tenant.theme.colors.primary,
              borderRadius: tenant.theme.borderRadius.md 
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Skeleton de loading
function ResultsSkeleton() {
  const { tenant } = useTenant();
  
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: tenant.theme.colors.background }}
    >
      <header className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
      </header>
      
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex gap-2">
          <Skeleton className="h-10 w-20 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-32" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

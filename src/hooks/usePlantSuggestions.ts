import { useState, useCallback, useMemo } from 'react';
import type { Plant, UserPreferences, SuggestionResult, CareLevel, EnvironmentType } from '@/types';
import { getPlantsByTenant } from '@/data/plants';
import { useClimateFromLocation } from './useGeolocation';

interface UsePlantSuggestionsReturn {
  suggestions: SuggestionResult[];
  isLoading: boolean;
  error: string | null;
  generateSuggestions: (preferences: UserPreferences, tenantId: string) => void;
  filterByCategory: (category: string | null) => SuggestionResult[];
  sortBy: (sortType: 'relevance' | 'price-asc' | 'price-desc' | 'name') => void;
}

// Pontuação de correspondência entre níveis de cuidado
const careLevelScore: Record<CareLevel, number> = {
  beginner: 1,
  easy: 2,
  moderate: 3,
  advanced: 4,
  expert: 5,
};

export function usePlantSuggestions(): UsePlantSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'relevance' | 'price-asc' | 'price-desc' | 'name'>('relevance');

  const climate = useClimateFromLocation(suggestions[0]?.plant.tenantId || null);

  const generateSuggestions = useCallback((preferences: UserPreferences, tenantId: string) => {
    setIsLoading(true);
    setError(null);

    // Simular delay de processamento da IA
    setTimeout(() => {
      try {
        const plants = getPlantsByTenant(tenantId);
        const results: SuggestionResult[] = [];

        for (const plant of plants) {
          let score = 0;
          const reasons: string[] = [];

          // 1. Correspondência de ambiente (peso: 30%)
          if (preferences.environment && plant.environment.includes(preferences.environment)) {
            score += 30;
            const envLabels: Record<EnvironmentType, string> = {
              indoor: 'dentro de casa',
              outdoor: 'área externa',
              balcony: 'varanda',
              garden: 'jardim',
              office: 'escritório',
              bathroom: 'banheiro',
              kitchen: 'cozinha',
            };
            reasons.push(`Perfeita para ${envLabels[preferences.environment]}`);
          }

          // 2. Correspondência de nível de cuidado (peso: 25%)
          if (preferences.careLevel) {
            const userCare = careLevelScore[preferences.careLevel];
            const plantCare = careLevelScore[plant.careLevel];
            const careDiff = Math.abs(userCare - plantCare);
            
            if (careDiff === 0) {
              score += 25;
              reasons.push('Nível de cuidado ideal para você');
            } else if (careDiff === 1) {
              score += 15;
              reasons.push('Cuidado compatível com sua experiência');
            } else if (userCare > plantCare) {
              score += 10;
              reasons.push('Muito fácil de cuidar');
            }
          }

          // 3. Pet friendly (peso: 20%)
          if (preferences.petFriendly !== null) {
            if (preferences.petFriendly && plant.petFriendly) {
              score += 20;
              reasons.push('Segura para pets');
            } else if (!preferences.petFriendly) {
              score += 10; // Não penaliza se o usuário não tem pets
            }
          }

          // 4. Orçamento (peso: 15%)
          if (preferences.budgetRange) {
            const [min, max] = preferences.budgetRange;
            if (plant.price >= min && plant.price <= max) {
              score += 15;
              reasons.push('Dentro do seu orçamento');
            } else if (plant.price < min) {
              score += 10;
              reasons.push('Preço abaixo do esperado');
            } else if (plant.price <= max * 1.2) {
              score += 5;
              reasons.push('Próximo ao seu orçamento');
            }
          }

          // 5. Categorias preferidas (peso: 10%)
          if (preferences.categories.length > 0) {
            if (preferences.categories.includes(plant.category)) {
              score += 10;
              reasons.push('Da categoria que você prefere');
            }
          }

          // 6. Bônus: Clima local (peso: bônus até 15%)
          if (preferences.city && plant.climate.includes(climate as any)) {
            score += 15;
            reasons.push(`Ideal para o clima de ${preferences.city}`);
          }

          // 7. Bônus: Disponibilidade em estoque
          if (plant.stock > 10) {
            score += 5;
          }

          // 8. Penalidade: Pouco estoque
          if (plant.stock < 5) {
            score -= 5;
          }

          // Normalizar score para 0-100
          const normalizedScore = Math.min(100, Math.max(0, score));

          if (normalizedScore > 20) { // Só inclui plantas com alguma correspondência
            results.push({
              plant,
              matchScore: normalizedScore,
              matchReasons: reasons.slice(0, 3), // Máximo 3 razões
            });
          }
        }

        // Ordenar por score
        results.sort((a, b) => b.matchScore - a.matchScore);

        setSuggestions(results);
        setIsLoading(false);
      } catch (err) {
        setError('Erro ao gerar sugestões. Tente novamente.');
        setIsLoading(false);
      }
    }, 1500); // Delay de 1.5s para simular processamento
  }, [climate]);

  const filterByCategory = useCallback((category: string | null): SuggestionResult[] => {
    if (!category) return suggestions;
    return suggestions.filter(s => s.plant.category === category);
  }, [suggestions]);

  const sortedSuggestions = useMemo(() => {
    const sorted = [...suggestions];
    
    switch (sortType) {
      case 'price-asc':
        sorted.sort((a, b) => a.plant.price - b.plant.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.plant.price - a.plant.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.plant.name.localeCompare(b.plant.name));
        break;
      case 'relevance':
      default:
        sorted.sort((a, b) => b.matchScore - a.matchScore);
        break;
    }
    
    return sorted;
  }, [suggestions, sortType]);

  const sortBy = useCallback((newSortType: 'relevance' | 'price-asc' | 'price-desc' | 'name') => {
    setSortType(newSortType);
  }, []);

  return {
    suggestions: sortedSuggestions,
    isLoading,
    error,
    generateSuggestions,
    filterByCategory,
    sortBy,
  };
}

// Hook para favoritos
export function useFavorites(tenantId: string) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem(`favorites_${tenantId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = useCallback((plantId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(plantId)
        ? prev.filter(id => id !== plantId)
        : [...prev, plantId];
      
      localStorage.setItem(`favorites_${tenantId}`, JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, [tenantId]);

  const isFavorite = useCallback((plantId: string) => {
    return favorites.includes(plantId);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}

// Hook para carrinho
export function useCart(tenantId: string) {
  const [cart, setCart] = useState<{ plant: Plant; quantity: number }[]>(() => {
    const saved = localStorage.getItem(`cart_${tenantId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const addToCart = useCallback((plant: Plant, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.plant.id === plant.id);
      let newCart;
      
      if (existing) {
        newCart = prev.map(item =>
          item.plant.id === plant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prev, { plant, quantity }];
      }
      
      localStorage.setItem(`cart_${tenantId}`, JSON.stringify(newCart));
      return newCart;
    });
  }, [tenantId]);

  const removeFromCart = useCallback((plantId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.plant.id !== plantId);
      localStorage.setItem(`cart_${tenantId}`, JSON.stringify(newCart));
      return newCart;
    });
  }, [tenantId]);

  const updateQuantity = useCallback((plantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(plantId);
      return;
    }
    
    setCart(prev => {
      const newCart = prev.map(item =>
        item.plant.id === plantId ? { ...item, quantity } : item
      );
      localStorage.setItem(`cart_${tenantId}`, JSON.stringify(newCart));
      return newCart;
    });
  }, [tenantId, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem(`cart_${tenantId}`);
  }, [tenantId]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.plant.price * item.quantity, 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}

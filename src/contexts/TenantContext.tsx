import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { TenantConfig, AppState, UserPreferences, ViewType } from '@/types';
import { getTenantFromURL, defaultTenant } from '@/data/tenants';

interface TenantContextType {
  tenant: TenantConfig;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setView: (view: ViewType) => void;
  toggleKioskMode: () => void;
  isLoading: boolean;
}

const defaultAppState: AppState = {
  currentView: 'landing',
  isKioskMode: false,
  preferences: {
    environment: null,
    careLevel: null,
    petFriendly: null,
    budgetRange: null,
    categories: [],
    location: null,
    city: undefined,
    state: undefined,
  },
  searchResults: [],
  selectedPlant: null,
  favorites: [],
  cart: [],
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig>(defaultTenant);
  const [appState, setAppState] = useState<AppState>(defaultAppState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar tenant da URL
    const currentTenant = getTenantFromURL();
    setTenant(currentTenant);
    
    // Verificar se há estado salvo no localStorage
    const savedState = localStorage.getItem(`floraconcierge_state_${currentTenant.id}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setAppState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Erro ao carregar estado:', e);
      }
    }
    
    // Verificar modo kiosk na URL
    const urlParams = new URLSearchParams(window.location.search);
    const kioskMode = urlParams.get('kiosk') === 'true';
    if (kioskMode) {
      setAppState(prev => ({ ...prev, isKioskMode: true }));
    }
    
    setIsLoading(false);
  }, []);

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(
        `floraconcierge_state_${tenant.id}`,
        JSON.stringify({
          preferences: appState.preferences,
          favorites: appState.favorites,
          cart: appState.cart,
        })
      );
    }
  }, [appState.preferences, appState.favorites, appState.cart, tenant.id, isLoading]);

  // Aplicar tema do tenant ao documento
  useEffect(() => {
    const root = document.documentElement;
    const { colors, borderRadius, typography } = tenant.theme;
    
    // Cores
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-light', colors.primaryLight);
    root.style.setProperty('--primary-dark', colors.primaryDark);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-light', colors.secondaryLight);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--surface', colors.surface);
    root.style.setProperty('--text', colors.text);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--error', colors.error);
    
    // Border radius
    root.style.setProperty('--radius-sm', borderRadius.sm);
    root.style.setProperty('--radius-md', borderRadius.md);
    root.style.setProperty('--radius-lg', borderRadius.lg);
    root.style.setProperty('--radius-xl', borderRadius.xl);
    root.style.setProperty('--radius-full', borderRadius.full);
    
    // Tipografia
    root.style.setProperty('--font-family', typography.fontFamily);
    root.style.setProperty('--font-heading', typography.headingFont || typography.fontFamily);
    
    // Atualizar meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.primary);
    }
    
    // Atualizar título
    document.title = tenant.name;
  }, [tenant]);

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    setAppState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
    }));
  };

  const setView = (view: ViewType) => {
    setAppState(prev => ({ ...prev, currentView: view }));
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleKioskMode = () => {
    setAppState(prev => ({ ...prev, isKioskMode: !prev.isKioskMode }));
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        appState,
        setAppState,
        updatePreferences,
        setView,
        toggleKioskMode,
        isLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
}

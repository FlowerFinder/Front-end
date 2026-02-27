// Dados mock de floriculturas para demonstração White-Label

import type { TenantConfig } from '@/types';

export const defaultTenant: TenantConfig = {
  id: 'default',
  name: 'FloraConcierge',
  logo: '/logos/default-logo.svg',
  theme: {
    colors: {
      primary: '#22c55e',
      primaryLight: '#4ade80',
      primaryDark: '#16a34a',
      secondary: '#84cc16',
      secondaryLight: '#a3e635',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#e2e8f0',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Poppins, sans-serif',
      baseSize: '16px',
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
  },
  contact: {
    phone: '(11) 99999-9999',
    whatsapp: '(11) 99999-9999',
    email: 'contato@floraconcierge.com.br',
    address: 'Av. das Flores, 123 - São Paulo, SP',
    workingHours: 'Seg-Sáb: 8h às 18h',
    socialMedia: {
      instagram: '@floraconcierge',
      facebook: 'floraconcierge',
      website: 'www.floraconcierge.com.br',
    },
  },
  features: {
    enableGeolocation: true,
    enableQuiz: true,
    enableChat: true,
    enableKioskMode: true,
    showPrices: true,
    showStock: true,
    enableOnlinePurchase: true,
  },
};

export const jardimEncantado: TenantConfig = {
  id: 'jardim-encantado',
  name: 'Jardim Encantado',
  logo: '/logos/jardim-encantado-logo.svg',
  theme: {
    colors: {
      primary: '#8b5cf6',
      primaryLight: '#a78bfa',
      primaryDark: '#7c3aed',
      secondary: '#ec4899',
      secondaryLight: '#f472b6',
      accent: '#fbbf24',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#2e1065',
      textMuted: '#7c3aed',
      border: '#e9d5ff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      fontFamily: 'Nunito, system-ui, sans-serif',
      headingFont: 'Playfair Display, serif',
      baseSize: '16px',
    },
    borderRadius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      full: '9999px',
    },
  },
  contact: {
    phone: '(15) 3234-5678',
    whatsapp: '(15) 99876-5432',
    email: 'ola@jardimencantado.com.br',
    address: 'Rua das Orquídeas, 456 - Sorocaba, SP',
    workingHours: 'Seg-Sex: 9h às 19h | Sáb: 9h às 14h',
    socialMedia: {
      instagram: '@jardimencantado',
      facebook: 'jardimencantadosorocaba',
      website: 'www.jardimencantado.com.br',
    },
  },
  features: {
    enableGeolocation: true,
    enableQuiz: true,
    enableChat: true,
    enableKioskMode: true,
    showPrices: true,
    showStock: true,
    enableOnlinePurchase: false,
  },
};

export const verdeVida: TenantConfig = {
  id: 'verde-vida',
  name: 'Verde Vida Plantas',
  logo: '/logos/verde-vida-logo.svg',
  theme: {
    colors: {
      primary: '#059669',
      primaryLight: '#10b981',
      primaryDark: '#047857',
      secondary: '#0d9488',
      secondaryLight: '#14b8a6',
      accent: '#f97316',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#064e3b',
      textMuted: '#059669',
      border: '#d1fae5',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      fontFamily: 'DM Sans, system-ui, sans-serif',
      headingFont: 'DM Serif Display, serif',
      baseSize: '16px',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
  },
  contact: {
    phone: '(11) 4567-8901',
    whatsapp: '(11) 98765-4321',
    email: 'contato@verdevida.com.br',
    address: 'Av. Verde, 789 - São Paulo, SP',
    workingHours: 'Seg-Sáb: 8h às 20h | Dom: 9h às 14h',
    socialMedia: {
      instagram: '@verdevidaplantas',
      facebook: 'verdevidaplantas',
      website: 'www.verdevida.com.br',
    },
  },
  features: {
    enableGeolocation: true,
    enableQuiz: true,
    enableChat: false,
    enableKioskMode: true,
    showPrices: true,
    showStock: true,
    enableOnlinePurchase: true,
  },
};

export const floriculturaBella: TenantConfig = {
  id: 'floricultura-bella',
  name: 'Bella Flores',
  logo: '/logos/bella-flores-logo.svg',
  theme: {
    colors: {
      primary: '#e11d48',
      primaryLight: '#fb7185',
      primaryDark: '#be123c',
      secondary: '#f43f5e',
      secondaryLight: '#fda4af',
      accent: '#8b5cf6',
      background: '#fff1f2',
      surface: '#ffffff',
      text: '#881337',
      textMuted: '#e11d48',
      border: '#fecdd3',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      fontFamily: 'Lato, system-ui, sans-serif',
      headingFont: 'Great Vibes, cursive',
      baseSize: '16px',
    },
    borderRadius: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      full: '9999px',
    },
  },
  contact: {
    phone: '(21) 3333-4444',
    whatsapp: '(21) 98888-7777',
    email: 'atendimento@bellaflores.com.br',
    address: 'Rua das Rosas, 321 - Rio de Janeiro, RJ',
    workingHours: 'Seg-Sáb: 8h às 18h',
    socialMedia: {
      instagram: '@bellafloresrj',
      facebook: 'bellafloresrj',
      website: 'www.bellaflores.com.br',
    },
  },
  features: {
    enableGeolocation: true,
    enableQuiz: true,
    enableChat: true,
    enableKioskMode: true,
    showPrices: true,
    showStock: false,
    enableOnlinePurchase: true,
  },
};

export const naturaJardins: TenantConfig = {
  id: 'natura-jardins',
  name: 'Natura Jardins',
  logo: '/logos/natura-jardins-logo.svg',
  theme: {
    colors: {
      primary: '#d97706',
      primaryLight: '#f59e0b',
      primaryDark: '#b45309',
      secondary: '#65a30d',
      secondaryLight: '#84cc16',
      accent: '#06b6d4',
      background: '#fffbeb',
      surface: '#ffffff',
      text: '#78350f',
      textMuted: '#d97706',
      border: '#fde68a',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      fontFamily: 'Source Sans 3, system-ui, sans-serif',
      headingFont: 'Merriweather, serif',
      baseSize: '16px',
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
  },
  contact: {
    phone: '(31) 4444-5555',
    whatsapp: '(31) 97777-6666',
    email: 'contato@naturajardins.com.br',
    address: 'Av. das Palmeiras, 555 - Belo Horizonte, MG',
    workingHours: 'Seg-Sex: 8h às 18h | Sáb: 8h às 12h',
    socialMedia: {
      instagram: '@naturajardinsbh',
      facebook: 'naturajardinsbh',
      website: 'www.naturajardins.com.br',
    },
  },
  features: {
    enableGeolocation: true,
    enableQuiz: true,
    enableChat: false,
    enableKioskMode: true,
    showPrices: true,
    showStock: true,
    enableOnlinePurchase: false,
  },
};

// Mapa de tenants para fácil acesso
export const tenants: Record<string, TenantConfig> = {
  default: defaultTenant,
  'jardim-encantado': jardimEncantado,
  'verde-vida': verdeVida,
  'floricultura-bella': floriculturaBella,
  'natura-jardins': naturaJardins,
};

// Função para obter tenant por ID
export function getTenantById(id: string): TenantConfig {
  return tenants[id] || defaultTenant;
}

// Função para obter tenant da URL (subdomínio ou parâmetro)
export function getTenantFromURL(): TenantConfig {
  if (typeof window === 'undefined') return defaultTenant;
  
  const urlParams = new URLSearchParams(window.location.search);
  const tenantId = urlParams.get('tenant');
  
  if (tenantId && tenants[tenantId]) {
    return tenants[tenantId];
  }
  
  // Verificar hostname para subdomínio
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  if (subdomain && tenants[subdomain]) {
    return tenants[subdomain];
  }
  
  return defaultTenant;
}

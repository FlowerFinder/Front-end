// Tipos para o sistema White-Label de Floriculturas

export interface TenantConfig {
  id: string;
  name: string;
  logo: string;
  favicon?: string;
  theme: ThemeConfig;
  contact: ContactInfo;
  features: FeatureFlags;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;
    headingFont?: string;
    baseSize: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
}

export interface ContactInfo {
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  workingHours: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
}

export interface FeatureFlags {
  enableGeolocation: boolean;
  enableQuiz: boolean;
  enableChat: boolean;
  enableKioskMode: boolean;
  showPrices: boolean;
  showStock: boolean;
  enableOnlinePurchase: boolean;
}

export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  gallery?: string[];
  category: PlantCategory;
  tags: string[];
  careLevel: CareLevel;
  environment: EnvironmentType[];
  petFriendly: boolean;
  stock: number;
  isAvailable: boolean;
  climate: ClimateType[];
  sunlight: SunlightType;
  wateringFrequency: string;
  benefits: string[];
  size: {
    height: string;
    width: string;
  };
  tenantId: string;
}

export type PlantCategory = 
  | 'flowers' 
  | 'succulents' 
  | 'trees' 
  | 'foliage' 
  | 'herbs' 
  | 'cacti' 
  | 'orchids' 
  | 'bonsai';

export type CareLevel = 'beginner' | 'easy' | 'moderate' | 'advanced' | 'expert';

export type EnvironmentType = 'indoor' | 'outdoor' | 'balcony' | 'garden' | 'office' | 'bathroom' | 'kitchen';

export type ClimateType = 'tropical' | 'subtropical' | 'temperate' | 'arid' | 'mediterranean' | 'continental';

export type SunlightType = 'full-sun' | 'partial-sun' | 'indirect-light' | 'shade';

export interface UserPreferences {
  environment: EnvironmentType | null;
  careLevel: CareLevel | null;
  petFriendly: boolean | null;
  budgetRange: [number, number] | null;
  categories: PlantCategory[];
  location: GeolocationPosition | null;
  city?: string;
  state?: string;
}

export interface QuizStep {
  id: string;
  title: string;
  description: string;
  type: 'single' | 'multiple' | 'boolean' | 'range';
  options?: QuizOption[];
  field: keyof UserPreferences;
}

export interface QuizOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  image?: string;
}

export interface AppState {
  currentView: ViewType;
  isKioskMode: boolean;
  preferences: UserPreferences;
  searchResults: Plant[];
  selectedPlant: Plant | null;
  favorites: string[];
  cart: CartItem[];
}

export type ViewType = 
  | 'landing' 
  | 'mode-selection'
  | 'chat'
  | 'quiz' 
  | 'quiz-step-1' 
  | 'quiz-step-2' 
  | 'quiz-step-3' 
  | 'quiz-step-4'
  | 'results' 
  | 'plant-detail' 
  | 'favorites' 
  | 'cart';

export interface CartItem {
  plant: Plant;
  quantity: number;
}

export interface SuggestionResult {
  plant: Plant;
  matchScore: number;
  matchReasons: string[];
}

// Configurações de modo de exibição
export interface DisplayMode {
  type: 'web' | 'kiosk';
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    kiosk: string;
  };
  kioskSettings?: {
    idleTimeout: number; // em segundos
    showScreensaver: boolean;
    screensaverContent?: string;
    buttonMinSize: number;
    inputType: 'touch' | 'virtual-keyboard';
  };
}

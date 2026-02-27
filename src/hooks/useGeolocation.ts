import { useState, useCallback, useEffect } from 'react';

interface GeolocationState {
  position: GeolocationPosition | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isLoading: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
}

// Mock de cidades para demonstração (em produção, usaria API de geocoding)
const mockLocations: Record<string, { city: string; state: string; country: string }> = {
  'sao-paulo': { city: 'São Paulo', state: 'SP', country: 'Brasil' },
  'sorocaba': { city: 'Sorocaba', state: 'SP', country: 'Brasil' },
  'rio-de-janeiro': { city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
  'belo-horizonte': { city: 'Belo Horizonte', state: 'MG', country: 'Brasil' },
  'curitiba': { city: 'Curitiba', state: 'PR', country: 'Brasil' },
  'porto-alegre': { city: 'Porto Alegre', state: 'RS', country: 'Brasil' },
  'salvador': { city: 'Salvador', state: 'BA', country: 'Brasil' },
  'brasilia': { city: 'Brasília', state: 'DF', country: 'Brasil' },
};

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    city: null,
    state: null,
    country: null,
    isLoading: false,
    error: null,
    permission: 'unknown',
  });

  // Verificar permissão ao montar
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, permission: 'denied', error: 'Geolocalização não suportada' }));
      return;
    }

    try {
      // @ts-ignore - Permissions API pode não estar disponível em todos os navegadores
      if (navigator.permissions && navigator.permissions.query) {
        // @ts-ignore
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ ...prev, permission: result.state as any }));
        
        result.addEventListener('change', () => {
          setState(prev => ({ ...prev, permission: result.state as any }));
        });
      }
    } catch (e) {
      console.log('Permissions API não disponível');
    }
  };

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: 'Seu navegador não suporta geolocalização',
        permission: 'denied'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      });

      // Simular obtenção de cidade a partir das coordenadas
      // Em produção, usaríamos uma API de reverse geocoding
      const location = getMockLocationFromCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );

      setState({
        position,
        city: location.city,
        state: location.state,
        country: location.country,
        isLoading: false,
        error: null,
        permission: 'granted',
      });
    } catch (error: any) {
      let errorMessage = 'Não foi possível obter sua localização';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permissão de localização negada. Você pode continuar sem localização.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Informação de localização indisponível.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tempo esgotado ao obter localização.';
          break;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        permission: error.code === error.PERMISSION_DENIED ? 'denied' : 'prompt',
      }));
    }
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      position: null,
      city: null,
      state: null,
      country: null,
      isLoading: false,
      error: null,
      permission: 'unknown',
    });
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation,
  };
}

// Função mock para simular obtenção de cidade a partir de coordenadas
function getMockLocationFromCoordinates(lat: number, lng: number): { city: string; state: string; country: string } {
  // Simular diferentes regiões baseado nas coordenadas
  // Isso é apenas para demonstração
  
  // São Paulo aproximado: -23.5, -46.6
  if (lat > -24 && lat < -23 && lng > -47 && lng < -46) {
    return mockLocations['sao-paulo'];
  }
  
  // Rio de Janeiro aproximado: -22.9, -43.2
  if (lat > -23.5 && lat < -22.5 && lng > -44 && lng < -43) {
    return mockLocations['rio-de-janeiro'];
  }
  
  // Belo Horizonte aproximado: -19.9, -43.9
  if (lat > -20.5 && lat < -19.5 && lng > -44.5 && lng < -43.5) {
    return mockLocations['belo-horizonte'];
  }
  
  // Curitiba aproximado: -25.4, -49.3
  if (lat > -26 && lat < -25 && lng > -50 && lng < -49) {
    return mockLocations['curitiba'];
  }
  
  // Porto Alegre aproximado: -30.0, -51.2
  if (lat > -31 && lat < -29.5 && lng > -52 && lng < -50.5) {
    return mockLocations['porto-alegre'];
  }
  
  // Salvador aproximado: -12.9, -38.5
  if (lat > -14 && lat < -12 && lng > -39 && lng < -38) {
    return mockLocations['salvador'];
  }
  
  // Brasília aproximado: -15.8, -47.9
  if (lat > -16.5 && lat < -15 && lng > -48.5 && lng < -47.5) {
    return mockLocations['brasilia'];
  }
  
  // Sorocaba aproximado: -23.5, -47.4
  if (lat > -24 && lat < -23 && lng > -48 && lng < -47) {
    return mockLocations['sorocaba'];
  }
  
  // Default para São Paulo
  return mockLocations['sao-paulo'];
}

// Hook para detectar clima baseado na localização
export function useClimateFromLocation(location: string | null): string {
  if (!location) return 'tropical';
  
  const climateMap: Record<string, string> = {
    'São Paulo': 'subtropical',
    'Sorocaba': 'subtropical',
    'Rio de Janeiro': 'tropical',
    'Belo Horizonte': 'tropical',
    'Curitiba': 'temperate',
    'Porto Alegre': 'subtropical',
    'Salvador': 'tropical',
    'Brasília': 'tropical',
  };
  
  return climateMap[location] || 'tropical';
}

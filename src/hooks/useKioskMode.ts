import { useState, useEffect, useCallback, useRef } from 'react';

interface KioskConfig {
  idleTimeout: number; // em segundos
  showScreensaver: boolean;
  screensaverContent?: string;
  buttonMinSize: number;
  inputType: 'touch' | 'virtual-keyboard';
}

interface UseKioskModeReturn {
  isIdle: boolean;
  lastActivity: number;
  resetIdle: () => void;
  config: KioskConfig;
  updateConfig: (config: Partial<KioskConfig>) => void;
}

const defaultConfig: KioskConfig = {
  idleTimeout: 60, // 60 segundos de inatividade
  showScreensaver: true,
  screensaverContent: 'Toque na tela para começar',
  buttonMinSize: 48, // 48px mínimo para touch
  inputType: 'touch',
};

export function useKioskMode(
  enabled: boolean,
  initialConfig: Partial<KioskConfig> = {}
): UseKioskModeReturn {
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [config, setConfig] = useState<KioskConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityListenersRef = useRef<(() => void)[]>([]);

  const resetIdle = useCallback(() => {
    setLastActivity(Date.now());
    setIsIdle(false);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<KioskConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Configurar listeners de atividade
  useEffect(() => {
    if (!enabled) {
      setIsIdle(false);
      return;
    }

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'click',
    ];

    const handleActivity = () => {
      resetIdle();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    activityListenersRef.current.push(() => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    });

    return () => {
      activityListenersRef.current.forEach(cleanup => cleanup());
      activityListenersRef.current = [];
    };
  }, [enabled, resetIdle]);

  // Timer de inatividade
  useEffect(() => {
    if (!enabled) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      return;
    }

    const checkIdle = () => {
      const idleTime = Date.now() - lastActivity;
      const timeoutMs = config.idleTimeout * 1000;

      if (idleTime >= timeoutMs) {
        setIsIdle(true);
      } else {
        // Agendar próxima verificação
        idleTimerRef.current = setTimeout(checkIdle, timeoutMs - idleTime);
      }
    };

    // Iniciar timer
    idleTimerRef.current = setTimeout(checkIdle, config.idleTimeout * 1000);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [enabled, lastActivity, config.idleTimeout]);

  // Prevenir comportamentos indesejados no modo kiosk
  useEffect(() => {
    if (!enabled) return;

    // Prevenir zoom com pinch
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevenir menu de contexto
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevenir seleção de texto
    const preventSelection = (e: Event) => {
      e.preventDefault();
    };

    // Prevenir atalhos de teclado
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevenir F5 (refresh), F11 (fullscreen), Ctrl+R, Ctrl+T, etc.
      if (
        e.key === 'F5' ||
        e.key === 'F11' ||
        (e.ctrlKey && (e.key === 'r' || e.key === 't' || e.key === 'n' || e.key === 'w')) ||
        (e.metaKey && (e.key === 'r' || e.key === 't' || e.key === 'n' || e.key === 'w'))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('keydown', preventKeyboardShortcuts);

    // Esconder cursor (opcional, pode ser configurável)
    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      document.body.style.cursor = '';
    };
  }, [enabled]);

  return {
    isIdle,
    lastActivity,
    resetIdle,
    config,
    updateConfig,
  };
}

// Hook para detectar se é um dispositivo touch
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);

    return () => {
      window.removeEventListener('resize', checkTouch);
    };
  }, []);

  return isTouch;
}

// Hook para otimizar inputs para touch
export function useTouchInput() {
  const isTouch = useTouchDevice();

  const getInputProps = useCallback(() => {
    if (!isTouch) return {};

    return {
      inputMode: 'text' as const,
      autoComplete: 'off',
      autoCorrect: 'off',
      autoCapitalize: 'off',
      spellCheck: false,
    };
  }, [isTouch]);

  return {
    isTouch,
    getInputProps,
  };
}

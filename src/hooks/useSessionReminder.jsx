import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

// Puedes llamar: useSessionReminder(15_000) o useSessionReminder({ inactivityMs: 15_000, reminderSeconds: 15 })
const useSessionReminder = (optionsOrMs = 15 * 60 * 1000) => { // 15 minutos por defecto
  const inactivityTime = typeof optionsOrMs === 'number' ? optionsOrMs : (optionsOrMs?.inactivityMs ?? 15 * 60 * 1000);
  const reminderSeconds = typeof optionsOrMs === 'number' ? 2 * 60 : (optionsOrMs?.reminderSeconds ?? 2 * 60); // 2 minutos por defecto
  const [showReminder, setShowReminder] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { logout, isAuthenticated } = useAuth();

  const resetTimer = useCallback(() => {
    setShowReminder(false);
    setTimeLeft(0);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setShowReminder(false);
    setTimeLeft(0);
  }, [logout]);

  const extendSession = useCallback(() => {
    // Oculta el modal y reinicia el contador visual
    resetTimer();
    // Dispara un evento sintético para que los listeners de actividad
    // reinicien el timer de inactividad inmediatamente
    try {
      const evt = new Event('mousemove');
      document.dispatchEvent(evt);
    } catch {
      // Fallback en navegadores antiguos
      const evt = document.createEvent('Event');
      evt.initEvent('mousemove', true, true);
      document.dispatchEvent(evt);
    }
  }, [resetTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let inactivityTimer;
    let reminderTimer;
    let countdownTimer;

    const startInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(reminderTimer);
      clearInterval(countdownTimer);
      
      inactivityTimer = setTimeout(() => {
        // Mostrar recordatorio antes del logout automático
        setShowReminder(true);
        setTimeLeft(reminderSeconds);
        
        // Iniciar countdown
        countdownTimer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              handleLogout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Auto logout después del periodo de recordatorio
        reminderTimer = setTimeout(() => {
          handleLogout();
        }, reminderSeconds * 1000);
        
      }, inactivityTime);
    };

    const resetInactivityTimer = (e) => {
      // Si el evento proviene del modal, no cerrar/ocultar antes del click
      // para permitir que los botones funcionen correctamente
      if (e && e.target && typeof e.target.closest === 'function') {
        const inModal = e.target.closest('.session-reminder-modal');
        if (inModal) return;
      }
      startInactivityTimer();
      resetTimer();
    };

    // Eventos que resetean el timer de inactividad
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      // Usar fase de burbuja para no interferir con onClick de React
      document.addEventListener(event, resetInactivityTimer, false);
    });

    // Iniciar el timer
    startInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(reminderTimer);
      clearInterval(countdownTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, false);
      });
    };
  }, [isAuthenticated, inactivityTime, reminderSeconds, handleLogout, resetTimer]);

  return {
    showReminder,
    timeLeft,
    extendSession,
    handleLogout
  };
};

export default useSessionReminder;

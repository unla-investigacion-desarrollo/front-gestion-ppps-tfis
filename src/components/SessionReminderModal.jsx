import React from 'react';
import './SessionReminderModal.css';

const SessionReminderModal = ({ 
  isOpen, 
  timeLeft, 
  onExtendSession, 
  onLogout 
}) => {
  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="session-reminder-overlay">
      <div 
        className="session-reminder-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="session-reminder-header">
          <h3>⚠️ Recordatorio de Sesión</h3>
        </div>
        
        <div className="session-reminder-content">
          <p>Tu sesión está a punto de expirar por inactividad.</p>
          <div className="countdown-timer">
            <span className="time-display">{formatTime(timeLeft)}</span>
            <span className="time-label">restantes</span>
          </div>
          <p className="warning-text">
            Si no realizas ninguna acción, serás desconectado automáticamente.
          </p>
        </div>
        
        <div className="session-reminder-actions">
          <button 
            className="btn-extend"
            onClick={onExtendSession}
          >
            Continuar Sesión
          </button>
          <button 
            className="btn-logout"
            onClick={onLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionReminderModal;

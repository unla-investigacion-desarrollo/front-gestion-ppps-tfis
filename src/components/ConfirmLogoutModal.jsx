import React from 'react';
import './ConfirmLogoutModal.css';

const ConfirmLogoutModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <div className="confirm-header">
          <h3>¿Cerrar sesión?</h3>
        </div>
        <div className="confirm-content">
          <p>Se cerrará tu sesión actual. Tendrás que iniciar sesión nuevamente para continuar.</p>
        </div>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
          <button className="btn-confirm" onClick={onConfirm}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmLogoutModal;

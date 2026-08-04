import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

interface BackButtonProps {
  label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ label = 'Volver' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Intenta volver, si no hay historial, ir al dashboard
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <button className="back-button" onClick={handleBack}>
      ← {label}
    </button>
  );
};

export default BackButton;

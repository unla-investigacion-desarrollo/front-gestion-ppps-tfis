import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import '../../styles/unla.css';
import './PasswordRecovery.css';
import bgImage from '../../assets/fondo-rojo.jpg';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword(email.trim());
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'No se pudo solicitar la recuperación.');
      sessionStorage.setItem(
        'authToast',
        data?.message || 'Si el correo está registrado, recibirás un enlace de recuperación.'
      );
      navigate('/login');
    } catch (requestError: any) {
      setError(requestError?.message || 'No se pudo solicitar la recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="password-recovery-page" style={{ backgroundImage: `url(${bgImage})` }}>
      <main className="password-recovery-card">
        <h1>Recuperar contraseña</h1>
        <p>Ingresá tu correo y te enviaremos un enlace válido durante 15 minutos.</p>
        {error && <div className="password-recovery-alert error" role="alert">{error}</div>}
        {message && <div className="password-recovery-alert success" role="status">{message}</div>}
        <form onSubmit={handleSubmit} className="unla-form">
          <label className="form-label" htmlFor="recovery-email">Correo electrónico</label>
          <input
            id="recovery-email"
            className="login-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@ejemplo.com"
            required
          />
          <button className="password-recovery-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        <Link to="/login" className="password-recovery-back">Volver al inicio de sesión</Link>
      </main>
    </div>
  );
};

export default ForgotPassword;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import '../../styles/unla.css';
import './PasswordRecovery.css';
import bgImage from '../../assets/fondo-rojo.jpg';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [secondsToResend, setSecondsToResend] = useState(0);

  useEffect(() => {
    if (secondsToResend <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSecondsToResend((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsToResend]);

  const maskedEmail = email.replace(/^(.{2}).*(@.*)$/, '$1***$2');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword(email.trim());
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'No se pudo solicitar la recuperación.');
      setRequestSent(true);
      setSecondsToResend(60);
    } catch (requestError: any) {
      setError(requestError?.message || 'No se pudo solicitar la recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="password-recovery-page" style={{ backgroundImage: `url(${bgImage})` }}>
      <main className="password-recovery-card">
        {requestSent ? (
          <>
            <div className="password-recovery-success-icon" aria-hidden="true">✓</div>
            <h1>Revisá tu correo</h1>
            <p>
              Si existe una cuenta asociada a <strong>{maskedEmail}</strong>, recibirás un enlace válido durante 15 minutos.
            </p>
            <button
              className="password-recovery-button"
              type="button"
              onClick={() => handleSubmit({ preventDefault: () => undefined } as React.FormEvent<HTMLFormElement>)}
              disabled={isSubmitting || secondsToResend > 0}
            >
              {secondsToResend > 0 ? `Reenviar enlace (${secondsToResend}s)` : 'Reenviar enlace'}
            </button>
            <Link to="/login" className="password-recovery-back">Volver al inicio de sesión</Link>
          </>
        ) : (
          <>
            <h1>Recuperar contraseña</h1>
            <p>Ingresá tu correo y te enviaremos un enlace válido durante 15 minutos.</p>
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
          </>
        )}
        {error && <div className="password-recovery-alert error" role="alert">{error}</div>}
      </main>
    </div>
  );
};

export default ForgotPassword;
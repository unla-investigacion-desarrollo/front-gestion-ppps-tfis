import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import '../../styles/unla.css';
import './PasswordRecovery.css';
import bgImage from '../../assets/fondo-rojo.jpg';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!token) return setError('El enlace de recuperación no es válido.');
    if (newPassword.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres.');
    if (newPassword !== confirmPassword) return setError('Las contraseñas no coinciden.');

    setIsSubmitting(true);
    try {
      const response = await authService.resetPassword(token, newPassword);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'El enlace venció o no es válido.');
      navigate('/login', { state: { message: data?.message || 'Contraseña actualizada exitosamente.' } });
    } catch (requestError: any) {
      setError(requestError?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="password-recovery-page" style={{ backgroundImage: `url(${bgImage})` }}>
      <main className="password-recovery-card">
        <h1>Restablecer contraseña</h1>
        <p>Elegí una nueva contraseña para volver a ingresar a la plataforma.</p>
        {error && <div className="password-recovery-alert error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="unla-form">
          <label className="form-label" htmlFor="new-password">Nueva contraseña</label>
          <input id="new-password" className="login-input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          <label className="form-label" htmlFor="confirm-password">Confirmar contraseña</label>
          <input id="confirm-password" className="login-input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          <button className="password-recovery-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
        <Link to="/login" className="password-recovery-back">Volver al inicio de sesión</Link>
      </main>
    </div>
  );
};

export default ResetPassword;
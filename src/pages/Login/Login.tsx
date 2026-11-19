import { useDispatch, useSelector } from 'react-redux';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaTriangleExclamation, FaCheck, FaXmark } from 'react-icons/fa6';
import { loginUser, selectAuthError, selectAuthLoading } from '../../../redux/slices/authSlice';
import { authService } from '../../services/authService';
import './Login.css';

interface LoginCredentials {
  email: string;
  password: string;
}

function LoginForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const error = useSelector(selectAuthError) as string | null;
  const loading = useSelector(selectAuthLoading);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleOpenForgotModal = () => {
    setForgotEmail(credentials.email || '');
    setForgotError(null);
    setForgotSuccess(null);
    setShowForgotModal(true);
  };

  const handleCloseForgotModal = () => {
    if (forgotLoading) return;
    setShowForgotModal(false);
    setForgotError(null);
    setForgotSuccess(null);
  };

  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setForgotError('Ingresá tu correo electrónico.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const response = await authService.forgotPassword(trimmedEmail);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo procesar la solicitud para restablecer la contraseña.');
      }

      setForgotSuccess(
        data?.message || 'Te enviamos las instrucciones para restablecer tu contraseña a tu correo electrónico.'
      );
    } catch (err: any) {
      setForgotError(err?.message || 'Error al conectar con el servidor.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await dispatch(loginUser(credentials) as any).unwrap();
      navigate('/dashboard');
    } catch (err) {
      console.error('Error en login:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCaps = e.getModifierState && e.getModifierState('CapsLock');
    setCapsLockOn(!!isCaps);
  };

  return (
    <div className="login-split-container">
      {/* Panel izquierdo con la imagen institucional y 'Bienvenido a Gestión' */}
      <div className="login-visual-panel">
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <h2 className="login-visual-welcome">
            Bienvenido<br />
            a Gestión
          </h2>
          <p className="login-visual-subtitle">Plataforma PPP y TFI</p>
        </div>
      </div>

      {/* Panel derecho con el formulario */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle-helper">Ingresá tus credenciales para acceder a la plataforma</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="unla-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">Correo electrónico</label>
              <input
                id="email-input"
                type="text"
                inputMode="email"
                autoComplete="email"
                name="email"
                placeholder="nombre@ejemplo.com"
                className="login-input"
                value={credentials.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password-input">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  className="login-input"
                  value={credentials.password}
                  onChange={handleChange}
                  onKeyUp={handlePasswordKey}
                  onKeyDown={handlePasswordKey}
                  required
                  aria-label="Contraseña"
                  style={{ paddingRight: '45px' }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword(s => !s)}
                  className="password-toggle-btn"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>
              {capsLockOn && (
                <div className="caps-lock-warning">
                  <FaTriangleExclamation size={14} style={{ marginRight: '4px', flexShrink: 0 }} />
                  <span>Mayúsculas activadas (Caps Lock)</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading === 'pending'}
            >
              {loading === 'pending' ? (
                <span className="spinner-loading">Iniciando sesión...</span>
              ) : 'Ingresar'}
            </button>
          </form>

          <div className="login-links-container">
            <div className="login-link-item">
              ¿Sos estudiante y todavía no tenés cuenta?{' '}
              <Link to="/register" className="login-link">Registrate aquí</Link>
            </div>
            <div className="login-link-item">
              ¿Necesitás ayuda para recuperar tu contraseña?{' '}
              <button
                type="button"
                className="login-link login-link-btn"
                onClick={handleOpenForgotModal}
              >
                Restablecer contraseña
              </button>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <span className="login-footer-copy">2026 &copy; UNLa</span>
        </div>
      </div>

      {showForgotModal && (
        <div className="login-modal-overlay" onClick={handleCloseForgotModal}>
          <div
            className="login-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <button
              type="button"
              className="login-modal-close"
              onClick={handleCloseForgotModal}
              aria-label="Cerrar"
              disabled={forgotLoading}
            >
              <FaXmark size={18} />
            </button>

            {forgotSuccess ? (
              <div className="login-modal-success">
                <div className="login-modal-icon-success">
                  <FaCheck size={28} />
                </div>
                <h2 id="forgot-password-title" className="login-modal-title">
                  Solicitud enviada
                </h2>
                <p className="login-modal-subtitle">{forgotSuccess}</p>
                <button
                  type="button"
                  className="login-button"
                  onClick={handleCloseForgotModal}
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <h2 id="forgot-password-title" className="login-modal-title">
                  Restablecer contraseña
                </h2>
                <p className="login-modal-subtitle">
                  Ingresá tu correo electrónico para recibir las instrucciones de recuperación.
                </p>

                {forgotError && <div className="error-message">{forgotError}</div>}

                <form onSubmit={handleForgotSubmit} className="unla-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="forgot-email-input">
                      Correo electrónico
                    </label>
                    <input
                      id="forgot-email-input"
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      name="forgotEmail"
                      placeholder="estudiante@ejemplo.com"
                      className="login-input"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="login-modal-actions">
                    <button
                      type="submit"
                      className="login-button"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? 'Enviando...' : 'Restablecer contraseña'}
                    </button>
                    <button
                      type="button"
                      className="login-modal-cancel-btn"
                      onClick={handleCloseForgotModal}
                      disabled={forgotLoading}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginForm;
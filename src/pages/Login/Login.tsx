import { useDispatch, useSelector } from 'react-redux';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, selectAuthError, selectAuthLoading } from '../../../redux/slices/authSlice';
import './Login.css';
import logo from '../../assets/logo.png';

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
      {/* Panel izquierdo con la imagen y el branding */}
      <div className="login-visual-panel">
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <img src={logo} alt="Logo UNLa" className="login-visual-logo" />
          <h2 className="login-visual-subtitle">Plataforma de Gestión de PPS y TFI</h2>
        </div>
      </div>

      {/* Panel derecho con el formulario */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          {/* Logo visible en mobile cuando se oculta el panel izquierdo */}
          <div className="login-mobile-logo-container">
            <img src={logo} alt="Logo UNLa" className="login-mobile-logo" />
          </div>
          
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle-helper">Ingresá tus credenciales para acceder a la plataforma</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="unla-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">Correo electrónico</label>
              <input
                id="email-input"
                type="email"
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {capsLockOn && (
                <div className="caps-lock-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ marginRight: '4px', flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
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
              <Link to="/help" className="login-link">Ver ayuda</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
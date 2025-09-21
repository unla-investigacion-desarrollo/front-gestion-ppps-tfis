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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(loginUser(credentials) as any).unwrap();
      navigate('/dashboard');
    } catch (err) {
      console.error('Error en login:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordKey = (e) => {
    const isCaps = e.getModifierState && e.getModifierState('CapsLock');
    setCapsLockOn(!!isCaps);
  };

  return (
    <div className="login-page"> 
      <header className="login-header">
        <img src={logo} alt="Logo UNLa" className="logo-full" />
      </header>

      <div className="login-box"> 
        <h1 className="login-title">Iniciar sesión</h1> 
        
        {error && <div className="error-message">{error}</div>} 
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email" 
              className="login-input" 
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Contraseña" 
                className="login-input" 
                value={credentials.password}
                onChange={handleChange}
                onKeyUp={handlePasswordKey}
                onKeyDown={handlePasswordKey}
                required
                aria-label="Contraseña"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64001D',
                  fontWeight: 600
                }}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {capsLockOn && (
              <small style={{ color: '#b30000' }}>
                Mayúsculas activadas (Caps Lock)
              </small>
            )}
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading === 'pending'}
          >
            {loading === 'pending' ? 'Iniciando sesión...' : 'Ingresar'} 
          </button>
        </form>
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <small>
            ¿Sos estudiante y todavía no tenés cuenta?{' '}
            <Link to="/register">Registrate aquí</Link>
          </small>
        </div>
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <small>
            ¿Necesitás ayuda para recuperar tu contraseña?{' '}
            <Link to="/help">Ver ayuda</Link>
          </small>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
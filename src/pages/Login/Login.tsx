import { useDispatch, useSelector } from 'react-redux';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
            <input
              type="password"
              name="password"
              placeholder="Contraseña" 
              className="login-input" 
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading === 'pending'}
          >
            {loading === 'pending' ? 'Iniciando sesión...' : 'Ingresar'} 
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
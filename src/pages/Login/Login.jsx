import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import './Login.css';
import logo from '../../assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // LLamada a api aqui.
      // Provisorio simulamos una autenticación exitosa
      if (username && password) {
        // Simulamos un token de autenticación
        const fakeToken = 'fake-jwt-token';
        
        // Guardamos el token y actualizamos el estado de autenticación
        login(fakeToken);
        
        // Guardamos la información del usuario en localStorage
        const userData = {
          nombre: username,
          rol: "Estudiante" // Esto debería venir de la respuesta de tu API
        };
        localStorage.setItem("usuario", JSON.stringify(userData));
        
        // Redirigimos al dashboard
        navigate('/dashboard');
      } else {
        setError('Por favor ingresa usuario y contraseña');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
      console.error('Login error:', err);
    }
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
          <input 
            type="text" 
            placeholder="Usuario" 
            className="login-input" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="login-button">Ingresar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;

import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../../assets/logo.png';

  const Login = () => {
  const navigate = useNavigate();

  /*const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };
*/
const handleSubmit = (e) => {
  e.preventDefault();

  // Simulamos login con un usuario y rol
  const usuarioSimulado = {
    nombre: "Matías Ferreira",
    rol: "Estudiante"
  };

  // Guardamos en localStorage
  localStorage.setItem("usuario", JSON.stringify(usuarioSimulado));

  // Redirigimos
  navigate('/dashboard');
};

  return (
    <div className="login-page">
      
      {/* Header con logo ancho completo */}
      <header className="login-header">
        <img src={logo} alt="Logo UNLa" className="logo-full" />
      </header>

      <div className="login-box">
        <h1 className="login-title">Iniciar sesión</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Usuario" className="login-input" />
          <input type="password" placeholder="Contraseña" className="login-input" />
          <button type="submit" className="login-button">Ingresar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;

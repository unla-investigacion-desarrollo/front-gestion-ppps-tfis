
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import './Dashboard.css';
import logo from '../../assets/logo.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <img src={logo} alt="UNLa Logo" className="dashboard-logo" />
        <h1>Gestión de Trabajo Final Anual</h1>
        {usuario && (
          <div className="usuario-info">
            <button onClick={() => {
              localStorage.removeItem("usuario");
              navigate('/');
            }}>Cerrar sesión</button>
            <p><strong>Usuario:</strong> {usuario.nombre}</p>
            <p><strong>Rol:</strong> {usuario.rol}</p>
          </div>
        )}
      </header>
      <Sidebar />
      <main className="dashboard-main">
        {/* Espacio en blanco para futuros componentes */}
      </main>
    </div>
  );
};

export default Dashboard;

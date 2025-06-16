import './Dashboard.css';
import logo from '../../assets/logo.png';

const Dashboard = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  return (
    <div className="dashboard-page">
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

      <div className="dashboard-content">
        <h2>Opciones del sistema</h2>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Acción</th>
              <th>Descripción</th>
              <th>Ir</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ver Proyectos</td>
              <td>Consulta general de los trabajos disponibles y asignados</td>
              <td><button className="dashboard-button">Ir</button></td>
            </tr>
            <tr>
              <td>Cargar Propuesta</td>
              <td>Formulario para presentar tu propuesta de TFI</td>
              <td><button className="dashboard-button">Ir</button></td>
            </tr>
            <tr>
              <td>Consultar Estado</td>
              <td>Seguimiento del proceso de evaluación y aprobación</td>
              <td><button className="dashboard-button">Ir</button></td>
            </tr>
            <tr>
              <td>Subir Entregas</td>
              <td>Entrega de avances, trabajos finales o correcciones</td>
              <td><button className="dashboard-button">Ir</button></td>
            </tr>
            <tr>
              <td>Observaciones</td>
              <td>Ver comentarios y devoluciones del tribunal</td>
              <td><button className="dashboard-button">Ir</button></td>
            </tr>
            <tr>
              <td>Resoluciones</td>
              <td>Descarga de resoluciones o actas vinculadas al TFI</td>
              <td><button className="dashboard-button">Ir</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;

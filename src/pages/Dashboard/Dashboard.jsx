
import { useMemo, useState } from 'react';
import bgImage from '../../assets/fondo-rojo.jpg';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import ConfirmLogoutModal from '../../components/ConfirmLogoutModal';
import './Dashboard.css';
import logo from '../../assets/logo.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("user"));
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  // Mostrar propuestas solo para estudiantes
  const isStudent = useMemo(() => {
    const roles = usuario?.roles;
    if (Array.isArray(roles)) return roles.includes('ESTUDIANTE');
    return roles === 'ESTUDIANTE';
  }, [usuario]);

  const lastProposal = useMemo(() => {
    try {
      const raw = localStorage.getItem('proposals');
      const arr = raw ? JSON.parse(raw) : [];
      const mine = usuario ? arr.filter((p) => p.userId === usuario.id) : arr;
      return mine.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))[0] || null;
    } catch { return null; }
  }, [usuario]);

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <header className="dashboard-header">
        <img src={logo} alt="UNLa Logo" className="dashboard-logo" />
        <h1>Gestión de Trabajo Final Anual</h1>
        {usuario && (
          <div className="usuario-info">
            <button className="btn btn-danger btn-sm" onClick={() => setShowConfirm(true)}>Cerrar sesión</button>
            <p><strong>Usuario:</strong> {usuario.name}</p>
            <p><strong>Rol:</strong> {Array.isArray(usuario.roles) ?
              Array.from(new Set(usuario.roles.map(r => r.toLowerCase())))
                .map(r => r.charAt(0).toUpperCase() + r.slice(1).toLowerCase())
                .join(', ')
              : (usuario.roles ? usuario.roles.charAt(0).toUpperCase() + usuario.roles.slice(1).toLowerCase() : '')
            }</p>
          </div>
        )}
      </header>
      <Sidebar />
      <main className="dashboard-main">
        {/* Estado de Propuesta */}
        {isStudent && (
          <div className="unla-card" style={{ marginBottom: 16 }}>
            <h2>Propuesta</h2>
            {lastProposal ? (
              <div className="unla-list">
                <div><strong>Último envío:</strong> {new Date(lastProposal.uploadedAt).toLocaleString()}</div>
                <div><strong>Título:</strong> {lastProposal.titulo}</div>
                <div><strong>Estado:</strong> <span className="unla-badge">{lastProposal.estado}</span></div>
                {lastProposal.reason && <div className="unla-hint error"><strong>Rechazo:</strong> {lastProposal.reason}</div>}
                {lastProposal.note && <div className="unla-hint"><strong>Observación:</strong> {lastProposal.note}</div>}
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/carga-propuesta')}>Ir a Propuesta</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="unla-hint">Aún no enviaste tu propuesta.</div>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/carga-propuesta')}>Cargar propuesta</button>
              </div>
            )}
          </div>
        )}

        {/* Espacio reservado para otros módulos */}
      </main>

      {/* Modal de confirmación de cierre de sesión */}
      <ConfirmLogoutModal 
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          logout();
          localStorage.removeItem("user");
          setShowConfirm(false);
          navigate('/');
        }}
      />
    </div>
  );
};

export default Dashboard;


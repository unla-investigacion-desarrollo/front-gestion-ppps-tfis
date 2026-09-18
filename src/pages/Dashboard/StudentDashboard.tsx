import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFileLines,
  FaCloudArrowUp,
  FaBullhorn,
  FaClipboardList,
  FaUser,
} from 'react-icons/fa6';
import { useAuth } from '../../hooks/useAuth';
import ConfirmLogoutModal from '../../components/ConfirmLogoutModal';
import StudentSidebar from './components/StudentSidebar';
import StudentCard from './components/StudentCard';
import StudentPromoCard from './components/StudentPromoCard';
import './StudentDashboard.css';

export interface StudentDashboardProps {
  user?: {
    nombre?: string;
    firstName?: string;
    name?: string;
    email?: string;
    [key: string]: unknown;
  };
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user: propUser }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  const currentUser = useMemo(() => {
    if (propUser) return propUser;
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, [propUser]);

  // Nombre formateado para el saludo "Hola, María 👋"
  const studentFirstName = useMemo(() => {
    let resolvedName = '';
    if (currentUser?.nombre) {
      resolvedName = currentUser.nombre;
    } else if (currentUser?.firstName) {
      resolvedName = currentUser.firstName;
    } else if (currentUser?.name) {
      resolvedName = currentUser.name.split(' ')[0];
    } else if (currentUser?.email) {
      const emailUserPart = currentUser.email.split('@')[0];
      resolvedName = emailUserPart.split('.')[0];
    }

    if (!resolvedName) return 'Estudiante';
    const trimmedName = resolvedName.trim();
    if (trimmedName.toLowerCase() === 'maria') return 'María';
    return trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);
  }, [currentUser]);

  return (
    <div className="student-dashboard-layout">
      {/* Sidebar Lateral Izquierdo Reutilizable */}
      <StudentSidebar onShowLogoutConfirm={() => setShowLogoutConfirm(true)} />

      {/* Área Principal de Contenido */}
      <main className="student-main-content">
        <div className="student-content-container">
          {/* Sección de Bienvenida */}
          <div className="student-greeting-section">
            <div className="student-greeting-pretitle">BIENVENIDO/A</div>
            <h1 className="student-greeting-title">
              Hola, {studentFirstName} 👋
            </h1>
            <p className="student-greeting-subtitle">
              Desde aquí podés gestionar tus proyectos, entregas y trámites académicos.
            </p>
          </div>

          {/* Grilla de 6 Tarjetas (Mismo tamaño, centradas) */}
          <div className="student-cards-grid">
            {/* Tarjeta 1: Proyectos TFI */}
            <StudentCard
              title="Proyectos TFI"
              description="Consultá los proyectos disponibles, revisá tus solicitudes y accedé a tus proyectos activos."
              colorTheme="purple"
              onClick={() => navigate('/alumno/mis-proyectos')}
              icon={<FaFileLines size={22} />}
            />

            {/* Tarjeta 2: Entregas TFI */}
            <StudentCard
              title="Entregas TFI"
              description="Subí tus entregas y consultá observaciones, tutoría y calificación."
              colorTheme="blue"
              onClick={() => navigate('/alumno/entregas')}
              icon={<FaCloudArrowUp size={22} />}
            />

            {/* Tarjeta 3: Convocatorias PPP */}
            <StudentCard
              title="Convocatorias PPP"
              description="Revisá las convocatorias abiertas, postulate y gestioná tus trámites PPP."
              colorTheme="green"
              onClick={() => navigate('/ppp/convocatorias')}
              icon={<FaBullhorn size={22} />}
            />

            {/* Tarjeta 4: Mis trámites PPP */}
            <StudentCard
              title="Mis trámites PPP"
              description="Seguimiento de tu postulación o trámite, notificación de documentación y abandono cuando corresponda."
              colorTheme="pink"
              onClick={() => navigate('/alumno/ppp')}
              icon={<FaClipboardList size={22} />}
            />

            {/* Tarjeta 5: Mi perfil */}
            <StudentCard
              title="Mi perfil"
              description="Actualizá tus datos y configuraciones de cuenta."
              colorTheme="amber"
              onClick={() => navigate('/change-password')}
              icon={<FaUser size={22} />}
            />

            {/* Tarjeta 6: Banner Promocional Tu Futuro Reutilizable */}
            <StudentPromoCard />
          </div>
        </div>
      </main>

      {/* Modal de confirmación para cerrar sesión */}
      <ConfirmLogoutModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          localStorage.removeItem('user');
          setShowLogoutConfirm(false);
          navigate('/');
        }}
      />
    </div>
  );
};

export default StudentDashboard;

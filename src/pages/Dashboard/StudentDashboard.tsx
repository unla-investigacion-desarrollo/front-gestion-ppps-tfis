import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                  <path d="M4.5 7.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z" />
                </svg>
              }
            />

            {/* Tarjeta 2: Entregas TFI */}
            <StudentCard
              title="Entregas TFI"
              description="Subí tus entregas y consultá observaciones, tutoría y calificación."
              colorTheme="blue"
              onClick={() => navigate('/alumno/entregas')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z" />
                  <path d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z" />
                </svg>
              }
            />

            {/* Tarjeta 3: Convocatorias PPP */}
            <StudentCard
              title="Convocatorias PPP"
              description="Revisá las convocatorias abiertas, postulate y gestioná tus trámites PPP."
              colorTheme="green"
              onClick={() => navigate('/ppp/convocatorias')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0v-.214c-2.162-1.241-4.49-1.843-6.912-2.083l.405 2.712A1 1 0 0 1 5.51 15.1l-.548-.082a1 1 0 0 1-.837-1.135l.93-6.222C3.12 7.732 1.34 8.793.543 9.403A.5.5 0 0 1 0 9.006V4.994a.5.5 0 0 1 .543-.397c.797.61 2.577 1.671 4.512 1.732l-.93-6.222A1 1 0 0 1 4.962.972l.548-.082a1 1 0 0 1 1.135.837l.405 2.712c2.422-.24 4.75-.842 6.912-2.083V2.5zm1 0a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0V2.5z" />
                </svg>
              }
            />

            {/* Tarjeta 4: Mis trámites PPP */}
            <StudentCard
              title="Mis trámites PPP"
              description="Seguimiento de tu postulación o trámite, notificación de documentación y abandono cuando corresponda."
              colorTheme="pink"
              onClick={() => navigate('/alumno/ppp')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z" />
                  <path d="M4.5 10.5A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-3A.5.5 0 0 1 5 7h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-3A.5.5 0 0 1 5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
                </svg>
              }
            />

            {/* Tarjeta 5: Mi perfil */}
            <StudentCard
              title="Mi perfil"
              description="Actualizá tus datos y configuraciones de cuenta."
              colorTheme="amber"
              onClick={() => navigate('/change-password')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
                </svg>
              }
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

import React from 'react';
import '../../styles/unla.css';
import bgImage from '../../assets/fondo-rojo.jpg';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import ProjectJoinExplorer from '../../components/ProjectJoinExplorer';

const MyProjects: React.FC = () => {
  const me = useSelector(selectCurrentUser) as any;

  if (!me) return null;

  return (
    <div
      className="unla-page"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '24px 16px'
      }}
    >
      <div className="unla-card" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <ProjectJoinExplorer
          title="Proyectos y Postulaciones"
          subtitle="Explorá proyectos existentes, postulate para participar y hacé seguimiento de tus solicitudes."
        />
      </div>
    </div>
  );
};

export default MyProjects;

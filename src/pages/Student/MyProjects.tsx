import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import ProjectJoinExplorer from '../../components/ProjectJoinExplorer';

const MyProjects: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser) as any;

  if (!currentUser) return null;

  return (
    <div className="projects-page-container student-projects-container">
      <div className="projects-card-main student-projects-card">
        <ProjectJoinExplorer
          title="Proyectos y Postulaciones"
          subtitle="Explorá proyectos existentes, postulate para participar y hacé seguimiento de tus solicitudes."
        />
      </div>
    </div>
  );
};

export default MyProjects;


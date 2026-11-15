import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import ProjectJoinExplorer from '../../components/ProjectJoinExplorer';

/**
 * Página del estudiante para "Ver proyectos disponibles" (?tab=all) y "Mis solicitudes" (?tab=requests).
 * "Mi TFI" vive en el dashboard; los enlaces viejos a ?tab=active se redirigen allí.
 */
const MyProjects: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser) as any;
  const location = useLocation();

  if (!currentUser) return null;

  if (new URLSearchParams(location.search).get('tab') === 'active') {
    return <Navigate to="/dashboard" replace state={{ initialView: 'proyectos' }} />;
  }

  return (
    <div className="projects-page-container student-projects-container">
      <div className="projects-card-main student-projects-card">
        <ProjectJoinExplorer />
      </div>
    </div>
  );
};

export default MyProjects;

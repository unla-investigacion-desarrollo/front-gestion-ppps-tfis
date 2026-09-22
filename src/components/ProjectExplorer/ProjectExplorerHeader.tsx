import React from 'react';
import { FaFolderOpen } from 'react-icons/fa6';

export interface ProjectExplorerHeaderProps {
  title?: string;
  subtitle?: string;
}

/**
 * Cabecera institucional con contenedor de ícono temático bordó UNLa.
 */
export const ProjectExplorerHeader: React.FC<ProjectExplorerHeaderProps> = ({
  title = 'Proyectos y Postulaciones',
  subtitle = 'Explorá proyectos existentes, postulate para participar y hacé seguimiento de tus solicitudes.',
}) => {
  return (
    <div className="project-join-header">
      <div className="project-join-header-icon-box">
        <FaFolderOpen size={24} />
      </div>
      <div>
        <h1 className="project-join-title">{title}</h1>
        <p className="project-join-subtitle">{subtitle}</p>
      </div>
    </div>
  );
};

export default ProjectExplorerHeader;

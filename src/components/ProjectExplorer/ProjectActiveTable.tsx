import React from 'react';
import { TutorProjectsTable } from '../../pages/Dashboard/Teacher/components/TutorProjectsTable';
import { RequestItem } from './types';

export interface ProjectActiveTableProps {
  activeProjects?: RequestItem[];
  allUsers?: any[];
  onExploreClick: () => void;
}

/**
 * Vista de tabla para proyectos donde el estudiante ya participa activamente.
 * Reutiliza la misma tabla y endpoint oficial (GET /project/my-projects) que utiliza el profesor tutor.
 */
export const ProjectActiveTable: React.FC<ProjectActiveTableProps> = ({
  onExploreClick,
}) => {
  return (
    <TutorProjectsTable
      onBackToInicio={onExploreClick}
      isStudent={true}
    />
  );
};

export default ProjectActiveTable;


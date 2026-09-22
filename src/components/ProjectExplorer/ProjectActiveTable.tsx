import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaFolderOpen,
  FaChalkboardUser,
  FaCircleCheck,
  FaArrowRight,
} from 'react-icons/fa6';
import { RequestItem } from './types';
import ProjectCategoryBadge from './ProjectCategoryBadge';
import { resolveUserName } from './projectExplorerUtils';

export interface ProjectActiveTableProps {
  activeProjects: RequestItem[];
  allUsers: any[];
  onExploreClick: () => void;
}

/**
 * Vista de tabla para proyectos donde el estudiante ya participa activamente.
 */
export const ProjectActiveTable: React.FC<ProjectActiveTableProps> = ({
  activeProjects,
  allUsers,
  onExploreClick,
}) => {
  if (activeProjects.length === 0) {
    return (
      <div className="project-join-empty">
        <FaFolderOpen size={40} className="text-muted mb-3" />
        <h3>Aún no estás asignado a ningún proyecto</h3>
        <p>
          Una vez que un docente evaluador o administrador apruebe tu
          postulación a un proyecto, aparecerá aquí para que puedas gestionar tus
          entregas y avances.
        </p>
        <button
          type="button"
          className="btn-join-primary mt-2"
          onClick={onExploreClick}
        >
          Ver proyectos disponibles
        </button>
      </div>
    );
  }

  return (
    <div className="projects-table-wrapper">
      <table className="table table-hover m-0 align-middle">
        <thead>
          <tr className="table-header-unla">
            <th style={{ width: '45%', padding: '14px 18px' }}>
              Proyecto Activo
            </th>
            <th style={{ width: '25%', padding: '14px 18px' }}>
              Docentes / Tutor
            </th>
            <th
              style={{ width: '15%', padding: '14px 18px', textAlign: 'center' }}
            >
              Estado
            </th>
            <th
              style={{ width: '15%', padding: '14px 18px', textAlign: 'center' }}
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {activeProjects.map((activeProjectItem) => {
            const projectData =
              activeProjectItem.project || (activeProjectItem as any);
            const projectTitle = projectData?.title || 'Proyecto';
            const categoryName =
              projectData?.projectType?.name || projectData?.categoria || 'General';

            const teachersList = projectData?.activeProfessors
              ? projectData.activeProfessors
                  .map((activeProfessorRecord: any) =>
                    resolveUserName(activeProfessorRecord, allUsers)
                  )
                  .filter(Boolean)
              : projectData?.teacher
              ? [resolveUserName(projectData.teacher, allUsers)]
              : [];

            return (
              <tr key={activeProjectItem.id}>
                <td style={{ padding: '14px 18px' }}>
                  <div className="mb-1">
                    <ProjectCategoryBadge categoryName={categoryName} />
                  </div>
                  <span className="project-table-title">{projectTitle}</span>
                  <p className="project-table-desc">
                    {projectData?.description || 'Sin descripción detallada.'}
                  </p>
                </td>
                <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                  {teachersList.length === 0 ? (
                    <span className="text-muted small">Sin tutor asignado</span>
                  ) : (
                    <ul className="project-table-member-list">
                      {teachersList.map((teacherName: string, teacherIndex: number) => (
                        <li key={teacherIndex} className="project-table-member-item">
                          <FaChalkboardUser size={13} className="text-primary me-1" />
                          <span>{teacherName}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                  <span className="badge-status-approved">
                    <FaCircleCheck size={12} /> Participando
                  </span>
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                  {projectData?.id && (
                    <Link
                      to={`/alumno/entregas?projectId=${encodeURIComponent(
                        projectData.id
                      )}`}
                      className="btn-action-deliveries"
                    >
                      <span>Ver entregas</span>
                      <FaArrowRight size={12} />
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectActiveTable;

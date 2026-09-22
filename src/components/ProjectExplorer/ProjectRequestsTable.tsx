import React from 'react';
import {
  FaClock,
  FaCalendarDays,
  FaChalkboardUser,
} from 'react-icons/fa6';
import { RequestItem } from './types';
import ProjectCategoryBadge from './ProjectCategoryBadge';
import { resolveUserName, formatCreationDate } from './projectExplorerUtils';

export interface ProjectRequestsTableProps {
  requests: RequestItem[];
  allUsers: any[];
  onExploreClick: () => void;
}

/**
 * Vista de tabla para solicitudes pendientes de postulación a proyectos.
 */
export const ProjectRequestsTable: React.FC<ProjectRequestsTableProps> = ({
  requests,
  allUsers,
  onExploreClick,
}) => {
  if (requests.length === 0) {
    return (
      <div className="project-join-empty">
        <FaClock size={40} className="text-muted mb-3" />
        <h3>No tenés solicitudes pendientes</h3>
        <p>
          Actualmente no registrás postulaciones en espera de aprobación. Podés
          explorar los proyectos disponibles y postularte a los que sean de tu
          interés.
        </p>
        <button
          type="button"
          className="btn-join-primary mt-2"
          onClick={onExploreClick}
        >
          Explorar proyectos disponibles
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
              Proyecto Solicitado
            </th>
            <th style={{ width: '25%', padding: '14px 18px' }}>
              Docentes / Tutor
            </th>
            <th style={{ width: '15%', padding: '14px 18px' }}>
              Fecha de Solicitud
            </th>
            <th
              style={{ width: '15%', padding: '14px 18px', textAlign: 'center' }}
            >
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((requestItem) => {
            const projectData = requestItem.project || (requestItem as any);
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
              <tr key={requestItem.id}>
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
                <td style={{ padding: '14px 18px' }}>
                  <div className="project-table-date">
                    <FaCalendarDays size={12} />
                    <span>
                      {formatCreationDate(
                        requestItem.createdAt || projectData?.createdAt
                      )}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                  <span className="badge-status-pending">
                    <FaClock size={12} /> En revisión
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectRequestsTable;

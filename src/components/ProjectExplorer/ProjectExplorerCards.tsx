import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarDays,
  FaChalkboardUser,
  FaCircleCheck,
  FaClock,
  FaArrowRight,
  FaPlus,
} from 'react-icons/fa6';
import { ProjectItem } from './types';
import ProjectCategoryBadge from './ProjectCategoryBadge';
import { getProjectTeachers, formatCreationDate } from './projectExplorerUtils';

export interface ProjectExplorerCardsProps {
  projects: ProjectItem[];
  allUsers: any[];
  pendingProjectIds: Set<string>;
  activeProjectIds: Set<string>;
  requestingId: number | string | null;
  onJoinProject: (projectId: number | string, projectTitle: string) => void;
}

/**
 * Cuadrícula de tarjetas modernas con diseño institucional UNLa.
 */
export const ProjectExplorerCards: React.FC<ProjectExplorerCardsProps> = ({
  projects,
  allUsers,
  pendingProjectIds,
  activeProjectIds,
  requestingId,
  onJoinProject,
}) => {
  return (
    <div className="project-join-grid">
      {projects.map((projectItem) => {
        const stringId = String(projectItem.id);
        const isApproved = activeProjectIds.has(stringId);
        const isPending = pendingProjectIds.has(stringId);
        const isRequesting = requestingId === projectItem.id;
        const projectTitle = projectItem.title || projectItem.titulo || 'Proyecto';
        const categoryName = projectItem.projectType?.name || projectItem.categoria || 'General';
        const teachersList = getProjectTeachers(projectItem, allUsers);

        return (
          <div key={projectItem.id} className="project-card-item">
            <div>
              <div className="project-card-header">
                <div>
                  <ProjectCategoryBadge categoryName={categoryName} />
                </div>
                {projectItem.createdAt && (
                  <span className="project-card-date-badge">
                    <FaCalendarDays size={11} /> {formatCreationDate(projectItem.createdAt)}
                  </span>
                )}
              </div>

              <h3 className="project-card-title">{projectTitle}</h3>
              <p className="project-card-desc">
                {projectItem.description || projectItem.descripcion || 'Sin descripción detallada.'}
              </p>

              {teachersList.length > 0 && (
                <div className="project-card-teachers">
                  <FaChalkboardUser size={13} className="text-primary me-1" />
                  <span className="small text-muted">
                    Tutor: <strong>{teachersList.join(', ')}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="project-card-footer">
              {isApproved ? (
                <div className="d-flex justify-content-between align-items-center w-100">
                  <span className="badge-status-approved">
                    <FaCircleCheck size={12} /> Ya sos miembro
                  </span>
                  <Link
                    to={`/alumno/entregas?projectId=${encodeURIComponent(projectItem.id)}`}
                    className="btn-action-deliveries"
                  >
                    <span>Entregas</span>
                    <FaArrowRight size={12} />
                  </Link>
                </div>
              ) : isPending ? (
                <span className="badge-status-pending w-100 justify-content-center">
                  <FaClock size={12} /> Solicitud enviada (Pendiente)
                </span>
              ) : (
                <button
                  type="button"
                  className="btn-join-primary w-100 justify-content-center"
                  disabled={isRequesting}
                  onClick={() => onJoinProject(projectItem.id, projectTitle)}
                >
                  {isRequesting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span>Enviando solicitud...</span>
                    </>
                  ) : (
                    <>
                      <FaPlus size={12} />
                      <span>Solicitar unirse al proyecto</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectExplorerCards;

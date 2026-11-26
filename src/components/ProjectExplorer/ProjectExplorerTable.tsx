import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarDays,
  FaCircleCheck,
  FaClock,
  FaArrowRight,
} from 'react-icons/fa6';
import { ProjectItem } from './types';
import ProjectCategoryBadge from './ProjectCategoryBadge';
import { formatCreationDate } from './projectExplorerUtils';

const ProjectDescription: React.FC<{ description: string }> = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element || expanded) return;

    const measureOverflow = () => {
      setHasMore(element.scrollHeight > element.clientHeight + 1);
    };

    measureOverflow();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureOverflow);
      return () => window.removeEventListener('resize', measureOverflow);
    }

    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [description, expanded]);

  return (
    <>
      <p
        ref={descriptionRef}
        className={`project-table-desc${expanded ? ' expanded' : ''}`}
      >
        {description}
      </p>
      {(hasMore || expanded) && (
        <button
          type="button"
          className="project-table-desc-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((isExpanded) => !isExpanded)}
        >
          Mostrar {expanded ? 'menos' : 'más'}
        </button>
      )}
    </>
  );
};

export interface ProjectExplorerTableProps {
  projects: ProjectItem[];
  pendingProjectIds: Set<string>;
  activeProjectIds: Set<string>;
  requestingId: number | string | null;
  onJoinProject: (projectId: number | string, projectTitle: string) => void;
  /** Si es false (p. ej. el estudiante ya tiene su TFI), no se permite postularse. */
  canApply?: boolean;
}

/**
 * Tabla estructurada institucional que lista los proyectos disponibles estilo Teacher y Admin.
 */
export const ProjectExplorerTable: React.FC<ProjectExplorerTableProps> = ({
  projects,
  pendingProjectIds,
  activeProjectIds,
  requestingId,
  onJoinProject,
  canApply = true,
}) => {
  return (
    <div className="projects-table-wrapper">
      <table className="table table-hover m-0 align-middle">
        <thead>
          <tr className="table-header-unla">
            <th style={{ width: '70%', padding: '14px 18px' }}>Proyecto</th>
            <th style={{ width: '15%', padding: '14px 18px', textAlign: 'center' }}>Estado</th>
            <th style={{ width: '15%', padding: '14px 18px', textAlign: 'center' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((projectItem) => {
            const stringId = String(projectItem.id);
            const isApproved = activeProjectIds.has(stringId);
            const isPending = pendingProjectIds.has(stringId);
            const isRequesting = requestingId === projectItem.id;
            const projectTitle = projectItem.title || projectItem.titulo || 'Proyecto';
            const categoryName = projectItem.projectType?.name || projectItem.categoria || 'General';

            return (
              <tr key={projectItem.id}>
                {/* Columna: Información del Proyecto */}
                <td style={{ padding: '14px 18px' }}>
                  <div className="mb-1">
                    <ProjectCategoryBadge categoryName={categoryName} />
                  </div>
                  <span className="project-table-title">{projectTitle}</span>
                  <ProjectDescription
                    description={projectItem.description || projectItem.descripcion || 'Sin descripción detallada.'}
                  />
                  {projectItem.createdAt && (
                    <div className="project-table-date">
                      <FaCalendarDays size={12} />
                      <span>Creado el {formatCreationDate(projectItem.createdAt)}</span>
                    </div>
                  )}
                </td>

                {/* Columna: Estado de la solicitud */}
                <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                  {isApproved ? (
                    <span className="badge-status-approved">
                      <FaCircleCheck size={12} /> Activo
                    </span>
                  ) : isPending ? (
                    <span className="badge-status-pending">
                      <FaClock size={12} /> Pendiente
                    </span>
                  ) : (
                    <span className="badge-status-available">Disponible</span>
                  )}
                </td>

                {/* Columna: Acción */}
                <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                  {isApproved ? (
                    <Link
                      to={`/alumno/entregas?projectId=${encodeURIComponent(projectItem.id)}`}
                      className="btn-action-deliveries"
                      title="Ir a entregas del proyecto"
                    >
                      <span>Entregas</span>
                      <FaArrowRight size={12} />
                    </Link>
                  ) : isPending ? (
                    <span
                      className="btn-action-disabled"
                      title="Solicitud enviada a la espera de aprobación"
                    >
                      Enviada
                    </span>
                  ) : !canApply ? (
                    <span
                      className="btn-action-disabled"
                      title="Ya tenés un TFI asignado"
                    >
                      No disponible
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-join-primary"
                      disabled={isRequesting}
                      onClick={() => onJoinProject(projectItem.id, projectTitle)}
                      title="Solicitar unirse a este proyecto"
                    >
                      {isRequesting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <span>Postular</span>
                      )}
                    </button>
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

export default ProjectExplorerTable;

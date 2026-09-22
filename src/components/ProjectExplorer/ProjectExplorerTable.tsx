import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarDays,
  FaChalkboardUser,
  FaGraduationCap,
  FaCircleCheck,
  FaClock,
  FaArrowRight,
  FaPlus,
} from 'react-icons/fa6';
import { ProjectItem } from './types';
import ProjectCategoryBadge from './ProjectCategoryBadge';
import {
  getProjectTeachers,
  getProjectStudents,
  formatCreationDate,
} from './projectExplorerUtils';

export interface ProjectExplorerTableProps {
  projects: ProjectItem[];
  allUsers: any[];
  pendingProjectIds: Set<string>;
  activeProjectIds: Set<string>;
  requestingId: number | string | null;
  onJoinProject: (projectId: number | string, projectTitle: string) => void;
}

/**
 * Tabla estructurada institucional que lista los proyectos disponibles estilo Teacher y Admin.
 */
export const ProjectExplorerTable: React.FC<ProjectExplorerTableProps> = ({
  projects,
  allUsers,
  pendingProjectIds,
  activeProjectIds,
  requestingId,
  onJoinProject,
}) => {
  return (
    <div className="projects-table-wrapper">
      <table className="table table-hover m-0 align-middle">
        <thead>
          <tr className="table-header-unla">
            <th style={{ width: '42%', padding: '14px 18px' }}>Proyecto</th>
            <th style={{ width: '20%', padding: '14px 18px' }}>Docentes / Tutor</th>
            <th style={{ width: '16%', padding: '14px 18px' }}>Estudiantes</th>
            <th style={{ width: '10%', padding: '14px 18px', textAlign: 'center' }}>Estado</th>
            <th style={{ width: '12%', padding: '14px 18px', textAlign: 'center' }}>Acción</th>
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
            const teachersList = getProjectTeachers(projectItem, allUsers);
            const studentsList = getProjectStudents(projectItem, allUsers);

            return (
              <tr key={projectItem.id}>
                {/* Columna: Información del Proyecto */}
                <td style={{ padding: '14px 18px' }}>
                  <div className="mb-1">
                    <ProjectCategoryBadge categoryName={categoryName} />
                  </div>
                  <span className="project-table-title">{projectTitle}</span>
                  <p className="project-table-desc">
                    {projectItem.description || projectItem.descripcion || 'Sin descripción detallada.'}
                  </p>
                  {projectItem.createdAt && (
                    <div className="project-table-date">
                      <FaCalendarDays size={12} />
                      <span>Creado el {formatCreationDate(projectItem.createdAt)}</span>
                    </div>
                  )}
                </td>

                {/* Columna: Docentes / Tutor */}
                <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                  {teachersList.length === 0 ? (
                    <span className="text-muted small">Sin tutor asignado</span>
                  ) : (
                    <ul className="project-table-member-list">
                      {teachersList.map((teacherName, teacherIndex) => (
                        <li key={teacherIndex} className="project-table-member-item">
                          <FaChalkboardUser size={13} className="text-primary me-1" />
                          <span
                            className="text-truncate"
                            style={{ maxWidth: '160px' }}
                            title={teacherName}
                          >
                            {teacherName}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                {/* Columna: Estudiantes Asignados */}
                <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                  {studentsList.length === 0 ? (
                    <span className="text-muted small">Sin estudiantes</span>
                  ) : (
                    <ul className="project-table-member-list">
                      {studentsList.map((studentName, studentIndex) => (
                        <li key={studentIndex} className="project-table-member-item">
                          <FaGraduationCap size={13} className="text-muted me-1" />
                          <span
                            className="text-truncate"
                            style={{ maxWidth: '140px' }}
                            title={studentName}
                          >
                            {studentName}
                          </span>
                        </li>
                      ))}
                    </ul>
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
                        <>
                          <FaPlus size={12} />
                          <span>Postularme</span>
                        </>
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

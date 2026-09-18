import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCalendarDays, FaPencil } from 'react-icons/fa6';
import { Project } from '../../../../redux/slices/projectsSlice';

// Propiedades recibidas por el componente ProjectTable
interface ProjectTableProps {
  projects: Project[];
  users: any[];
  isTutor?: boolean;
  onRemoveStudent: (projectId: string, studentId: string) => void;
  onRemoveCoTeacher: (projectId: string, teacherId: string) => void;
  onAssignClick: (project: Project) => void;
  onAddCoTeacherClick: (project: Project) => void;
  onActivityClick: (project: Project) => void;
  onEditClick: (project: Project) => void;
  onDeleteClick: (project: Project) => void;
  onViewProjectClick?: (project: Project) => void;
  onRequestJoinClick?: (project: Project) => void;
  pendingProjectIds?: Set<string>;
  activeProjectIds?: Set<string>;
}

/**
 * Componente que renderiza el listado de proyectos en una tabla estructurada y estilizada.
 * Muestra el proyecto unificando título, descripción y categoría; lista los miembros asignados,
 * y presenta la columna de acciones con el botón rápido "Asignar" y el menú vertical dropdown (⋮).
 */
const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  users,
  isTutor = false,
  onRemoveStudent,
  onRemoveCoTeacher,
  onAssignClick,
  onAddCoTeacherClick,
  onActivityClick,
  onEditClick,
  onDeleteClick,
  onViewProjectClick,
  onRequestJoinClick,
  pendingProjectIds,
  activeProjectIds,
}) => {
  const navigate = useNavigate();

  // Determinar si efectivamente es tutor (vía prop o localStorage como respaldo)
  const effectiveIsTutor = useMemo(() => {
    if (isTutor) return true;
    try {
      if (localStorage.getItem('teacherViewProfile') === 'tutor') return true;
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.isTutor === true || u.isTutor === 'true') return true;
      const rawRoles = Array.isArray(u.roles) ? u.roles : u.rol ? [u.rol] : [];
      const normalizedRoles = rawRoles.map((r: any) => String(r).toUpperCase().trim());
      if (normalizedRoles.includes('TUTOR')) return true;
      const emailLower = (u.email || '').toLowerCase();
      if (emailLower.includes('tutor') || emailLower.includes('jose') || emailLower.includes('gomez')) return true;
    } catch {}
    return false;
  }, [isTutor]);

  // Estado local para identificar el dropdown abierto actualmente en las filas de la tabla
  const [activeDropdownProjectId, setActiveDropdownProjectId] = useState<string | null>(null);

  // Redirige o ejecuta la acción para ver el proyecto / trabajo
  const handleViewProject = (project: Project) => {
    setActiveDropdownProjectId(null);
    if (onViewProjectClick) {
      onViewProjectClick(project);
    } else {
      const isPPP =
        project.categoria?.toUpperCase() === 'PPP' ||
        project.projectType?.name?.toUpperCase() === 'PPP';
      if (isPPP) {
        navigate(`/ppp/${project.id}`);
      } else {
        navigate(`/proyectos/${project.id}/trabajo`);
      }
    }
  };

  // Resuelve el nombre completo o email de un miembro por su ID de usuario
  const getMemberName = (userId: string) => {
    const userFound = users.find((u) => String(u.id) === String(userId));
    return userFound ? ([userFound.nombre, userFound.apellido].filter(Boolean).join(' ') || userFound.email) : `Usuario #${userId}`;
  };

  // Renderiza el badge estilizado de la categoría o tipo de proyecto
  const renderCategoryBadge = (category?: string) => {
    if (!category) {
      return <span className="badge-project-type-tfi me-2">TFI</span>;
    }
    const cleanCategory = category.toLowerCase().trim();

    if (cleanCategory === 'ppp') {
      return (
        <span className="badge-project-type-ppp me-2">
          PPP
        </span>
      );
    }

    let badgeStyleClass = 'badge-generic';
    if (cleanCategory === 'desarrollo' || cleanCategory === 'development') {
      badgeStyleClass = 'badge-desarrollo';
    } else if (cleanCategory === 'investigacion' || cleanCategory === 'investigación' || cleanCategory === 'research') {
      badgeStyleClass = 'badge-investigacion';
    } else if (cleanCategory === 'extension' || cleanCategory === 'extensión') {
      badgeStyleClass = 'badge-extension';
    }

    return (
      <span className="d-inline-flex align-items-center gap-1.5 me-2">
        <span className="badge-project-type-tfi">TFI</span>
        <span className={`project-category-badge ${badgeStyleClass}`}>
          {category}
        </span>
      </span>
    );
  };

  // Formatea la fecha de creación del proyecto
  const formatCreationDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const parsedDate = new Date(dateString);
      return parsedDate.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="projects-table-wrapper">
      <table className="table table-striped table-hover m-0 align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: '45%', padding: '12px 16px' }}>Proyecto</th>
            <th style={{ width: '22%', padding: '12px 16px' }}>Alumnos Asignados</th>
            <th style={{ width: '18%', padding: '12px 16px' }}>Docentes</th>
            <th style={{ width: '15%', padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-5 text-muted">
                No se encontraron proyectos activos con los filtros indicados.
              </td>
            </tr>
          ) : (
            projects.map((project) => (
              <tr key={project.id}>
                {/* Columna: Proyecto (Fusión de Título, Descripción, Categoría y Fecha) */}
                <td style={{ padding: '12px 16px' }}>
                  {renderCategoryBadge(project.categoria)}
                  {(() => {
                    const isPPP =
                      project.categoria?.toUpperCase() === 'PPP' ||
                      project.projectType?.name?.toUpperCase() === 'PPP';
                    const targetUrl = isPPP
                      ? `/ppp/${encodeURIComponent(project.id)}`
                      : `/proyectos/${encodeURIComponent(project.id)}/trabajo`;
                    return (
                      <Link to={targetUrl} className="project-title-link">
                        {project.titulo}
                      </Link>
                    );
                  })()}
                  <p className="project-description-text">{project.descripcion}</p>

                  {project.createdAt && (
                    <div className="project-date-text">
                      <FaCalendarDays size={12} className="text-muted" />
                      Creado el {formatCreationDate(project.createdAt)}
                    </div>
                  )}
                </td>

                {/* Columna: Alumnos asignados */}
                <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                  {project.students.length === 0 ? (
                    <span className="text-muted small">Sin alumnos asignados</span>
                  ) : (
                    <ul className="inline-member-list">
                      {project.students.map((studentId) => (
                        <li key={studentId} className="inline-member-item">
                          <span className="text-truncate" style={{ maxWidth: '140px' }} title={getMemberName(studentId)}>
                            {getMemberName(studentId)}
                          </span>
                          {!effectiveIsTutor && (
                            <button
                              type="button"
                              className="btn-remove-member"
                              title="Quitar alumno"
                              onClick={() => onRemoveStudent(project.id, studentId)}
                            >
                              ×
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                {/* Columna: Co-docentes */}
                <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                  {(!project.coTeachers || project.coTeachers.length === 0) ? (
                    <span className="text-muted small">Sin docentes</span>
                  ) : (
                    <ul className="inline-member-list">
                      {project.coTeachers.map((teacherId) => (
                        <li key={teacherId} className="inline-member-item">
                          <span className="text-truncate" style={{ maxWidth: '140px' }} title={getMemberName(teacherId)}>
                            {getMemberName(teacherId)}
                          </span>
                          {!effectiveIsTutor && (
                            <button
                              type="button"
                              className="btn-remove-member"
                              title="Quitar co-docente"
                              onClick={() => onRemoveCoTeacher(project.id, teacherId)}
                            >
                              ×
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                {/* Columna: Acciones (Menú Dropdown ⋮ / Lápiz) */}
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div className="d-inline-flex align-items-center justify-content-center">
                    <div className="actions-dropdown-wrapper">
                      <button
                        type="button"
                        className={`btn-actions-trigger d-flex align-items-center justify-content-center ${activeDropdownProjectId === project.id ? 'active' : ''}`}
                        onClick={() => setActiveDropdownProjectId(activeDropdownProjectId === project.id ? null : project.id)}
                        title="Acciones"
                      >
                        <FaPencil size={14} />
                      </button>

                      {activeDropdownProjectId === project.id && (
                        <>
                          {/* Capturador de clics en el fondo para cerrar el menú */}
                          <div
                            className="dropdown-click-outside-backdrop"
                            onClick={() => setActiveDropdownProjectId(null)}
                          />
                          <ul className="custom-dropdown-menu dropdown-menu-end">
                            {/* Acción: Ver proyecto (Redirige a pantalla Trabajo) */}
                            <button
                              type="button"
                              className="custom-dropdown-item fw-semibold"
                              style={{ color: 'var(--unla-primary, #64001d)' }}
                              onClick={() => handleViewProject(project)}
                            >
                              Ver proyecto
                            </button>

                            {/* Acción: Solicitar unirse */}
                            {onRequestJoinClick && (
                              <>
                                <li className="dropdown-divider" style={{ margin: '4px 0' }} />
                                <button
                                  type="button"
                                  className="custom-dropdown-item fw-semibold text-primary"
                                  disabled={pendingProjectIds?.has(String(project.id)) || activeProjectIds?.has(String(project.id))}
                                  onClick={() => {
                                    setActiveDropdownProjectId(null);
                                    onRequestJoinClick(project);
                                  }}
                                >
                                  {activeProjectIds?.has(String(project.id))
                                    ? '✓ Ya sos miembro'
                                    : pendingProjectIds?.has(String(project.id))
                                    ? '⏳ Solicitud pendiente'
                                    : '+ Solicitar unirse'}
                                </button>
                              </>
                            )}

                            {/* Opciones exclusivas para Evaluador y Admin (no visibles para Tutor) */}
                            {!effectiveIsTutor && (
                              <>
                                <li className="dropdown-divider" style={{ margin: '4px 0' }} />

                                {/* Acción: Asignar Alumno */}
                                <button
                                  type="button"
                                  className="custom-dropdown-item"
                                  disabled={project.students.length >= 5}
                                  onClick={() => {
                                    setActiveDropdownProjectId(null);
                                    onAssignClick(project);
                                  }}
                                >
                                  Asignar Alumno
                                </button>

                                {/* Acción: Ver Actividad */}
                                <button
                                  type="button"
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setActiveDropdownProjectId(null);
                                    onActivityClick(project);
                                  }}
                                >
                                  Ver Actividad
                                </button>

                                {/* Acción: Agregar Co-docente */}
                                <button
                                  type="button"
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setActiveDropdownProjectId(null);
                                    onAddCoTeacherClick(project);
                                  }}
                                >
                                  Agregar Docente
                                </button>

                                {/* Acción: Editar Proyecto */}
                                <button
                                  type="button"
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setActiveDropdownProjectId(null);
                                    onEditClick(project);
                                  }}
                                >
                                  Editar Proyecto
                                </button>

                                {/* Divisor */}
                                <li className="dropdown-divider" style={{ margin: '4px 0' }} />

                                {/* Acción: Eliminar (mover a papelera) */}
                                <button
                                  type="button"
                                  className="custom-dropdown-item text-danger"
                                  onClick={() => {
                                    setActiveDropdownProjectId(null);
                                    onDeleteClick(project);
                                  }}
                                >
                                  Eliminar Proyecto
                                </button>
                              </>
                            )}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectTable;

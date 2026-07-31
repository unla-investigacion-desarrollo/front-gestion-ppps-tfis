import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../../../../redux/slices/projectsSlice';

// Propiedades recibidas por el componente ProjectTable
interface ProjectTableProps {
  projects: Project[];
  users: any[];
  onRemoveStudent: (projectId: string, studentId: string) => void;
  onRemoveCoTeacher: (projectId: string, teacherId: string) => void;
  onAssignClick: (project: Project) => void;
  onAddCoTeacherClick: (project: Project) => void;
  onActivityClick: (project: Project) => void;
  onEditClick: (project: Project) => void;
  onDeleteClick: (project: Project) => void;
}

/**
 * Componente que renderiza el listado de proyectos en una tabla estructurada y estilizada.
 * Muestra el proyecto unificando título, descripción y categoría; lista los miembros asignados,
 * y presenta la columna de acciones con el botón rápido "Asignar" y el menú vertical dropdown (⋮).
 */
const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  users,
  onRemoveStudent,
  onRemoveCoTeacher,
  onAssignClick,
  onAddCoTeacherClick,
  onActivityClick,
  onEditClick,
  onDeleteClick,
}) => {
  // Estado local para identificar el dropdown abierto actualmente en las filas de la tabla
  const [activeDropdownProjectId, setActiveDropdownProjectId] = useState<string | null>(null);

  // Resuelve el nombre completo o email de un miembro por su ID de usuario
  const getMemberName = (userId: string) => {
    const userFound = users.find((u) => u.id === userId);
    return userFound ? ([userFound.nombre, userFound.apellido].filter(Boolean).join(' ') || userFound.email) : userId;
  };

  // Renderiza el badge estilizado de la categoría de proyecto
  const renderCategoryBadge = (category?: string) => {
    if (!category) return null;
    const cleanCategory = category.toLowerCase().trim();
    let badgeStyleClass = 'badge-generic';

    if (cleanCategory === 'desarrollo') {
      badgeStyleClass = 'badge-desarrollo';
    } else if (cleanCategory === 'investigacion') {
      badgeStyleClass = 'badge-investigacion';
    } else if (cleanCategory === 'extension') {
      badgeStyleClass = 'badge-extension';
    }

    return (
      <span className={`project-category-badge ${badgeStyleClass}`}>
        {category}
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
            <th style={{ width: '22%', padding: '12px 16px' }}>Alumnos Asignados (máx. 5)</th>
            <th style={{ width: '18%', padding: '12px 16px' }}>Co-docentes</th>
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
                  <Link
                    to={`/docente/entregas?projectId=${encodeURIComponent(project.id)}`}
                    className="project-title-link"
                  >
                    {project.titulo}
                  </Link>
                  <p className="project-description-text">{project.descripcion}</p>

                  {project.createdAt && (
                    <div className="project-date-text">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                      </svg>
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
                          <button
                            type="button"
                            className="btn-remove-member"
                            title="Quitar alumno"
                            onClick={() => onRemoveStudent(project.id, studentId)}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                {/* Columna: Co-docentes */}
                <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                  {(!project.coTeachers || project.coTeachers.length === 0) ? (
                    <span className="text-muted small">Sin co-docentes</span>
                  ) : (
                    <ul className="inline-member-list">
                      {project.coTeachers.map((teacherId) => (
                        <li key={teacherId} className="inline-member-item">
                          <span className="text-truncate" style={{ maxWidth: '140px' }} title={getMemberName(teacherId)}>
                            {getMemberName(teacherId)}
                          </span>
                          <button
                            type="button"
                            className="btn-remove-member"
                            title="Quitar co-docente"
                            onClick={() => onRemoveCoTeacher(project.id, teacherId)}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                {/* Columna: Acciones (Menú Dropdown ⋮) */}
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div className="d-inline-flex align-items-center gap-2">
                    {/* Menú de Tres Puntos Verticales */}
                    <div className="actions-dropdown-wrapper">
                      <button
                        type="button"
                        className={`btn-actions-trigger d-flex align-items-center justify-content-center ${activeDropdownProjectId === project.id ? 'active' : ''}`}
                        onClick={() => setActiveDropdownProjectId(activeDropdownProjectId === project.id ? null : project.id)}
                      >
                        ⋮
                      </button>

                      {activeDropdownProjectId === project.id && (
                        <>
                          {/* Capturador de clics en el fondo para cerrar el menú */}
                          <div
                            className="dropdown-click-outside-backdrop"
                            onClick={() => setActiveDropdownProjectId(null)}
                          />
                          <ul className="custom-dropdown-menu dropdown-menu-end">
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
                              Agregar Co-docente
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

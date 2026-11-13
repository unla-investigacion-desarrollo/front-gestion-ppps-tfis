import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCalendarDays, FaPencil, FaTrashCan } from 'react-icons/fa6';
import { Project } from '../../../../redux/slices/projectsSlice';

// Propiedades recibidas por el componente ProjectTable
interface ProjectTableProps {
  projects: Project[];
  users: any[];
  isTutor?: boolean;
  canDeleteProject?: boolean;
  onRemoveStudent: (projectId: string, studentId: string) => void;
  onRemoveCoTeacher: (projectId: string, teacherId: string) => void;
  onActivityClick: (project: Project) => void;
  onEditClick: (project: Project) => void;
  onDeleteClick?: (project: Project) => void;
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
  canDeleteProject = false,
  onRemoveStudent,
  onRemoveCoTeacher,
  onActivityClick,
  onEditClick,
  onDeleteClick,
  onViewProjectClick,
  onRequestJoinClick,
  pendingProjectIds,
  activeProjectIds,
}) => {
  const navigate = useNavigate();

  // Determinar si efectivamente es tutor (vía prop o user como respaldo)
  const effectiveIsTutor = useMemo(() => {
    if (isTutor !== undefined) return Boolean(isTutor);
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return Boolean(u.isTutor);
    } catch { }
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
        navigate(`/proyectos/${project.id}/trabajo?from=proyectos`, { state: { from: 'proyectos' } });
      }
    }
  };

  // Resuelve el nombre completo o email de un miembro por su ID de usuario o descriptor de objeto
  const getMemberName = (member: any) => {
    if (!member) return '';
    if (typeof member === 'object') {
      const userObj =
        member.student?.user ||
        member.professor?.user ||
        member.user ||
        member.student ||
        member.professor ||
        member;
      const firstName = userObj.firstName || userObj.nombre || '';
      const lastName = userObj.lastName || userObj.apellido || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      if (fullName) return fullName;
      if (userObj.name) return userObj.name;
      if (userObj.email) return userObj.email;

      const rawId = String(userObj.id || userObj.id_user || member.id || member.id_user || '');
      if (rawId) {
        const userFound = users.find((u) => String(u.id) === rawId || String(u.id_user) === rawId);
        if (userFound) {
          return [userFound.nombre, userFound.apellido].filter(Boolean).join(' ') || userFound.email || `Usuario #${rawId}`;
        }
        return `Usuario #${rawId}`;
      }
    }
    const idStr = String(member);
    const userFound = users.find((u) => String(u.id) === idStr || String(u.id_user) === idStr);
    return userFound
      ? ([userFound.nombre, userFound.apellido].filter(Boolean).join(' ') || userFound.email)
      : `Usuario #${idStr}`;
  };

  // Obtiene el identificador primitivo de un miembro para acciones de eliminación
  const getRawMemberId = (member: any): string => {
    if (!member) return '';
    if (typeof member === 'object') {
      return String(
        member.student?.user?.id ||
        member.student?.id_user ||
        member.student?.id ||
        member.professor?.user?.id ||
        member.professor?.id_user ||
        member.professor?.id ||
        member.id ||
        member.id_user ||
        ''
      );
    }
    return String(member);
  };

  // Obtiene la lista de alumnos asignados para un proyecto
  const getProjectStudents = (project: Project) => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    if (Array.isArray(project.activeStudents) && project.activeStudents.length > 0) {
      project.activeStudents.forEach((as: any) => {
        if (as && as.active !== false) {
          const sObj = as.student?.user || as.student || as.user || as;
          const id = String(sObj.id || as.student?.id_user || as.student?.id || as.id || '');
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            list.push(as);
          } else if (!id) {
            list.push(as);
          }
        }
      });
    }

    if (Array.isArray(project.students) && project.students.length > 0) {
      project.students.forEach((s: any) => {
        const id = typeof s === 'object' ? String(s.id || s.id_user || '') : String(s);
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          list.push(s);
        } else if (!id) {
          list.push(s);
        }
      });
    }

    const rawList =
      (project as any).raw?.activeStudents ||
      (project as any).raw?.students ||
      (project as any).users ||
      (project as any).alumnos;
    if (list.length === 0 && Array.isArray(rawList) && rawList.length > 0) {
      rawList.forEach((s: any) => {
        if (s && s.active !== false) {
          const sObj = s.student?.user || s.student || s.user || s;
          const id = String(sObj.id || s.student?.id_user || s.id || '');
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            list.push(s);
          } else if (!id) {
            list.push(s);
          }
        }
      });
    }

    return list;
  };

  // Obtiene la lista de docentes asignados para un proyecto (tutor principal + co-docentes)
  const getProjectTeachers = (project: Project) => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    // 1. Docentes de activeProfessors
    if (Array.isArray(project.activeProfessors) && project.activeProfessors.length > 0) {
      project.activeProfessors.forEach((ap: any) => {
        if (ap && ap.active !== false) {
          const pObj = ap.professor?.user || ap.professor || ap.user || ap;
          const id = String(pObj.id || ap.professor?.id_user || ap.professor?.id || ap.id || '');
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            list.push(ap);
          } else if (!id) {
            list.push(ap);
          }
        }
      });
    }

    // 2. Co-docentes
    if (Array.isArray(project.coTeachers) && project.coTeachers.length > 0) {
      project.coTeachers.forEach((t: any) => {
        const id = typeof t === 'object' ? String(t.id || t.id_user || '') : String(t);
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          list.push(t);
        } else if (!id) {
          list.push(t);
        }
      });
    }

    // 3. Tutor / Docente principal
    const mainTeacher = (project as any).teacher || (project as any).tutor || project.teacherId;
    if (mainTeacher) {
      const id = typeof mainTeacher === 'object' ? String(mainTeacher.id || mainTeacher.id_user || '') : String(mainTeacher);
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        list.push(mainTeacher);
      } else if (!id && list.length === 0) {
        list.push(mainTeacher);
      }
    }

    // 4. Si el docente actual tiene este proyecto activo en sus asignaciones
    if (activeProjectIds && activeProjectIds.has(String(project.id))) {
      let localUser: any = null;
      try {
        localUser = JSON.parse(localStorage.getItem('user') || '{}');
      } catch { }
      const curId = String(localUser?.id || localUser?.id_user || '');
      if (curId && !seenIds.has(curId)) {
        seenIds.add(curId);
        list.push(localUser);
      } else if (!curId && list.length === 0 && (localUser?.nombre || localUser?.firstName)) {
        list.push(localUser);
      }
    }

    return list;
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

  // Formatea la fecha de creación o revisión del proyecto
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

  // Obtiene la etiqueta y clase visual para el estado de la entrega (studentWork.status)
  const getStudentWorkStatusInfo = (project: Project): { label: string; pillClass: string } => {
    const work = project.studentWork || (project as any).raw?.studentWork || null;
    if (!work || !work.status) {
      return { label: 'Sin entrega', pillClass: 'finalizado' };
    }

    const rawStatus = String(work.status).toLowerCase().trim();
    switch (rawStatus) {
      case 'pending_review':
        return { label: 'Pendiente de revisión', pillClass: 'revision' };
      case 'observed':
        return { label: 'Con observaciones', pillClass: 'observaciones' };
      case 'approved':
        return { label: 'Aprobada', pillClass: 'aprobada' };
      case 'disapproved':
        return { label: 'Desaprobada', pillClass: 'sin-entrega' };
      case 'absent':
        return { label: 'Ausente', pillClass: 'finalizado' };
      default:
        return { label: work.status, pillClass: 'revision' };
    }
  };

  // Obtiene el nombre completo del último evaluador que revisó el trabajo
  const getLastReviewerName = (project: Project): string | null => {
    if (project.lastReviewedByName) return project.lastReviewedByName;
    const reviewer =
      project.studentWork?.lastReviewedBy ||
      (project as any).raw?.studentWork?.lastReviewedBy ||
      (project as any).raw?.lastReviewedBy ||
      null;
    if (!reviewer) return null;
    if (typeof reviewer === 'string') return reviewer;
    const resolved = getMemberName(reviewer);
    return resolved || null;
  };

  // Obtiene el nombre completo del último tutor que revisó / tutorizó el trabajo
  const getLastTutoredByName = (project: Project): string | null => {
    if (project.lastTutoredByName) return project.lastTutoredByName;
    const tutor =
      project.studentWork?.lastTutoredBy ||
      (project as any).raw?.studentWork?.lastTutoredBy ||
      (project as any).raw?.lastTutoredBy ||
      null;
    if (!tutor) return null;
    if (typeof tutor === 'string') return tutor;
    const resolved = getMemberName(tutor);
    return resolved || null;
  };

  return (
    <div className="projects-table-wrapper">
      <table className="table table-striped table-hover m-0 align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: '25%', padding: '12px 16px' }}>Proyecto</th>
            <th style={{ width: '16%', padding: '12px 16px' }}>Alumnos Asignados</th>
            <th style={{ width: '15%', padding: '12px 16px' }}>Docentes</th>
            <th style={{ width: '10%', padding: '12px 16px' }}>Estado</th>
            <th style={{ width: '13%', padding: '12px 16px' }}>Última revisión Evaluador</th>
            <th style={{ width: '13%', padding: '12px 16px' }}>Última revisión Tutor</th>
            <th style={{ width: '8%', padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-5 text-muted">
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
                      : `/proyectos/${encodeURIComponent(project.id)}/trabajo?from=proyectos`;
                    return (
                      <Link to={targetUrl} state={{ from: 'proyectos' }} className="project-title-link">
                        {project.titulo}
                      </Link>
                    );
                  })()}
                  {project.descripcion && (
                    <p className="project-description-text">{project.descripcion}</p>
                  )}

                  {project.createdAt && (
                    <div className="project-date-text">
                      <FaCalendarDays size={12} className="text-muted" />
                      Creado el {formatCreationDate(project.createdAt)}
                    </div>
                  )}
                </td>

                {/* Columna: Alumnos asignados */}
                <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                  {(() => {
                    const assignedStudents = getProjectStudents(project);
                    if (assignedStudents.length === 0) {
                      return <span className="text-muted small">Sin alumnos asignados</span>;
                    }
                    return (
                      <ul className="inline-member-list">
                        {assignedStudents.map((member, idx) => {
                          const name = getMemberName(member);
                          const memberId = getRawMemberId(member) || String(idx);
                          return (
                            <li key={`${memberId}-${idx}`} className="inline-member-item">
                              <span className="text-truncate" style={{ maxWidth: '140px' }} title={name}>
                                {name}
                              </span>
                              {!effectiveIsTutor && (
                                <button
                                  type="button"
                                  className="btn-remove-member"
                                  title="Quitar alumno"
                                  onClick={() => onRemoveStudent(project.id, memberId)}
                                >
                                  ×
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    );
                  })()}
                </td>

                {/* Columna: Docentes */}
                <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                  {(() => {
                    const assignedTeachers = getProjectTeachers(project);
                    if (assignedTeachers.length === 0) {
                      return <span className="text-muted small">Sin docentes</span>;
                    }
                    return (
                      <ul className="inline-member-list">
                        {assignedTeachers.map((member, idx) => {
                          const name = getMemberName(member);
                          const memberId = getRawMemberId(member) || String(idx);
                          return (
                            <li key={`${memberId}-${idx}`} className="inline-member-item">
                              <span className="text-truncate" style={{ maxWidth: '140px' }} title={name}>
                                {name}
                              </span>
                              {!effectiveIsTutor && (
                                <button
                                  type="button"
                                  className="btn-remove-member"
                                  title="Quitar co-docente"
                                  onClick={() => onRemoveCoTeacher(project.id, memberId)}
                                >
                                  ×
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    );
                  })()}
                </td>

                {/* Columna: Estado de la entrega (studentWork.status) */}
                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                  {(() => {
                    const { label, pillClass } = getStudentWorkStatusInfo(project);
                    return (
                      <span className={`teacher-status-pill ${pillClass}`}>
                        <span className="status-dot" />
                        <span>{label}</span>
                      </span>
                    );
                  })()}
                </td>

                {/* Columna: Última revisión por Evaluador */}
                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                  {(() => {
                    const reviewerName = getLastReviewerName(project);
                    const reviewedAt =
                      project.lastReviewedAt ||
                      project.studentWork?.lastReviewedAt ||
                      (project as any).raw?.studentWork?.lastReviewedAt ||
                      null;

                    if (!reviewerName) {
                      return <span className="text-muted small">Sin revisiones</span>;
                    }

                    return (
                      <div>
                        <div className="fw-medium text-dark" style={{ fontSize: '13.5px' }}>
                          {reviewerName}
                        </div>
                        {reviewedAt && (
                          <div className="text-muted" style={{ fontSize: '11.5px' }}>
                            {formatCreationDate(reviewedAt)}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </td>

                {/* Columna: Última revisión Tutor */}
                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                  {(() => {
                    const tutorName = getLastTutoredByName(project);
                    const tutoredAt =
                      project.lastTutoredAt ||
                      project.studentWork?.lastTutoredAt ||
                      (project as any).raw?.studentWork?.lastTutoredAt ||
                      null;

                    if (!tutorName) {
                      return <span className="text-muted small">Sin revisiones</span>;
                    }

                    return (
                      <div>
                        <div className="fw-medium text-dark" style={{ fontSize: '13.5px' }}>
                          {tutorName}
                        </div>
                        {tutoredAt && (
                          <div className="text-muted" style={{ fontSize: '11.5px' }}>
                            {formatCreationDate(tutoredAt)}
                          </div>
                        )}
                      </div>
                    );
                  })()}
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

                            {/* Acción: Solicitar unirse (solo para Tutor) */}
                            {effectiveIsTutor && onRequestJoinClick && (
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
                              </>
                            )}

                            {/* Acción exclusiva para Admin / Superadmin: Eliminar Proyecto */}
                            {canDeleteProject && onDeleteClick && (
                              <>
                                <li className="dropdown-divider" style={{ margin: '4px 0' }} />
                                <button
                                  type="button"
                                  className="custom-dropdown-item text-danger d-flex align-items-center gap-2"
                                  onClick={() => {
                                    setActiveDropdownProjectId(null);
                                    onDeleteClick(project);
                                  }}
                                >
                                  <FaTrashCan size={13} />
                                  <span>Eliminar Proyecto</span>
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

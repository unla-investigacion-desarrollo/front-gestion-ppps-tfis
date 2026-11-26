import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCalendarDays, FaPencil, FaTrashCan, FaUserGroup, FaChalkboardUser, FaEye, FaPaperPlane } from 'react-icons/fa6';
import { LuUserX } from 'react-icons/lu';
import { Project } from '../../../../redux/slices/projectsSlice';
import { formatShortDate } from '../../../utils/formatters';
import { resolveMemberDisplayName } from '../../../utils/userUtils';

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
        className={`project-description-text mb-1${expanded ? ' expanded' : ''}`}
      >
        {description}
      </p>
      {(hasMore || expanded) && (
        <button
          type="button"
          className="project-description-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((isExpanded) => !isExpanded)}
        >
          Mostrar {expanded ? 'menos' : 'más'}
        </button>
      )}
    </>
  );
};

// Propiedades recibidas por el componente ProjectTable
interface ProjectTableProps {
  projects: Project[];
  users: any[];
  isTutor?: boolean;
  canRemoveProjectMembers: boolean;
  canDeleteProject?: boolean;
  onRemoveStudent: (projectId: string, studentId: string) => void;
  onRemoveCoTeacher: (projectId: string, teacherId: string) => void;
  onActivityClick?: (project: Project) => void;
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
  canRemoveProjectMembers,
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

  // Estado local para el modal de desasignar integrantes
  const [managingMembersProject, setManagingMembersProject] = useState<Project | null>(null);

  // Redirige o ejecuta la acción para ver el proyecto / trabajo
  const handleViewProject = (project: Project) => {
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
  const getMemberName = (member: any) => resolveMemberDisplayName(member, users, '');

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
      return null;
    }
    const cleanCategory = category.toLowerCase().trim();

    if (cleanCategory === 'ppp') {
      return (
        <div className="projects-table-badges">
          <span className="badge-tfi-pill">PPP</span>
        </div>
      );
    }

    let badgeStyleClass = 'badge-project-default';
    if (cleanCategory === 'desarrollo' || cleanCategory === 'development') {
      badgeStyleClass = 'badge-project-development';
    } else if (cleanCategory === 'investigacion' || cleanCategory === 'investigación' || cleanCategory === 'research') {
      badgeStyleClass = 'badge-project-research';
    } else if (cleanCategory === 'extension' || cleanCategory === 'extensión') {
      badgeStyleClass = 'badge-project-extension';
    }

    return (
      <div className="projects-table-badges">
        <span className={badgeStyleClass}>
          {category}
        </span>
      </div>
    );
  };

  // Formatea la fecha de creación o revisión del proyecto
  const formatCreationDate = (dateString?: string) => formatShortDate(dateString, '');

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
    <div className="projects-table-container">
      <table className="projects-table">
        <thead>
          <tr>
            <th style={{ width: effectiveIsTutor ? '60%' : '25%' }}>Proyecto</th>
            {!effectiveIsTutor && (
              <>
                <th style={{ width: '16%' }}>Alumnos Asignados</th>
                <th style={{ width: '15%' }}>Docentes</th>
              </>
            )}
            <th style={{ width: effectiveIsTutor ? '20%' : '10%' }}>Estado</th>
            {!effectiveIsTutor && (
              <>
                <th style={{ width: '13%' }}>Última revisión Evaluador</th>
                <th style={{ width: '13%' }}>Última revisión Tutor</th>
              </>
            )}
            <th style={{ width: effectiveIsTutor ? '20%' : '8%', textAlign: 'right', paddingRight: '24px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr>
              <td colSpan={effectiveIsTutor ? 3 : 7} className="text-center py-5 text-muted">
                No se encontraron proyectos activos con los filtros indicados.
              </td>
            </tr>
          ) : (
            projects.map((project, projectIndex) => (
              <tr key={project.id}>
                {/* Columna: Proyecto (Fusión de Título, Categoría, Descripción y Fecha) */}
                <td>
                  {(() => {
                    const isPPP =
                      project.categoria?.toUpperCase() === 'PPP' ||
                      project.projectType?.name?.toUpperCase() === 'PPP';
                    const targetUrl = isPPP
                      ? `/ppp/${encodeURIComponent(project.id)}`
                      : `/proyectos/${encodeURIComponent(project.id)}/trabajo?from=proyectos`;
                    return (
                      <Link to={targetUrl} state={{ from: 'proyectos' }} className="projects-table-title-link">
                        {project.titulo}
                      </Link>
                    );
                  })()}
                  {renderCategoryBadge(project.categoria)}
                  {project.descripcion && (
                    <ProjectDescription description={project.descripcion} />
                  )}

                  {project.createdAt && (
                    <div className="project-date-text mt-1">
                      <FaCalendarDays size={12} className="text-muted" />
                      Creado el {formatCreationDate(project.createdAt)}
                    </div>
                  )}
                </td>

                {!effectiveIsTutor && (
                  <>
                    {/* Columna: Alumnos asignados */}
                    <td>
                      {(() => {
                        const assignedStudents = getProjectStudents(project);
                        if (assignedStudents.length === 0) {
                          return (
                            <span className="empty-cell-muted">
                              <FaUserGroup size={12} />
                              <span>Sin alumnos</span>
                            </span>
                          );
                        }
                        return (
                          <ul className="projects-member-list">
                            {assignedStudents.map((member, idx) => {
                              const name = getMemberName(member);
                              const memberId = getRawMemberId(member) || String(idx);
                              return (
                                <li key={`${memberId}-${idx}`} className="projects-member-name text-truncate" style={{ maxWidth: '180px' }} title={name}>
                                  {name}
                                </li>
                              );
                            })}
                          </ul>
                        );
                      })()}
                    </td>

                    {/* Columna: Docentes */}
                    <td>
                      {(() => {
                        const assignedTeachers = getProjectTeachers(project);
                        if (assignedTeachers.length === 0) {
                          return (
                            <span className="empty-cell-muted">
                              <FaChalkboardUser size={12} />
                              <span>Sin tutor asignado</span>
                            </span>
                          );
                        }
                        return (
                          <ul className="projects-member-list">
                            {assignedTeachers.map((member, idx) => {
                              const name = getMemberName(member);
                              const memberId = getRawMemberId(member) || String(idx);
                              return (
                                <li key={`${memberId}-${idx}`} className="projects-member-name text-truncate" style={{ maxWidth: '180px' }} title={name}>
                                  {name}
                                </li>
                              );
                            })}
                          </ul>
                        );
                      })()}
                    </td>
                  </>
                )}

                {/* Columna: Estado de la entrega (studentWork.status) */}
                <td>
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

                {!effectiveIsTutor && (
                  <>
                    {/* Columna: Última revisión por Evaluador */}
                    <td>
                      {(() => {
                        const reviewerName = getLastReviewerName(project);
                        const reviewedAt =
                          project.lastReviewedAt ||
                          project.studentWork?.lastReviewedAt ||
                          (project as any).raw?.studentWork?.lastReviewedAt ||
                          null;

                        if (!reviewerName) {
                          return <span className="empty-cell-dash">—</span>;
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
                    <td>
                      {(() => {
                        const tutorName = getLastTutoredByName(project);
                        const tutoredAt =
                          project.lastTutoredAt ||
                          project.studentWork?.lastTutoredAt ||
                          (project as any).raw?.studentWork?.lastTutoredAt ||
                          null;

                        if (!tutorName) {
                          return <span className="empty-cell-dash">—</span>;
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
                  </>
                )}

                {/* Columna: Acciones (Menú Dropdown ⋮) */}
                {/* Columna: Acciones */}
                <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                  {effectiveIsTutor ? (
                    <div className="tutor-actions-group">
                      {onRequestJoinClick && (() => {
                        const isMember = activeProjectIds?.has(String(project.id));
                        const isPending = pendingProjectIds?.has(String(project.id));
                        return (
                          <button
                            type="button"
                            className="btn-tutor-join"
                            disabled={Boolean(isMember || isPending)}
                            onClick={() => onRequestJoinClick(project)}
                            title={
                              isMember
                                ? 'Ya sos miembro'
                                : isPending
                                  ? 'Solicitud pendiente'
                                  : 'Postularse al proyecto'
                            }
                            aria-label="Postularse al proyecto"
                          >
                            <FaPaperPlane size={13} />
                            <span>{isMember ? 'Miembro' : isPending ? 'Pendiente' : 'Postularse'}</span>
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        className="btn-tutor-icon-action btn-tutor-view"
                        onClick={() => handleViewProject(project)}
                        title="Ver proyecto"
                        aria-label="Ver proyecto"
                      >
                        <FaEye size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="tutor-actions-group">
                      <button
                        type="button"
                        className="btn-tutor-icon-action btn-tutor-view"
                        onClick={() => handleViewProject(project)}
                        title="Ver proyecto"
                        aria-label="Ver proyecto"
                      >
                        <FaEye size={15} />
                      </button>

                      <button
                        type="button"
                        className="btn-tutor-icon-action btn-tutor-view"
                        onClick={() => onEditClick(project)}
                        title="Editar Proyecto"
                        aria-label="Editar Proyecto"
                      >
                        <FaPencil size={14} />
                      </button>

                      {canRemoveProjectMembers && (
                        <button
                          type="button"
                          className="btn-tutor-icon-action btn-ppp-delete"
                          onClick={() => setManagingMembersProject(project)}
                          title="Desvincular integrantes"
                          aria-label="Desvincular integrantes"
                        >
                          <LuUserX size={15} />
                        </button>
                      )}

                      {canDeleteProject && onDeleteClick && (
                        <button
                          type="button"
                          className="btn-tutor-icon-action btn-ppp-delete"
                          onClick={() => onDeleteClick(project)}
                          title="Eliminar Proyecto"
                          aria-label="Eliminar Proyecto"
                        >
                          <FaTrashCan size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal para desasignar alumnos o docentes del proyecto */}
      {managingMembersProject && (() => {
        const assignedStudents = getProjectStudents(managingMembersProject);
        const assignedTeachers = getProjectTeachers(managingMembersProject);
        return (
          <>
            <div
              className="modal fade show custom-modal-dialog-wrapper"
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="manage-members-title"
              onClick={() => setManagingMembersProject(null)}
            >
              <div className="modal-dialog modal-md modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content custom-modal-content">
                  <div className="modal-header custom-modal-header">
                    <div>
                      <h5 id="manage-members-title" className="modal-title" style={{ fontWeight: 700, color: '#64001d' }}>
                        Desvincular integrantes
                      </h5>
                      <div className="text-muted small">{managingMembersProject.titulo}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setManagingMembersProject(null)}
                      aria-label="Cerrar"
                    />
                  </div>
                  <div className="modal-body custom-modal-body d-flex flex-column gap-4">
                    <div>
                      <div className="text-uppercase fw-bold text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                        Alumnos asignados
                      </div>
                      {assignedStudents.length === 0 ? (
                        <div className="empty-cell-muted">
                          <FaUserGroup size={12} />
                          <span>Sin alumnos asignados</span>
                        </div>
                      ) : (
                        <ul className="inline-member-list">
                          {assignedStudents.map((member, idx) => {
                            const name = getMemberName(member);
                            const memberId = getRawMemberId(member) || String(idx);
                            return (
                              <li key={`modal-student-${memberId}-${idx}`} className="inline-member-item py-2 px-3">
                                <span className="fw-medium text-dark">{name}</span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => {
                                    setManagingMembersProject(null);
                                    onRemoveStudent(managingMembersProject.id, memberId);
                                  }}
                                >
                                  Desvincular
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div>
                      <div className="text-uppercase fw-bold text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                        Docentes / Tutores
                      </div>
                      {assignedTeachers.length === 0 ? (
                        <div className="empty-cell-muted">
                          <FaChalkboardUser size={12} />
                          <span>Sin tutor asignado</span>
                        </div>
                      ) : (
                        <ul className="inline-member-list">
                          {assignedTeachers.map((member, idx) => {
                            const name = getMemberName(member);
                            const memberId = getRawMemberId(member) || String(idx);
                            return (
                              <li key={`modal-teacher-${memberId}-${idx}`} className="inline-member-item py-2 px-3">
                                <span className="fw-medium text-dark">{name}</span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => {
                                    setManagingMembersProject(null);
                                    onRemoveCoTeacher(managingMembersProject.id, memberId);
                                  }}
                                >
                                  Desvincular
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer custom-modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setManagingMembersProject(null)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="custom-modal-backdrop" />
          </>
        );
      })()}
    </div>
  );
};

export default ProjectTable;

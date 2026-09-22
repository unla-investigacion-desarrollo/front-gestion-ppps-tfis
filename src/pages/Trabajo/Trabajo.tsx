import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { fetchUsers, selectUsers } from '../../../redux/slices/usersSlice';
import { fetchProjects, selectProjects } from '../../../redux/slices/projectsSlice';
import { projectService } from '../../services/projectService';
import {
  studentWorkService,
  StudentWork,
  StudentWorkStatus,
} from '../../services/studentWorkService';
import { showToast } from '../../utils/toast';
import {
  FaClock,
  FaCircleExclamation,
  FaCheck,
  FaXmark,
  FaMinus,
  FaArrowLeft,
  FaFileLines,
  FaPlus,
  FaCircleInfo,
  FaArrowUpRightFromSquare,
  FaFolderOpen,
  FaStar,
  FaGraduationCap,
  FaPencil,
  FaPaperPlane,
  FaChalkboardUser,
} from 'react-icons/fa6';
import './Trabajo.css';

/**
 * Pantalla Trabajo:
 * Visualización y gestión de la entrega de avances/final (StudentWork) asociada a un proyecto.
 */
const Trabajo: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<any>();

  // Determinar origen contextual de navegación (Mis proyectos vs Proyectos)
  const isFromMisProyectos = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromParam = searchParams.get('from');
    if (location.state?.from === 'mis-proyectos' || fromParam === 'mis-proyectos') {
      return true;
    }
    if (location.state?.from === 'proyectos' || fromParam === 'proyectos') {
      return false;
    }
    return false;
  }, [location.search, location.state]);

  const backDestination = isFromMisProyectos ? '/dashboard' : '/docente/proyectos';
  const backState = isFromMisProyectos ? { initialView: 'proyectos' } : undefined;
  const backLabel = isFromMisProyectos ? 'Ir a Mis Proyectos' : 'Ir a Proyectos';

  const currentUser = useSelector(selectCurrentUser) as any;
  const users = useSelector(selectUsers);
  const reduxProjects = useSelector(selectProjects);

  const token = localStorage.getItem('token') || '';

  // Estados locales de la pantalla
  const [project, setProject] = useState<any | null>(null);
  const [work, setWork] = useState<StudentWork | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Estados de modales
  const [showQualifyModal, setShowQualifyModal] = useState<boolean>(false);
  const [qualificationInput, setQualificationInput] = useState<string>('');

  const [showLinksModal, setShowLinksModal] = useState<boolean>(false);
  const [isEditingLinks, setIsEditingLinks] = useState<boolean>(false);
  const [docUrlInput, setDocUrlInput] = useState<string>('');
  const [driveUrlInput, setDriveUrlInput] = useState<string>('');
  const [urlErrors, setUrlErrors] = useState<{ doc?: string; drive?: string }>({});

  const [confirmActionModal, setConfirmActionModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    actionType: 'mark_observed' | 'notify_advances' | 'request_tutoring' | 'mark_tutored' | null;
  }>({
    open: false,
    title: '',
    message: '',
    confirmText: '',
    actionType: null,
  });

  // Identificación de roles
  const roles = useMemo(() => {
    const rawRoles = Array.isArray(currentUser?.roles)
      ? currentUser.roles
      : currentUser?.rol
        ? [currentUser.rol]
        : [];
    return rawRoles.map((r: any) => String(r).toUpperCase().trim());
  }, [currentUser]);

  const isAdmin = useMemo(() => roles.includes('ADMIN') || roles.includes('ADMINISTRADOR'), [roles]);
  const isTeacher = useMemo(
    () => roles.some((r: string) => ['DOCENTE', 'TEACHER', 'PROFESSOR'].includes(r)),
    [roles]
  );
  const isStudent = useMemo(
    () => roles.some((r: string) => ['ESTUDIANTE', 'STUDENT', 'ALUMNO'].includes(r)),
    [roles]
  );

  // Carga de usuarios y proyectos en Redux
  useEffect(() => {
    if (users.length === 0) {
      dispatch(fetchUsers());
    }
    if (reduxProjects.length === 0) {
      dispatch(fetchProjects());
    }
  }, [dispatch, users.length, reduxProjects.length]);

  // Función para obtener nombres de usuario (admite ID o descriptor de objeto)
  const resolveUserName = useCallback(
    (userIdOrObj: any) => {
      if (!userIdOrObj) return 'Desconocido';
      if (typeof userIdOrObj === 'object') {
        const u =
          userIdOrObj.student?.user ||
          userIdOrObj.professor?.user ||
          userIdOrObj.user ||
          userIdOrObj.student ||
          userIdOrObj.professor ||
          userIdOrObj;
        const name = [u.firstName || u.nombre, u.lastName || u.apellido].filter(Boolean).join(' ').trim();
        if (name) return name;
        if (u.name) return u.name;
        if (u.email) return u.email;
        userIdOrObj = u.id || u.id_user || userIdOrObj.id || userIdOrObj.id_user;
      }
      const idStr = String(userIdOrObj);
      const userFound = users.find((u) => String(u.id) === idStr || String(u.id_user) === idStr);
      if (userFound) {
        return [userFound.nombre, userFound.apellido].filter(Boolean).join(' ') || userFound.email || `Usuario #${idStr}`;
      }
      return `Usuario #${idStr}`;
    },
    [users]
  );

  // Cargar datos del proyecto y su StudentWork
  const loadProjectAndWork = useCallback(async () => {
    if (!projectId || !token) return;
    setLoading(true);
    try {
      // 1. Obtener Proyecto
      let currentProj = reduxProjects.find((p) => String(p.id) === String(projectId));
      if (!currentProj) {
        try {
          currentProj = await projectService.getProjectById(projectId, token);
        } catch (err: any) {
          console.warn('No se pudo cargar proyecto por ID directo:', err);
        }
      }
      setProject(currentProj || null);

      // 2. Obtener StudentWork
      const workData = await studentWorkService.getWorkByProject(projectId, token);
      setWork(workData);
    } catch (err: any) {
      console.error('Error al cargar datos del trabajo:', err);
      showToast(err.message || 'Error al cargar los datos del proyecto y su entrega', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, token, reduxProjects]);

  useEffect(() => {
    loadProjectAndWork();
  }, [loadProjectAndWork]);

  // Validaciones de URLs
  const validateUrls = (docUrl: string, driveUrl: string) => {
    const errs: { doc?: string; drive?: string } = {};

    if (!docUrl.trim()) {
      errs.doc = 'El enlace a Google Docs es obligatorio.';
    } else if (!docUrl.trim().startsWith('https://docs.google.com/')) {
      errs.doc = 'Debe ser una URL válida que comience con https://docs.google.com/';
    }

    if (driveUrl.trim() && !driveUrl.trim().startsWith('https://drive.google.com/')) {
      errs.drive = 'Debe ser una URL válida que comience con https://drive.google.com/';
    }

    setUrlErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Abrir modal de entrega / edición de enlaces
  const handleOpenLinksModal = (editing: boolean) => {
    setIsEditingLinks(editing);
    setDocUrlInput(work?.documentUrl || '');
    setDriveUrlInput(work?.driveFolderUrl || '');
    setUrlErrors({});
    setShowLinksModal(true);
  };

  // Guardar entrega inicial o actualización de enlaces
  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrls(docUrlInput, driveUrlInput)) return;
    if (!projectId || !token) return;

    setActionLoading(true);
    try {
      if (isEditingLinks && work?.id) {
        // PATCH /student-work/:id
        const updated = await studentWorkService.updateWork(
          work.id,
          {
            documentUrl: docUrlInput.trim(),
            driveFolderUrl: driveUrlInput.trim() || undefined,
          },
          token
        );
        setWork(updated);
        showToast('Enlaces de entrega actualizados correctamente', 'success');
      } else {
        // POST /student-work/project/:projectId
        const created = await studentWorkService.createWork(
          projectId,
          {
            documentUrl: docUrlInput.trim(),
            driveFolderUrl: driveUrlInput.trim() || undefined,
          },
          token
        );
        setWork(created);
        showToast('Entrega registrada exitosamente', 'success');
      }
      setShowLinksModal(false);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar la entrega', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Calificar entrega
  const handleOpenQualifyModal = () => {
    setQualificationInput(work?.qualification !== null && work?.qualification !== undefined ? String(work.qualification) : '');
    setShowQualifyModal(true);
  };

  const handleSaveQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!work?.id || !token) return;

    const num = parseInt(qualificationInput, 10);
    if (isNaN(num) || num < 0 || num > 10) {
      showToast('La calificación debe ser un número entero entre 0 y 10.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await studentWorkService.qualify(work.id, num, token);
      setWork(updated);
      showToast(`Calificación ${num} registrada correctamente`, 'success');
      setShowQualifyModal(false);
    } catch (err: any) {
      showToast(err.message || 'Error al calificar la entrega', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Ejecución de acciones de confirmación
  const handleConfirmAction = async () => {
    if (!work?.id || !token || !confirmActionModal.actionType) return;
    setActionLoading(true);

    try {
      let updated: StudentWork;
      switch (confirmActionModal.actionType) {
        case 'mark_observed':
          updated = await studentWorkService.markObserved(work.id, token);
          setWork(updated);
          showToast('La entrega fue marcada con observaciones', 'success');
          break;
        case 'notify_advances':
          updated = await studentWorkService.notifyAdvances(work.id, token);
          setWork(updated);
          showToast('Se notificaron los avances. Estado: Pendiente de revisión', 'success');
          break;
        case 'request_tutoring':
          updated = await studentWorkService.requestTutoring(work.id, token);
          setWork(updated);
          showToast('Tutoría solicitada exitosamente al equipo docente', 'success');
          break;
        case 'mark_tutored':
          updated = await studentWorkService.markTutored(work.id, token);
          setWork(updated);
          showToast('Tutoría confirmada con éxito. Se actualizó el registro de atención.', 'success');
          break;
      }
      setConfirmActionModal((prev) => ({ ...prev, open: false }));
    } catch (err: any) {
      showToast(err.message || 'Error al ejecutar la acción', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Renderizador de Badge de Estado
  const renderStatusBadge = (status: StudentWorkStatus) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="badge-status badge-pending_review d-inline-flex align-items-center gap-1">
            <FaClock size={14} />
            Pendiente de revisión
          </span>
        );
      case 'observed':
        return (
          <span className="badge-status badge-observed d-inline-flex align-items-center gap-1">
            <FaCircleExclamation size={14} />
            Con observaciones
          </span>
        );
      case 'approved':
        return (
          <span className="badge-status badge-approved d-inline-flex align-items-center gap-1">
            <FaCheck size={14} />
            Aprobada
          </span>
        );
      case 'disapproved':
        return (
          <span className="badge-status badge-disapproved d-inline-flex align-items-center gap-1">
            <FaXmark size={14} />
            Desaprobada
          </span>
        );
      case 'absent':
        return (
          <span className="badge-status badge-absent d-inline-flex align-items-center gap-1">
            <FaMinus size={14} />
            Ausente
          </span>
        );
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  // Función para previsualizar Google Docs
  const getGoogleDocsEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
      if (url.includes('/document/d/')) {
        const parts = url.split('/document/d/');
        if (parts[1]) {
          const docId = parts[1].split('/')[0];
          return `https://docs.google.com/document/d/${docId}/preview`;
        }
      }
    } catch { }
    return null;
  };

  // Helper para interpretar la calificación ingresada en el modal
  const qualificationHelper = useMemo(() => {
    const val = parseInt(qualificationInput, 10);
    if (isNaN(val)) return null;
    if (val === 0) return { label: 'Ausente', color: '#6b7280', status: 'absent' };
    if (val >= 1 && val <= 3) return { label: 'Desaprobada (1 a 3)', color: '#dc2626', status: 'disapproved' };
    if (val >= 4 && val <= 10) return { label: 'Aprobada (4 a 10)', color: '#16a34a', status: 'approved' };
    return { label: 'Fuera de rango (0 a 10)', color: '#e11d48', status: 'invalid' };
  }, [qualificationInput]);

  return (
    <div className="trabajo-page-container">
      <div className="trabajo-wrapper">
        {/* Barra superior con navegación */}
        <div className="trabajo-top-bar">
          <Link
            to={backDestination}
            state={backState}
            className="trabajo-back-btn d-inline-flex align-items-center gap-1.5"
          >
            <FaArrowLeft size={16} />
            {backLabel}
          </Link>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border">
              Proyecto #{projectId}
            </span>
          </div>
        </div>

        {/* Banner Informativo si es Proyecto PPP */}
        {(project?.categoria?.toUpperCase() === 'PPP' || project?.projectType?.name?.toUpperCase() === 'PPP') && (
          <div className="alert alert-info border-info d-flex align-items-center justify-content-between p-3 rounded-3 mb-4 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <span className="badge-project-type-ppp">PPP</span>
              <div>
                <strong className="d-block text-dark">Proyecto de Práctica Profesional Supervisada (PPP)</strong>
                <span className="small text-secondary">
                  Este proyecto se gestiona mediante el módulo de expedientes y convenios oficiales de PPP, diferenciado del esquema de entregas de TFI.
                </span>
              </div>
            </div>
            <Link to={`/ppp/${projectId}`} className="btn btn-sm btn-primary text-nowrap">
              Ir al Expediente PPP →
            </Link>
          </div>
        )}

        {/* Tarjeta 1: Información del Proyecto */}
        <div className="trabajo-card">
          <div className="trabajo-project-header">
            <div className="trabajo-project-badge-row">
              <span className="badge bg-secondary">
                {project?.categoria || project?.projectType?.name || 'General'}
              </span>
              <span className="badge bg-outline-secondary text-muted">
                {project?.estado ? `Estado: ${project.estado}` : 'Activo'}
              </span>
            </div>
            <h1 className="trabajo-project-title">
              {project?.titulo || project?.title || `Proyecto #${projectId}`}
            </h1>
            <p className="trabajo-project-desc">
              {project?.descripcion || project?.description || 'Sin descripción disponible.'}
            </p>
          </div>

          {/* Miembros del equipo */}
          <div className="trabajo-members-grid">
            <div className="trabajo-member-col">
              <h4>Alumnos Asignados</h4>
              {(() => {
                const assignedStudents = (project?.activeStudents && project.activeStudents.length > 0)
                  ? project.activeStudents.filter((as: any) => as && as.active !== false)
                  : project?.students || [];

                if (assignedStudents.length === 0) {
                  return <span className="text-muted small">Sin alumnos asignados</span>;
                }

                return (
                  <div className="trabajo-member-tags">
                    {assignedStudents.map((sid: any, idx: number) => (
                      <span key={idx} className="trabajo-member-pill">
                        👤 {resolveUserName(sid)}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="trabajo-member-col">
              <h4>Docentes Asignados</h4>
              {(() => {
                const teachers: any[] = [];
                const seen = new Set<string>();

                if (Array.isArray(project?.activeProfessors) && project.activeProfessors.length > 0) {
                  project.activeProfessors.forEach((ap: any) => {
                    if (ap && ap.active !== false) {
                      const id = String(ap.professor?.user?.id || ap.professor?.id_user || ap.id || '');
                      if (id && !seen.has(id)) {
                        seen.add(id);
                        teachers.push(ap);
                      } else if (!id) {
                        teachers.push(ap);
                      }
                    }
                  });
                }

                if (Array.isArray(project?.coTeachers) && project.coTeachers.length > 0) {
                  project.coTeachers.forEach((t: any) => {
                    const id = typeof t === 'object' ? String(t.id || t.id_user || '') : String(t);
                    if (id && !seen.has(id)) {
                      seen.add(id);
                      teachers.push(t);
                    } else if (!id) {
                      teachers.push(t);
                    }
                  });
                }

                const mainTeacher = (project as any)?.teacher || (project as any)?.tutor || project?.teacherId;
                if (mainTeacher) {
                  const id = typeof mainTeacher === 'object' ? String(mainTeacher.id || mainTeacher.id_user || '') : String(mainTeacher);
                  if (id && !seen.has(id)) {
                    seen.add(id);
                    teachers.push(mainTeacher);
                  } else if (!id && teachers.length === 0) {
                    teachers.push(mainTeacher);
                  }
                }

                if (teachers.length === 0) {
                  return <span className="text-muted small">Sin docentes asignados</span>;
                }

                return (
                  <div className="trabajo-member-tags">
                    {teachers.map((tid: any, idx: number) => (
                      <span key={idx} className="trabajo-member-pill">
                        🎓 {resolveUserName(tid)}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Detalle y Gestión de la Entrega (StudentWork) */}
        <div className="trabajo-card">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Cargando entrega...</span>
              </div>
              <p className="text-muted mt-2">Cargando estado del trabajo del estudiante...</p>
            </div>
          ) : !work ? (
            /* Estado vacío: Sin entrega registrada */
            <div className="trabajo-empty-state">
              <div className="trabajo-empty-icon">
                <FaFileLines size={32} />
              </div>
              <h3 className="trabajo-empty-title">Aún no hay entrega registrada para este proyecto</h3>
              <p className="trabajo-empty-desc">
                {isStudent || isAdmin
                  ? 'Podés registrar la entrega cargando el enlace oficial a Google Docs con el avance o documento final del proyecto.'
                  : 'Los estudiantes asignados aún no han realizado la entrega formal con el enlace a Google Docs.'}
              </p>

              {(isStudent || isAdmin) && (
                <button
                  type="button"
                  className="btn-trabajo-primary d-inline-flex align-items-center gap-1.5"
                  onClick={() => handleOpenLinksModal(false)}
                >
                  <FaPlus size={16} />
                  Registrar Entrega de Proyecto
                </button>
              )}
            </div>
          ) : (
            /* Entrega existente */
            <>
              {/* Encabezado del estado de la entrega */}
              <div className="trabajo-status-header">
                <div className="trabajo-status-title-group">
                  <h2 className="trabajo-section-title">Entrega de Trabajo</h2>
                  {renderStatusBadge(work.status)}
                </div>

                {work.qualification !== null && work.qualification !== undefined && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">Nota final:</span>
                    <span className="badge bg-dark fs-6 px-3 py-2">
                      {work.qualification} / 10
                    </span>
                  </div>
                )}
              </div>

              {/* Banner de Tutoría Solicitada */}
              {work.tutoringRequested && (
                <div className="trabajo-tutoring-banner">
                  <FaCircleInfo size={22} />
                  <div>
                    <strong>Tutoría Solicitada:</strong> El equipo del proyecto solicitó una sesión de tutoría docente para revisar avances o despejar inquietudes.
                  </div>
                </div>
              )}

              {/* Tarjeta de Calificación destacada si existe */}
              {work.qualification !== null && work.qualification !== undefined && (
                <div className="trabajo-qualification-card">
                  <div>
                    <span className="text-muted small text-uppercase fw-bold">Calificación Registrada</span>
                    <div className="qualification-score-display">
                      {work.qualification} <span style={{ fontSize: '18px', color: '#6b7280' }}>/ 10</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="qualification-status-text">
                      {work.qualification === 0
                        ? 'Estado: Ausente'
                        : work.qualification >= 4
                          ? 'Estado: Aprobado'
                          : 'Estado: Desaprobado'}
                    </div>
                    {work.lastReviewedAt && (
                      <span className="text-muted small">
                        Revisado el {new Date(work.lastReviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Grid de Enlaces a Google Docs y Google Drive */}
              <div className="trabajo-links-grid">
                {/* Enlace Google Docs */}
                <div className="trabajo-link-box">
                  <div className="trabajo-link-box-header">
                    <div className="trabajo-link-icon docs">
                      <FaFileLines size={20} />
                    </div>
                    <div>
                      <h4 className="trabajo-link-title">Documento de Entrega (Google Docs)</h4>
                      <span className="trabajo-link-sub">Enlace obligatorio a la documentación oficial</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <a
                      href={work.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="trabajo-link-action-btn flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1.5"
                    >
                      <FaArrowUpRightFromSquare size={14} />
                      Abrir en Google Docs
                    </a>
                  </div>
                </div>

                {/* Enlace Google Drive */}
                <div className="trabajo-link-box">
                  <div className="trabajo-link-box-header">
                    <div className="trabajo-link-icon drive">
                      <FaFolderOpen size={20} />
                    </div>
                    <div>
                      <h4 className="trabajo-link-title">Carpeta de Archivos (Google Drive)</h4>
                      <span className="trabajo-link-sub">Carpeta de anexos y recursos adicionales</span>
                    </div>
                  </div>
                  {work.driveFolderUrl ? (
                    <a
                      href={work.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="trabajo-link-action-btn d-inline-flex align-items-center justify-content-center gap-1.5"
                    >
                      <FaArrowUpRightFromSquare size={14} />
                      Abrir Carpeta en Drive
                    </a>
                  ) : (
                    <span className="text-muted small py-2">No se adjuntó carpeta de Google Drive</span>
                  )}
                </div>
              </div>

              {/* Previsualización incrustada de Google Docs si está disponible */}
              {getGoogleDocsEmbedUrl(work.documentUrl) && (
                <div className="trabajo-preview-container">
                  <div className="trabajo-preview-header">
                    <h4>Vista previa de Google Docs</h4>
                    <a
                      href={work.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Pantalla completa ↗
                    </a>
                  </div>
                  <iframe
                    src={getGoogleDocsEmbedUrl(work.documentUrl)!}
                    title="Vista previa del documento de entrega"
                    className="trabajo-iframe"
                    allow="autoplay"
                  />
                </div>
              )}

              {/* Auditoría y Fechas */}
              <div className="trabajo-audit-section mt-4">
                <div className="trabajo-audit-item">
                  <span className="trabajo-audit-label">Fecha de entrega:</span>
                  <span>{work.createdAt ? new Date(work.createdAt).toLocaleString() : 'No registrada'}</span>
                </div>
                <div className="trabajo-audit-item">
                  <span className="trabajo-audit-label">Última actualización:</span>
                  <span>{work.updatedAt ? new Date(work.updatedAt).toLocaleString() : 'No registrada'}</span>
                </div>
                <div className="trabajo-audit-item">
                  <span className="trabajo-audit-label">Última revisión docente:</span>
                  <span>
                    {work.lastReviewedAt
                      ? `${new Date(work.lastReviewedAt).toLocaleString()}${work.lastReviewedBy ? ` (${typeof work.lastReviewedBy === 'object' ? work.lastReviewedBy.email || work.lastReviewedBy.name : work.lastReviewedBy})` : ''
                      }`
                      : 'Sin revisiones registradas'}
                  </span>
                </div>
                <div className="trabajo-audit-item">
                  <span className="trabajo-audit-label">Última tutoría registrada:</span>
                  <span>
                    {work.lastTutoredAt
                      ? `${new Date(work.lastTutoredAt).toLocaleString()}${work.lastTutoredBy ? ` (${typeof work.lastTutoredBy === 'object' ? work.lastTutoredBy.email || work.lastTutoredBy.name : work.lastTutoredBy})` : ''
                      }`
                      : 'Sin tutorías registradas'}
                  </span>
                </div>
              </div>

              {/* Barra de Acciones según Roles */}
              <div className="trabajo-actions-toolbar">
                {/* ACCIONES PARA PROFESOR / ADMIN */}
                {(isTeacher || isAdmin) && (
                  <>
                    {/* Calificar Entrega (Solo evaluador / admin) */}
                    <button
                      type="button"
                      className="btn-trabajo-primary d-inline-flex align-items-center gap-1.5"
                      onClick={handleOpenQualifyModal}
                      disabled={actionLoading}
                    >
                      <FaStar size={16} />
                      Calificar Entrega
                    </button>

                    {/* Marcar como Observada */}
                    <button
                      type="button"
                      className="btn-trabajo-warning d-inline-flex align-items-center gap-1.5"
                      onClick={() =>
                        setConfirmActionModal({
                          open: true,
                          title: 'Marcar Entrega con Observaciones',
                          message:
                            '¿Deseas marcar esta entrega con observaciones? El estado cambiará a "Con observaciones" para que los estudiantes corrijan y notifiquen sus avances.',
                          confirmText: 'Confirmar Observaciones',
                          actionType: 'mark_observed',
                        })
                      }
                      disabled={actionLoading}
                    >
                      <FaCircleExclamation size={16} />
                      Marcar con Observaciones
                    </button>

                    {/* Confirmar Tutoría (Tutor / admin) */}
                    <button
                      type="button"
                      className="btn-trabajo-info d-inline-flex align-items-center gap-1.5"
                      onClick={() =>
                        setConfirmActionModal({
                          open: true,
                          title: 'Confirmar Tutoría',
                          message:
                            '¿Confirmás que se llevó a cabo una sesión de tutoría con el equipo de este proyecto? Se registrará tu atención con la fecha actual y se quitará la solicitud de tutoría pendiente.',
                          confirmText: 'Confirmar tutoría',
                          actionType: 'mark_tutored',
                        })
                      }
                      disabled={actionLoading || !work.tutoringRequested}
                      title={
                        !work.tutoringRequested
                          ? 'No hay una solicitud de tutoría pendiente de los estudiantes'
                          : 'Confirmar atención de la tutoría solicitada'
                      }
                    >
                      <FaGraduationCap size={16} />
                      Confirmar tutoría
                    </button>
                  </>
                )}

                {/* ACCIONES PARA ESTUDIANTE / ADMIN */}
                {(isStudent || isAdmin) && (
                  <>
                    {/* Modificar Enlaces */}
                    <button
                      type="button"
                      className="btn-trabajo-secondary d-inline-flex align-items-center gap-1.5"
                      onClick={() => handleOpenLinksModal(true)}
                      disabled={actionLoading}
                    >
                      <FaPencil size={16} />
                      Modificar Enlaces
                    </button>

                    {/* Notificar Avances (vuelve a pending_review) */}
                    <button
                      type="button"
                      className="btn-trabajo-primary d-inline-flex align-items-center gap-1.5"
                      onClick={() =>
                        setConfirmActionModal({
                          open: true,
                          title: 'Notificar Avances al Docente',
                          message:
                            '¿Confirmas que actualizaste el documento con las correcciones requeridas? El estado volverá a "Pendiente de revisión" para que el docente pueda evaluarlo.',
                          confirmText: 'Notificar Avances',
                          actionType: 'notify_advances',
                        })
                      }
                      disabled={actionLoading}
                    >
                      <FaPaperPlane size={16} />
                      Notificar Avances
                    </button>

                    {/* Solicitar Tutoría */}
                    {!work.tutoringRequested && (
                      <button
                        type="button"
                        className="btn-trabajo-info d-inline-flex align-items-center gap-1.5"
                        onClick={() =>
                          setConfirmActionModal({
                            open: true,
                            title: 'Solicitar Tutoría Docente',
                            message:
                              '¿Deseas solicitar una tutoría docente para recibir acompañamiento en el avance de este proyecto?',
                            confirmText: 'Solicitar Tutoría',
                            actionType: 'request_tutoring',
                          })
                        }
                        disabled={actionLoading}
                      >
                        <FaChalkboardUser size={16} />
                        Solicitar Tutoría
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL 1: Calificar Entrega */}
      {showQualifyModal && (
        <div className="trabajo-modal-backdrop">
          <div className="trabajo-modal-content">
            <div className="trabajo-modal-header">
              <h3>Calificar Entrega</h3>
              <button
                type="button"
                className="trabajo-modal-close"
                onClick={() => setShowQualifyModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveQualification}>
              <div className="trabajo-modal-body">
                <div className="mb-3">
                  <label htmlFor="qualificationInput" className="form-label fw-semibold">
                    Nota Final (0 a 10)
                  </label>
                  <input
                    id="qualificationInput"
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    className="form-control form-control-lg"
                    placeholder="Ej. 8"
                    value={qualificationInput}
                    onChange={(e) => setQualificationInput(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="form-text mt-2">
                    Escala académica:
                    <ul className="mb-0 ps-3 mt-1 small">
                      <li><strong>0:</strong> Ausente</li>
                      <li><strong>1 a 3:</strong> Desaprobada</li>
                      <li><strong>4 a 10:</strong> Aprobada</li>
                    </ul>
                  </div>
                </div>

                {/* Previsualización del estado según la nota */}
                {qualificationHelper && (
                  <div
                    className="p-3 rounded border text-center fw-bold"
                    style={{
                      backgroundColor: `${qualificationHelper.color}15`,
                      color: qualificationHelper.color,
                      borderColor: `${qualificationHelper.color}40`,
                    }}
                  >
                    Resultado: {qualificationHelper.label}
                  </div>
                )}
              </div>
              <div className="trabajo-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQualifyModal(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-trabajo-primary"
                  disabled={actionLoading || !qualificationHelper || qualificationHelper.status === 'invalid'}
                >
                  {actionLoading ? 'Guardando...' : 'Asignar Calificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Registrar / Modificar Enlaces */}
      {showLinksModal && (
        <div className="trabajo-modal-backdrop">
          <div className="trabajo-modal-content">
            <div className="trabajo-modal-header">
              <h3>{isEditingLinks ? 'Modificar Enlaces de Entrega' : 'Registrar Entrega de Proyecto'}</h3>
              <button
                type="button"
                className="trabajo-modal-close"
                onClick={() => setShowLinksModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveLinks}>
              <div className="trabajo-modal-body">
                {/* Enlace Google Docs */}
                <div className="mb-3">
                  <label htmlFor="docUrlInput" className="form-label fw-semibold">
                    Enlace a Google Docs <span className="text-danger">*</span>
                  </label>
                  <input
                    id="docUrlInput"
                    type="url"
                    className={`form-control ${urlErrors.doc ? 'is-invalid' : ''}`}
                    placeholder="https://docs.google.com/document/d/..."
                    value={docUrlInput}
                    onChange={(e) => {
                      setDocUrlInput(e.target.value);
                      if (urlErrors.doc) setUrlErrors((prev) => ({ ...prev, doc: undefined }));
                    }}
                    required
                  />
                  {urlErrors.doc ? (
                    <div className="invalid-feedback">{urlErrors.doc}</div>
                  ) : (
                    <div className="form-text">
                      El documento debe ser accesible para lectura por parte del equipo docente.
                    </div>
                  )}
                </div>

                {/* Enlace Google Drive */}
                <div className="mb-3">
                  <label htmlFor="driveUrlInput" className="form-label fw-semibold">
                    Carpeta de Google Drive (Opcional)
                  </label>
                  <input
                    id="driveUrlInput"
                    type="url"
                    className={`form-control ${urlErrors.drive ? 'is-invalid' : ''}`}
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveUrlInput}
                    onChange={(e) => {
                      setDriveUrlInput(e.target.value);
                      if (urlErrors.drive) setUrlErrors((prev) => ({ ...prev, drive: undefined }));
                    }}
                  />
                  {urlErrors.drive ? (
                    <div className="invalid-feedback">{urlErrors.drive}</div>
                  ) : (
                    <div className="form-text">
                      Opcional: podés incluir una carpeta con anexos, presentaciones o código fuente.
                    </div>
                  )}
                </div>
              </div>
              <div className="trabajo-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLinksModal(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-trabajo-primary" disabled={actionLoading}>
                  {actionLoading ? 'Guardando...' : isEditingLinks ? 'Actualizar Enlaces' : 'Registrar Entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirmaciones Generales */}
      {confirmActionModal.open && (
        <div className="trabajo-modal-backdrop">
          <div className="trabajo-modal-content">
            <div className="trabajo-modal-header">
              <h3>{confirmActionModal.title}</h3>
              <button
                type="button"
                className="trabajo-modal-close"
                onClick={() => setConfirmActionModal((prev) => ({ ...prev, open: false }))}
              >
                ×
              </button>
            </div>
            <div className="trabajo-modal-body">
              <p className="mb-0 text-secondary" style={{ fontSize: '15px', lineHeight: '1.5' }}>
                {confirmActionModal.message}
              </p>
            </div>
            <div className="trabajo-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmActionModal((prev) => ({ ...prev, open: false }))}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-trabajo-primary"
                onClick={handleConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Procesando...' : confirmActionModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trabajo;

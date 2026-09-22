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
  FaChevronRight,
  FaCalendarDays,
  FaUser,
  FaBell,
  FaExpand,
  FaDownload,
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

  // Estados de navegación visual y controles de documento (Mockup)
  const [activeTab, setActiveTab] = useState<'documento' | 'informacion' | 'historial'>('documento');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

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
    return rawRoles.map((roleItem: any) => String(roleItem).toUpperCase().trim());
  }, [currentUser]);

  const isAdmin = useMemo(() => roles.includes('ADMIN') || roles.includes('ADMINISTRADOR'), [roles]);
  const isTeacher = useMemo(
    () => roles.some((roleName: string) => ['DOCENTE', 'TEACHER', 'PROFESSOR'].includes(roleName)),
    [roles]
  );
  const isStudent = useMemo(
    () => roles.some((roleName: string) => ['ESTUDIANTE', 'STUDENT', 'ALUMNO'].includes(roleName)),
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
        const targetUserObj =
          userIdOrObj.student?.user ||
          userIdOrObj.professor?.user ||
          userIdOrObj.user ||
          userIdOrObj.student ||
          userIdOrObj.professor ||
          userIdOrObj;
        const fullName = [targetUserObj.firstName || targetUserObj.nombre, targetUserObj.lastName || targetUserObj.apellido].filter(Boolean).join(' ').trim();
        if (fullName) return fullName;
        if (targetUserObj.name) return targetUserObj.name;
        if (targetUserObj.email) return targetUserObj.email;
        userIdOrObj = targetUserObj.id || targetUserObj.id_user || userIdOrObj.id || userIdOrObj.id_user;
      }
      const idString = String(userIdOrObj);
      const userFound = users.find((userCandidate) => String(userCandidate.id) === idString || String(userCandidate.id_user) === idString);
      if (userFound) {
        return [userFound.nombre, userFound.apellido].filter(Boolean).join(' ') || userFound.email || `Usuario #${idString}`;
      }
      return `Usuario #${idString}`;
    },
    [users]
  );

  // Cargar datos del proyecto y su StudentWork
  const loadProjectAndWork = useCallback(async () => {
    if (!projectId || !token) return;
    setLoading(true);
    try {
      // 1. Obtener Proyecto
      let currentProj = reduxProjects.find((projectCandidate) => String(projectCandidate.id) === String(projectId));
      if (!currentProj) {
        try {
          currentProj = await projectService.getProjectById(projectId, token);
        } catch (fetchError: any) {
          console.warn('No se pudo cargar proyecto por ID directo:', fetchError);
        }
      }
      setProject(currentProj || null);

      // 2. Obtener StudentWork
      const workData = await studentWorkService.getWorkByProject(projectId, token);
      setWork(workData);
    } catch (loadError: any) {
      console.error('Error al cargar datos del trabajo:', loadError);
      showToast(loadError.message || 'Error al cargar los datos del proyecto y su entrega', 'error');
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
  const handleSaveLinks = async (formSubmitEvent: React.FormEvent) => {
    formSubmitEvent.preventDefault();
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
    } catch (saveError: any) {
      showToast(saveError.message || 'Error al guardar la entrega', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Calificar entrega
  const handleOpenQualifyModal = () => {
    setQualificationInput(work?.qualification !== null && work?.qualification !== undefined ? String(work.qualification) : '');
    setShowQualifyModal(true);
  };

  const handleSaveQualification = async (formSubmitEvent: React.FormEvent) => {
    formSubmitEvent.preventDefault();
    if (!work?.id || !token) return;

    const parsedScore = parseInt(qualificationInput, 10);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
      showToast('La calificación debe ser un número entero entre 0 y 10.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await studentWorkService.qualify(work.id, parsedScore, token);
      setWork(updated);
      showToast(`Calificación ${parsedScore} registrada correctamente`, 'success');
      setShowQualifyModal(false);
    } catch (qualifyError: any) {
      showToast(qualifyError.message || 'Error al calificar la entrega', 'error');
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
      setConfirmActionModal((previousState) => ({ ...previousState, open: false }));
    } catch (actionError: any) {
      showToast(actionError.message || 'Error al ejecutar la acción', 'error');
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
    const parsedScoreValue = parseInt(qualificationInput, 10);
    if (isNaN(parsedScoreValue)) return null;
    if (parsedScoreValue === 0) return { label: 'Ausente', color: '#6b7280', status: 'absent' };
    if (parsedScoreValue >= 1 && parsedScoreValue <= 3) return { label: 'Desaprobada (1 a 3)', color: '#dc2626', status: 'disapproved' };
    if (parsedScoreValue >= 4 && parsedScoreValue <= 10) return { label: 'Aprobada (4 a 10)', color: '#16a34a', status: 'approved' };
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
        <div id="project-info-card" className="trabajo-card">
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
                  ? project.activeStudents.filter((studentItem: any) => studentItem && studentItem.active !== false)
                  : project?.students || [];

                if (assignedStudents.length === 0) {
                  return <span className="text-muted small">Sin alumnos asignados</span>;
                }

                return (
                  <div className="trabajo-member-tags">
                    {assignedStudents.map((studentItem: any, studentIndex: number) => (
                      <span key={studentIndex} className="trabajo-member-pill">
                        👤 {resolveUserName(studentItem)}
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
                const seenTeacherIds = new Set<string>();

                if (Array.isArray(project?.activeProfessors) && project.activeProfessors.length > 0) {
                  project.activeProfessors.forEach((activeProfItem: any) => {
                    if (activeProfItem && activeProfItem.active !== false) {
                      const idString = String(activeProfItem.professor?.user?.id || activeProfItem.professor?.id_user || activeProfItem.id || '');
                      if (idString && !seenTeacherIds.has(idString)) {
                        seenTeacherIds.add(idString);
                        teachers.push(activeProfItem);
                      } else if (!idString) {
                        teachers.push(activeProfItem);
                      }
                    }
                  });
                }

                if (Array.isArray(project?.coTeachers) && project.coTeachers.length > 0) {
                  project.coTeachers.forEach((teacherItem: any) => {
                    const idString = typeof teacherItem === 'object' ? String(teacherItem.id || teacherItem.id_user || '') : String(teacherItem);
                    if (idString && !seenTeacherIds.has(idString)) {
                      seenTeacherIds.add(idString);
                      teachers.push(teacherItem);
                    } else if (!idString) {
                      teachers.push(teacherItem);
                    }
                  });
                }

                const mainTeacher = (project as any)?.teacher || (project as any)?.tutor || project?.teacherId;
                if (mainTeacher) {
                  const idString = typeof mainTeacher === 'object' ? String(mainTeacher.id || mainTeacher.id_user || '') : String(mainTeacher);
                  if (idString && !seenTeacherIds.has(idString)) {
                    seenTeacherIds.add(idString);
                    teachers.push(mainTeacher);
                  } else if (!idString && teachers.length === 0) {
                    teachers.push(mainTeacher);
                  }
                }

                if (teachers.length === 0) {
                  return <span className="text-muted small">Sin docentes asignados</span>;
                }

                return (
                  <div className="trabajo-member-tags">
                    {teachers.map((teacherItem: any, teacherIndex: number) => (
                      <span key={teacherIndex} className="trabajo-member-pill">
                        🎓 {resolveUserName(teacherItem)}
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

              {/* Barra de Pestañas Superior y Enlace Rápido a Google Docs (Mockup) */}
              <div className="trabajo-delivery-tabs-bar">
                <div className="trabajo-nav-tabs">
                  <button
                    type="button"
                    className={`trabajo-tab-btn ${activeTab === 'documento' ? 'active' : ''}`}
                    onClick={() => setActiveTab('documento')}
                  >
                    <FaFileLines size={14} />
                    Documento
                  </button>
                  <button
                    type="button"
                    className={`trabajo-tab-btn ${activeTab === 'informacion' ? 'active' : ''}`}
                    onClick={() => setActiveTab('informacion')}
                  >
                    <FaCircleInfo size={14} />
                    Información
                  </button>
                  <button
                    type="button"
                    className={`trabajo-tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
                    onClick={() => setActiveTab('historial')}
                  >
                    <FaClock size={14} />
                    Historial de versiones
                  </button>
                </div>
                {work.documentUrl && (
                  <a
                    href={work.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="trabajo-open-docs-btn"
                  >
                    Abrir en Google Docs ↗
                  </a>
                )}
              </div>

              {/* Layout en 2 Columnas: Principal (Visor + Auditoría) y Lateral (Acciones) */}
              <div className="trabajo-delivery-grid">
                {/* Columna Principal */}
                <div className="trabajo-main-column">
                  {activeTab === 'informacion' ? (
                    /* Pestaña Información: Enlaces y detalles de archivos */
                    <div className="trabajo-links-grid mb-0">
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
                  ) : activeTab === 'historial' ? (
                    /* Pestaña Historial de Versiones y Auditoría */
                    <div className="p-4 bg-light rounded-3 border">
                      <h4 className="fs-6 fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                        <FaClock size={16} /> Registro de Actividad y Versiones
                      </h4>
                      <div className="d-flex flex-column gap-3 small text-secondary">
                        <div className="d-flex justify-content-between border-bottom pb-2">
                          <span>Fecha inicial de registro:</span>
                          <strong className="text-dark">
                            {work.createdAt ? new Date(work.createdAt).toLocaleString() : 'No registrada'}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2">
                          <span>Última modificación de enlaces:</span>
                          <strong className="text-dark">
                            {work.updatedAt ? new Date(work.updatedAt).toLocaleString() : 'No registrada'}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2">
                          <span>Última intervención docente:</span>
                          <strong className="text-dark">
                            {work.lastReviewedAt
                              ? `${new Date(work.lastReviewedAt).toLocaleString()}${work.lastReviewedBy ? ` (${resolveUserName(work.lastReviewedBy)})` : ''}`
                              : 'Sin revisiones registradas'}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Última tutoría docente:</span>
                          <strong className="text-dark">
                            {work.lastTutoredAt
                              ? `${new Date(work.lastTutoredAt).toLocaleString()}${work.lastTutoredBy ? ` (${resolveUserName(work.lastTutoredBy)})` : ''}`
                              : 'Sin tutorías registradas'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Pestaña Documento: Visor incrustado estilo Mockup */
                    <div className="trabajo-preview-container mt-0">
                      <div className="trabajo-doc-topbar">
                        <div className="trabajo-doc-title-group">
                          <div className="trabajo-doc-file-icon">
                            <FaFileLines size={14} />
                          </div>
                          <span className="trabajo-doc-filename">
                            Documento de Entrega - {project?.titulo || project?.title || 'Proyecto TFI'}.docx
                          </span>
                          <span className="trabajo-doc-badge">Google Docs</span>
                        </div>

                        <div className="trabajo-doc-controls">
                          <span className="trabajo-doc-page-badge">1 / 5</span>
                          <div className="trabajo-doc-zoom-pill">
                            <button
                              type="button"
                              className="trabajo-doc-icon-btn"
                              onClick={() => setZoomLevel((currentZoom) => Math.max(50, currentZoom - 10))}
                              title="Reducir zoom"
                            >
                              -
                            </button>
                            <span>{zoomLevel}%</span>
                            <button
                              type="button"
                              className="trabajo-doc-icon-btn"
                              onClick={() => setZoomLevel((currentZoom) => Math.min(150, currentZoom + 10))}
                              title="Aumentar zoom"
                            >
                              +
                            </button>
                          </div>
                          <a
                            href={work.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="trabajo-doc-icon-btn"
                            title="Pantalla completa"
                          >
                            <FaExpand size={13} />
                          </a>
                          <a
                            href={work.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="trabajo-doc-icon-btn"
                            title="Abrir / Descargar"
                          >
                            <FaDownload size={13} />
                          </a>
                        </div>
                      </div>

                      {getGoogleDocsEmbedUrl(work.documentUrl) ? (
                        <iframe
                          src={getGoogleDocsEmbedUrl(work.documentUrl)!}
                          title="Vista previa del documento de entrega"
                          className="trabajo-iframe"
                          allow="autoplay"
                        />
                      ) : (
                        <div className="p-4 text-center text-muted">
                          <p className="mb-2">La previsualización interactiva no está disponible para esta URL.</p>
                          <a
                            href={work.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-danger"
                          >
                            Abrir directamente en Google Docs ↗
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fila de 4 Tarjetas de Auditoría inferiores (Mockup) */}
                  <div className="trabajo-audit-grid">
                    <div className="trabajo-audit-card">
                      <div className="trabajo-audit-icon-box">
                        <FaCalendarDays size={18} />
                      </div>
                      <div className="trabajo-audit-card-content">
                        <span className="trabajo-audit-card-label">Fecha de entrega</span>
                        <span className="trabajo-audit-card-val">
                          {work.createdAt ? new Date(work.createdAt).toLocaleDateString() : 'No registrada'}
                        </span>
                        <span className="trabajo-audit-card-sub">
                          {work.createdAt
                            ? new Date(work.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : ''}
                        </span>
                      </div>
                    </div>

                    <div className="trabajo-audit-card">
                      <div className="trabajo-audit-icon-box">
                        <FaClock size={18} />
                      </div>
                      <div className="trabajo-audit-card-content">
                        <span className="trabajo-audit-card-label">Última actualización</span>
                        <span className="trabajo-audit-card-val">
                          {work.updatedAt ? new Date(work.updatedAt).toLocaleDateString() : 'No registrada'}
                        </span>
                        <span className="trabajo-audit-card-sub">
                          {work.updatedAt
                            ? new Date(work.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : ''}
                        </span>
                      </div>
                    </div>

                    <div className="trabajo-audit-card">
                      <div className="trabajo-audit-icon-box">
                        <FaUser size={18} />
                      </div>
                      <div className="trabajo-audit-card-content">
                        <span className="trabajo-audit-card-label">Última revisión docente</span>
                        <span className="trabajo-audit-card-val">
                          {work.lastReviewedBy ? resolveUserName(work.lastReviewedBy) : 'Sin revisiones'}
                        </span>
                        <span className="trabajo-audit-card-sub">
                          {work.lastReviewedAt
                            ? new Date(work.lastReviewedAt).toLocaleDateString()
                            : 'Pendiente de calificación'}
                        </span>
                      </div>
                    </div>

                    <div className="trabajo-audit-card">
                      <div className="trabajo-audit-icon-box">
                        <FaGraduationCap size={18} />
                      </div>
                      <div className="trabajo-audit-card-content">
                        <span className="trabajo-audit-card-label">Última tutoría</span>
                        <span className="trabajo-audit-card-val">
                          {work.lastTutoredBy ? resolveUserName(work.lastTutoredBy) : 'Sin tutorías'}
                        </span>
                        <span className="trabajo-audit-card-sub">
                          {work.lastTutoredAt
                            ? new Date(work.lastTutoredAt).toLocaleDateString()
                            : work.tutoringRequested
                              ? 'Tutoría solicitada'
                              : 'No agendada'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Lateral: Panel de Acciones (Mockup) */}
                <div className="trabajo-sidebar-column">
                  <div className="trabajo-actions-sidebar">
                    <div className="trabajo-actions-sidebar-header">
                      <div className="trabajo-actions-title-row">
                        <span className="trabajo-red-dot">●</span>
                        <h3 className="trabajo-actions-title">Acciones</h3>
                      </div>
                    </div>

                    <div className="trabajo-action-cards-list">
                      {/* Marcar con Observaciones (Docente evaluador / Admin) */}
                      {(isTeacher || isAdmin) && (
                        <button
                          type="button"
                          className="trabajo-action-card"
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
                          <div className="trabajo-action-icon-circle purple">
                            <FaPencil size={15} />
                          </div>
                          <div className="trabajo-action-card-text">
                            <div className="trabajo-action-card-title">Marcar con observaciones</div>
                            <div className="trabajo-action-card-desc">
                              Agregar comentarios y notas detalladas para el estudiante.
                            </div>
                          </div>
                          <FaChevronRight className="trabajo-action-chevron" />
                        </button>
                      )}

                      {/* Aprobar Entrega (Docente evaluador / Admin) */}
                      {(isTeacher || isAdmin) && (
                        <button
                          type="button"
                          className="trabajo-action-card approve"
                          onClick={() => {
                            setQualificationInput(
                              work.qualification !== null && work.qualification !== undefined && work.qualification >= 4
                                ? String(work.qualification)
                                : '7'
                            );
                            setShowQualifyModal(true);
                          }}
                          disabled={actionLoading}
                        >
                          <div className="trabajo-action-icon-circle green">
                            <FaCheck size={16} />
                          </div>
                          <div className="trabajo-action-card-text">
                            <div className="trabajo-action-card-title">Aprobar entrega</div>
                            <div className="trabajo-action-card-desc">
                              La entrega será marcada como aprobada y el estado se actualizará.
                            </div>
                          </div>
                          <FaChevronRight className="trabajo-action-chevron" />
                        </button>
                      )}

                      {/* Rechazar / Desaprobar (Docente evaluador / Admin) */}
                      {(isTeacher || isAdmin) && (
                        <button
                          type="button"
                          className="trabajo-action-card disapprove"
                          onClick={() => {
                            setQualificationInput(
                              work.qualification !== null && work.qualification !== undefined && work.qualification > 0 && work.qualification <= 3
                                ? String(work.qualification)
                                : '2'
                            );
                            setShowQualifyModal(true);
                          }}
                          disabled={actionLoading}
                        >
                          <div className="trabajo-action-icon-circle red">
                            <FaXmark size={16} />
                          </div>
                          <div className="trabajo-action-card-text">
                            <div className="trabajo-action-card-title">Rechazar / Desaprobar</div>
                            <div className="trabajo-action-card-desc">
                              La entrega será desaprobada y el estudiante notificado.
                            </div>
                          </div>
                          <FaChevronRight className="trabajo-action-chevron" />
                        </button>
                      )}

                      {/* Notificar Avances */}
                      <button
                        type="button"
                        className="trabajo-action-card"
                        onClick={() =>
                          setConfirmActionModal({
                            open: true,
                            title: isStudent ? 'Notificar Avances al Docente' : 'Notificar Novedades del Proyecto',
                            message: isStudent
                              ? '¿Confirmas que actualizaste el documento con las correcciones requeridas? El estado volverá a "Pendiente de revisión" para que el docente pueda evaluarlo.'
                              : '¿Deseas enviar una notificación al equipo del proyecto informando sobre el estado actual de la revisión?',
                            confirmText: 'Notificar avances',
                            actionType: 'notify_advances',
                          })
                        }
                        disabled={actionLoading}
                      >
                        <div className="trabajo-action-icon-circle slate">
                          <FaBell size={16} />
                        </div>
                        <div className="trabajo-action-card-text">
                          <div className="trabajo-action-card-title">Notificar avances</div>
                          <div className="trabajo-action-card-desc">
                            Informar al estudiante o equipo sobre el estado de la revisión.
                          </div>
                        </div>
                        <FaChevronRight className="trabajo-action-chevron" />
                      </button>

                      {/* Confirmar Tutoría (Tutor o Admin si fue solicitada) */}
                      {(isTeacher || isAdmin) && work.tutoringRequested && (
                        <button
                          type="button"
                          className="trabajo-action-card"
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
                          disabled={actionLoading}
                        >
                          <div className="trabajo-action-icon-circle sky">
                            <FaGraduationCap size={16} />
                          </div>
                          <div className="trabajo-action-card-text">
                            <div className="trabajo-action-card-title">Confirmar tutoría</div>
                            <div className="trabajo-action-card-desc">
                              Registrar la atención de la tutoría solicitada.
                            </div>
                          </div>
                          <FaChevronRight className="trabajo-action-chevron" />
                        </button>
                      )}

                      {/* Modificar Enlaces (Estudiante / Admin) */}
                      {(isStudent || isAdmin) && (
                        <button
                          type="button"
                          className="trabajo-action-card"
                          onClick={() => handleOpenLinksModal(true)}
                          disabled={actionLoading}
                        >
                          <div className="trabajo-action-icon-circle slate">
                            <FaPencil size={15} />
                          </div>
                          <div className="trabajo-action-card-text">
                            <div className="trabajo-action-card-title">Modificar Enlaces</div>
                            <div className="trabajo-action-card-desc">
                              Editar enlaces a Google Docs o carpeta Google Drive.
                            </div>
                          </div>
                          <FaChevronRight className="trabajo-action-chevron" />
                        </button>
                      )}

                      {/* Solicitar Tutoría (Estudiante / Admin si no hay tutoría pendiente) */}
                      {(isStudent || isAdmin) && !work.tutoringRequested && (
                        <button
                          type="button"
                          className="trabajo-action-card"
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
                          <div className="trabajo-action-icon-circle sky">
                            <FaChalkboardUser size={16} />
                          </div>
                          <div className="trabajo-action-card-text">
                            <div className="trabajo-action-card-title">Solicitar Tutoría</div>
                            <div className="trabajo-action-card-desc">
                              Pedir acompañamiento docente en el proyecto.
                            </div>
                          </div>
                          <FaChevronRight className="trabajo-action-chevron" />
                        </button>
                      )}
                    </div>

                    {/* Regla de Evaluación Institucional (Mockup) */}
                    <div className="trabajo-eval-rules-box">
                      <div className="trabajo-eval-rules-header">
                        <FaCircleInfo size={14} />
                        <span>Regla de evaluación institucional:</span>
                      </div>
                      <p className="trabajo-eval-rules-sub">
                        El estado de la calificación se asigna según la escala definida:
                      </p>
                      <div className="trabajo-eval-badges">
                        <span className="eval-badge absent">0 = ausente</span>
                        <span className="eval-badge disapproved">1-3 = desaprobada</span>
                        <span className="eval-badge approved">4+ = aprobada</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                    onChange={(changeEvent) => setQualificationInput(changeEvent.target.value)}
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
                    onChange={(changeEvent) => {
                      setDocUrlInput(changeEvent.target.value);
                      if (urlErrors.doc) setUrlErrors((previousErrors) => ({ ...previousErrors, doc: undefined }));
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
                    onChange={(changeEvent) => {
                      setDriveUrlInput(changeEvent.target.value);
                      if (urlErrors.drive) setUrlErrors((previousErrors) => ({ ...previousErrors, drive: undefined }));
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
                onClick={() => setConfirmActionModal((previousState) => ({ ...previousState, open: false }))}
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
                onClick={() => setConfirmActionModal((previousState) => ({ ...previousState, open: false }))}
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

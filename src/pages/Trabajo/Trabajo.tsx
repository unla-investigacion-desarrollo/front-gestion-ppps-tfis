import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import './Trabajo.css';

/**
 * Pantalla Trabajo:
 * Visualización y gestión de la entrega de avances/final (StudentWork) asociada a un proyecto.
 */
const Trabajo: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

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

  // Función para obtener nombres de usuario
  const resolveUserName = useCallback(
    (userId: string | number | undefined | null) => {
      if (!userId) return 'Desconocido';
      const userFound = users.find((u) => String(u.id) === String(userId) || String(u.id_user) === String(userId));
      if (userFound) {
        return [userFound.nombre, userFound.apellido].filter(Boolean).join(' ') || userFound.email || `Usuario #${userId}`;
      }
      return `Usuario #${userId}`;
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
          showToast('Se registró la tutoría realizada correctamente', 'success');
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
          <span className="badge-status badge-pending_review">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
            </svg>
            Pendiente de revisión
          </span>
        );
      case 'observed':
        return (
          <span className="badge-status badge-observed">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.005 3.1a1 1 0 1 1 1.99 0l-.388 6.35a.61.61 0 0 1-1.214 0L7.005 3.1zM8 12a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
            </svg>
            Con observaciones
          </span>
        );
      case 'approved':
        return (
          <span className="badge-status badge-approved">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z" />
            </svg>
            Aprobada
          </span>
        );
      case 'disapproved':
        return (
          <span className="badge-status badge-disapproved">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
            Desaprobada
          </span>
        );
      case 'absent':
        return (
          <span className="badge-status badge-absent">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
            </svg>
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
          <Link to="/docente/proyectos" className="trabajo-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
            </svg>
            Volver a Proyectos
          </Link>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border">
              Proyecto #{projectId}
            </span>
          </div>
        </div>

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
              {(!project?.students || project.students.length === 0) ? (
                <span className="text-muted small">Sin alumnos asignados</span>
              ) : (
                <div className="trabajo-member-tags">
                  {project.students.map((sid: any) => (
                    <span key={String(sid)} className="trabajo-member-pill">
                      👤 {resolveUserName(sid)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="trabajo-member-col">
              <h4>Docentes Asignados</h4>
              {(!project?.coTeachers || project.coTeachers.length === 0) ? (
                <span className="text-muted small">Sin co-docentes</span>
              ) : (
                <div className="trabajo-member-tags">
                  {project.coTeachers.map((tid: any) => (
                    <span key={String(tid)} className="trabajo-member-pill">
                      🎓 {resolveUserName(tid)}
                    </span>
                  ))}
                </div>
              )}
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
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                </svg>
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
                  className="btn-trabajo-primary"
                  onClick={() => handleOpenLinksModal(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                  </svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                  </svg>
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                        <path d="M4.5 9a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z" />
                      </svg>
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
                      className="trabajo-link-action-btn flex-grow-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z" />
                        <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z" />
                      </svg>
                      Abrir en Google Docs
                    </a>
                  </div>
                </div>

                {/* Enlace Google Drive */}
                <div className="trabajo-link-box">
                  <div className="trabajo-link-box-header">
                    <div className="trabajo-link-icon drive">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4.5 11 2 6.5 7.5 6.5 10 11z" />
                        <path d="M13.5 11 11 6.5 16 6.5 13.5 11z" />
                        <path d="M8.5 2 6 6.5 11 6.5 8.5 2z" />
                      </svg>
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
                      className="trabajo-link-action-btn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z" />
                        <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z" />
                      </svg>
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
                      ? `${new Date(work.lastReviewedAt).toLocaleString()}${
                          work.lastReviewedBy ? ` (${typeof work.lastReviewedBy === 'object' ? work.lastReviewedBy.email || work.lastReviewedBy.name : work.lastReviewedBy})` : ''
                        }`
                      : 'Sin revisiones registradas'}
                  </span>
                </div>
                <div className="trabajo-audit-item">
                  <span className="trabajo-audit-label">Última tutoría registrada:</span>
                  <span>
                    {work.lastTutoredAt
                      ? `${new Date(work.lastTutoredAt).toLocaleString()}${
                          work.lastTutoredBy ? ` (${typeof work.lastTutoredBy === 'object' ? work.lastTutoredBy.email || work.lastTutoredBy.name : work.lastTutoredBy})` : ''
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
                      className="btn-trabajo-primary"
                      onClick={handleOpenQualifyModal}
                      disabled={actionLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                      </svg>
                      Calificar Entrega
                    </button>

                    {/* Marcar como Observada */}
                    <button
                      type="button"
                      className="btn-trabajo-warning"
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M7.005 3.1a1 1 0 1 1 1.99 0l-.388 6.35a.61.61 0 0 1-1.214 0L7.005 3.1zM8 12a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                      </svg>
                      Marcar con Observaciones
                    </button>

                    {/* Registrar Tutoría (Tutor / admin) */}
                    <button
                      type="button"
                      className="btn-trabajo-info"
                      onClick={() =>
                        setConfirmActionModal({
                          open: true,
                          title: 'Registrar Tutoría Realizada',
                          message:
                            '¿Confirmas que se llevó a cabo una sesión de tutoría con el equipo de este proyecto? Quedará registrado tu usuario y la fecha actual.',
                          confirmText: 'Registrar Tutoría',
                          actionType: 'mark_tutored',
                        })
                      }
                      disabled={actionLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917l-7.5-3.5z" />
                      </svg>
                      Registrar Tutoría
                    </button>
                  </>
                )}

                {/* ACCIONES PARA ESTUDIANTE / ADMIN */}
                {(isStudent || isAdmin) && (
                  <>
                    {/* Modificar Enlaces */}
                    <button
                      type="button"
                      className="btn-trabajo-secondary"
                      onClick={() => handleOpenLinksModal(true)}
                      disabled={actionLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                      </svg>
                      Modificar Enlaces
                    </button>

                    {/* Notificar Avances (vuelve a pending_review) */}
                    <button
                      type="button"
                      className="btn-trabajo-primary"
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11z" />
                      </svg>
                      Notificar Avances
                    </button>

                    {/* Solicitar Tutoría */}
                    {!work.tutoringRequested && (
                      <button
                        type="button"
                        className="btn-trabajo-info"
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12V6a5 5 0 0 0-5-5z" />
                        </svg>
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

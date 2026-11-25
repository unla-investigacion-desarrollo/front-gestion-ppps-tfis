import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import {
  fetchPPPExpedienteById,
  fetchPPPGeneralDrive,
  updatePPPGeneralDrive,
  observePPPExpediente,
  approvePPPExpediente,
  disapprovePPPExpediente,
  loadSiuPPPExpediente,
  notifyPPPDocSent,
  abandonPPPExpediente,
  selectCurrentPPPExpediente,
  selectPPPGeneralDrive,
  selectPPPStatus,
  selectPPPError,
} from '../../../redux/slices/pppSlice';
import { fetchUsers, selectUsers } from '../../../redux/slices/usersSlice';
import {
  PPPStatus,
  getStudentDisplayName,
  getStudentEmail,
  normalizePPPType,
  formatPPPDateTime,
} from '../../services/pppService';
import { showToast } from '../../utils/toast';
import {
  PPPActionConfirmModal,
  PPPAbandonModal,
  PPPDriveModal,
  PPPNotifyModal,
  PPPObserveModal,
} from './components/PPPTramiteModals';
import {
  FaChevronDown,
  FaCommentDots,
  FaCircleInfo,
  FaFileLines,
  FaEye,
  FaPaperPlane,
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleXmark,
  FaCheck,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import './PPP.css';

type PPPActionConfirmation = 'approve' | 'disapprove' | 'siu';

export const PPPTramiteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser) as any;
  const allUsers = useSelector(selectUsers);

  // Roles
  const roles = useMemo(() => {
    const rawRoles = Array.isArray(currentUser?.roles)
      ? currentUser.roles
      : currentUser?.rol
      ? [currentUser.rol]
      : [];
    return rawRoles.map((r: any) => String(r).toUpperCase().trim());
  }, [currentUser]);

  const isAdmin = roles.some((roleName: string) =>
    ['ADMIN', 'SUPERADMIN'].includes(roleName)
  );
  const isTeacher = roles.some((r: string) => ['DOCENTE', 'PROFESSOR'].includes(r));
  const isTutor = !isAdmin && isTeacher && Boolean(currentUser?.isTutor);
  const isStudent = !isAdmin && !isTeacher;

  // Redux state
  const expediente = useSelector(selectCurrentPPPExpediente);
  const generalDriveUrl = useSelector(selectPPPGeneralDrive);
  const status = useSelector(selectPPPStatus);
  const pppError = useSelector(selectPPPError);

  const [actionLoading, setActionLoading] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<PPPActionConfirmation | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyFile, setNotifyFile] = useState<File | null>(null);
  const [showObserveModal, setShowObserveModal] = useState(false);
  const [observeFeedback, setObserveFeedback] = useState('');
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [driveInput, setDriveInput] = useState('');

  useEffect(() => {
    if (id && !isTutor) {
      dispatch(fetchPPPExpedienteById(id));
      dispatch(fetchPPPGeneralDrive());
      if (!isStudent) {
        dispatch(fetchUsers());
      }
    }
  }, [dispatch, id, isTutor, isStudent]);

  useEffect(() => {
    if (generalDriveUrl) {
      setDriveInput(generalDriveUrl);
    }
  }, [generalDriveUrl]);

  if (isTutor) {
    return (
      <div className="ppp-page-wrapper d-flex align-items-center justify-content-center">
        <div className="text-center p-5 bg-white rounded-3 border shadow-sm" style={{ maxWidth: '520px' }}>
          <FaCircleExclamation size={42} className="text-danger mb-3" />
          <h5 className="fw-bold text-dark">Acceso restringido</h5>
          <p className="text-muted small mb-4">
            Los docentes tutores no tienen acceso a la consulta de expedientes de Prácticas Profesionales Supervisadas (PPP).
          </p>
          <button type="button" className="btn-unla-primary" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  if (status === 'failed' && !expediente) {
    return (
      <div className="ppp-page-wrapper d-flex align-items-center justify-content-center">
        <div className="text-center p-5 bg-white rounded-3 border shadow-sm" style={{ maxWidth: '520px' }}>
          <FaCircleExclamation size={42} className="text-danger mb-3" />
          <h5 className="fw-bold text-dark">No se pudo cargar el expediente #{id}</h5>
          <p className="text-muted small mb-4">
            {pppError || 'No tenés permisos para consultar esta PPP o el expediente no existe.'}
          </p>
          <button type="button" className="btn-unla-primary" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  if (!expediente) {
    return (
      <div className="ppp-page-wrapper d-flex align-items-center justify-content-center">
        <div className="text-center p-5 bg-white rounded-3 border shadow-sm">
          <div className="spinner-border text-danger mb-3" role="status" />
          <h5>Cargando expediente de PPP #{id}...</h5>
          <p className="text-muted small">Por favor aguardá mientras obtenemos la información del trámite.</p>
        </div>
      </div>
    );
  }

  // Helper para renderizar nombres de estado
  const getStatusLabel = (statusKey: PPPStatus) => {
    switch (statusKey) {
      case 'pending_application':
        return 'Postulación en Evaluación';
      case 'application_rejected':
        return 'Postulación Desestimada';
      case 'pending_documentation':
        return 'Documentación Pendiente';
      case 'in_review':
        return 'En Revisión Académica';
      case 'observed':
        return 'Con Observaciones';
      case 'approved':
        return 'Práctica Aprobada';
      case 'disapproved':
        return 'Práctica No Aprobada';
      case 'dropped_out':
        return 'Trámite Dado de Baja';
      default:
        return statusKey;
    }
  };

  // Cálculo de pasos del Stepper
  const getStepProgress = (st: PPPStatus, isSiu: boolean) => {
    if (st === 'application_rejected' || st === 'dropped_out' || st === 'disapproved') {
      return { step: -1, label: 'Trámite Concluido' };
    }
    if (isSiu) return { step: 5, label: 'Completado' };
    if (st === 'approved') return { step: 4, label: 'Aprobado' };
    if (st === 'in_review' || st === 'observed') return { step: 3, label: 'Revisión' };
    if (st === 'pending_documentation') return { step: 2, label: 'Documentación' };
    return { step: 1, label: 'Postulación' };
  };

  const progress = getStepProgress(expediente.status, expediente.isSiuLoaded);

  // --- ACCIONES DOCENTE / ADMIN ---
  const handleObserve = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFeedback = observeFeedback.trim();
    if (!trimmedFeedback) {
      showToast('Debés ingresar una observación o feedback para el estudiante.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await dispatch(observePPPExpediente({ id: expediente.id, feedback: trimmedFeedback })).unwrap();
      setShowObserveModal(false);
      setObserveFeedback('');
      showToast('Expediente marcado con observaciones y feedback enviado correctamente.', 'success');
    } catch (err: any) {
      showToast(err || 'Error al observar expediente', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await dispatch(approvePPPExpediente(expediente.id)).unwrap();
      setPendingConfirmation(null);
      showToast('¡Práctica Profesional Aprobada con éxito!', 'success');
    } catch (err: any) {
      showToast(err || 'Error al aprobar expediente', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisapprove = async () => {
    setActionLoading(true);
    try {
      await dispatch(disapprovePPPExpediente(expediente.id)).unwrap();
      setPendingConfirmation(null);
      showToast('Práctica desaprobada. Expediente concluido.', 'error');
    } catch (err: any) {
      showToast(err || 'Error al desaprobar expediente', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSiuLoad = async () => {
    setActionLoading(true);
    try {
      await dispatch(loadSiuPPPExpediente(expediente.id)).unwrap();
      setPendingConfirmation(null);
      showToast('Carga en SIU Guaraní confirmada exitosamente', 'success');
    } catch (err: any) {
      showToast(err || 'Error al registrar en SIU Guaraní', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveInput.trim()) return;
    setActionLoading(true);
    try {
      await dispatch(updatePPPGeneralDrive(driveInput.trim())).unwrap();
      showToast('Drive general de la carrera actualizado', 'success');
      setShowDriveModal(false);
    } catch (err: any) {
      showToast(err || 'Error al actualizar Drive', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- ACCIONES ESTUDIANTE ---
  const handleNotifySent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyFile) {
      showToast('Debés adjuntar un archivo PDF para notificar el envío.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await dispatch(notifyPPPDocSent({ id: expediente.id, file: notifyFile })).unwrap();
      setShowNotifyModal(false);
      setNotifyFile(null);
      showToast('¡Entrega de documentación notificada! Tu trámite está en revisión académica.', 'success');
    } catch (err: any) {
      showToast(err || 'Error al notificar entrega', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAbandon = async () => {
    setActionLoading(true);
    try {
      await dispatch(abandonPPPExpediente(expediente.id)).unwrap();
      setShowAbandonModal(false);
      showToast('Trámite dado de baja correctamente', 'info');
    } catch (err: any) {
      showToast(err || 'Error al dar de baja trámite', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Validación de estados para acciones de alumno
  const canNotifyDocumentation =
    isStudent && (expediente.status === 'pending_documentation' || expediente.status === 'observed');
  const canAbandon =
    isStudent &&
    !['approved', 'disapproved', 'application_rejected', 'dropped_out'].includes(expediente.status);

  const isInterna = normalizePPPType(expediente.type, expediente) === 'interna';
  const resolvedProposalTitle =
    expediente.proposalTitle ||
    expediente.proposal?.title ||
    (isInterna ? 'Práctica Profesional Supervisada' : 'Práctica Profesional Externa');
  const resolvedDriveFolderUrl =
    expediente.driveFolderUrl || expediente.proposal?.driveFolderUrl;
  const confirmationDetails = pendingConfirmation
    ? {
        approve: {
          title: 'Aprobar práctica',
          question: '¿Confirmás la aprobación pedagógica de esta práctica?',
          description: 'El expediente quedará aprobado y habilitado para registrar su carga en SIU Guaraní.',
          icon: <FaCheck size={20} />,
          iconClass: 'success',
          confirmLabel: 'Sí, aprobar práctica',
          loadingLabel: 'Aprobando...',
          confirmClass: 'btn btn-success',
        },
        disapprove: {
          title: 'Desaprobar práctica',
          question: '¿Estás seguro de que querés desaprobar esta práctica?',
          description: 'Esta acción concluirá definitivamente el expediente y no se podrá retomar este trámite.',
          icon: <FaCircleXmark size={20} />,
          iconClass: 'danger',
          confirmLabel: 'Sí, desaprobar práctica',
          loadingLabel: 'Desaprobando...',
          confirmClass: 'btn btn-danger',
        },
        siu: {
          title: 'Registrar carga en SIU Guaraní',
          question: '¿La aprobación ya fue cargada y registrada en SIU Guaraní?',
          description: 'Al confirmar, el sistema dejará constancia de que la carga institucional ya se realizó.',
          icon: <FaFileLines size={20} />,
          iconClass: 'primary',
          confirmLabel: 'Sí, confirmar carga',
          loadingLabel: 'Registrando...',
          confirmClass: 'btn ppp-delete-confirm-btn',
        },
      }[pendingConfirmation]
    : null;

  return (
    <div className="ppp-page-wrapper">
      <div className="ppp-container">
        {/* Cabecera del Trámite */}
        <div className="ppp-header-card">
          <div className="ppp-header-info">
            <div className="ppp-header-icon">
              <FaFileLines size={28} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-light text-secondary border">Expediente #{expediente.id}</span>
                <span className={`badge ${isInterna ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'}`}>
                  Modalidad {isInterna ? 'Interna' : 'Externa'}
                </span>
              </div>
              <h1 className="ppp-title">{resolvedProposalTitle}</h1>
              <p className="ppp-subtitle">
                {expediente.proposal?.description
                  ? expediente.proposal.description
                  : isStudent
                    ? 'Seguimiento oficial de tu trámite de práctica profesional en la carrera.'
                    : `Expediente del estudiante: ${getStudentDisplayName(expediente, allUsers)}${getStudentEmail(expediente, allUsers) ? ` (${getStudentEmail(expediente, allUsers)})` : ''}`}
              </p>
            </div>
          </div>

          {!isStudent && (
            <div className="ppp-header-actions">
              <Link to="/ppp/expedientes" className="btn-unla-outline">
                ← Volver a expedientes
              </Link>
            </div>
          )}
        </div>

        {/* Stepper del Ciclo de Vida del Trámite */}
        <div className="ppp-stepper-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-dark m-0">Ciclo de Vida del Expediente</h6>
            <span className={`ppp-status-badge ppp-status-${expediente.status}`}>
              <span className="ppp-status-dot" />
              Estado: {getStatusLabel(expediente.status)}
            </span>
          </div>

          <div className="ppp-stepper">
            <div className="ppp-stepper-track">
              <div
                className="ppp-stepper-progress"
                style={{
                  width:
                    progress.step > 0
                      ? `${Math.min(100, Math.max(0, ((progress.step - 1) / 4) * 100))}%`
                      : '0%',
                }}
              />
            </div>

            <div className={`ppp-step-item ${progress.step >= 1 ? 'completed active' : ''}`}>
              <div className="ppp-step-circle">1</div>
              <div className="ppp-step-label">Postulación</div>
            </div>

            <div className={`ppp-step-item ${progress.step >= 2 ? (progress.step > 2 ? 'completed' : 'active') : ''}`}>
              <div className="ppp-step-circle">2</div>
              <div className="ppp-step-label">Documentación</div>
            </div>

            <div className={`ppp-step-item ${progress.step >= 3 ? (progress.step > 3 ? 'completed' : 'active') : ''}`}>
              <div className="ppp-step-circle">3</div>
              <div className="ppp-step-label">Revisión Académica</div>
            </div>

            <div className={`ppp-step-item ${progress.step >= 4 ? (progress.step > 4 ? 'completed' : 'active') : ''}`}>
              <div className="ppp-step-circle">4</div>
              <div className="ppp-step-label">Aprobación</div>
            </div>

            <div className={`ppp-step-item ${progress.step === 5 ? 'completed active' : ''}`}>
              <div className="ppp-step-circle">5</div>
              <div className="ppp-step-label">SIU Guaraní</div>
            </div>
          </div>
        </div>

        {/* Devolución / Feedback de los profesores */}
        {(() => {
          const feedbackText = String(expediente.feedback || expediente.observations || '').trim();
          if (!feedbackText) return null;
          const isObserved = expediente.status === 'observed';
          return (
            <div
              className="rounded-3 p-3 mb-4 d-flex align-items-start gap-3"
              style={{
                backgroundColor: isObserved ? '#fffbeb' : '#f8fafc',
                border: `1px solid ${isObserved ? '#fde68a' : '#e2e8f0'}`,
                borderLeft: `4px solid ${isObserved ? '#f59e0b' : '#64001d'}`,
              }}
            >
              <div
                className="mt-1 flex-shrink-0"
                style={{ color: isObserved ? '#d97706' : '#64001d' }}
              >
                <FaCircleExclamation size={18} />
              </div>
              <div>
                <h6
                  className="fw-bold mb-1"
                  style={{ fontSize: '0.92rem', color: isObserved ? '#92400e' : '#111827' }}
                >
                  {isObserved ? 'Observaciones de los profesores (requiere corrección)' : 'Devolución de los profesores'}
                </h6>
                <p
                  className="m-0"
                  style={{
                    fontSize: '0.88rem',
                    color: isObserved ? '#78350f' : '#374151',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.5,
                  }}
                >
                  {feedbackText}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Panel de Datos del Expediente (GET /ppp/:id) */}
        <div className="row g-4 mb-4">
          <div className="col-md-8">
            <div className="bg-white rounded-3 border p-4 shadow-sm h-100 d-flex flex-column gap-4">
              {/* Datos del Estudiante y del Trámite */}
              <div>
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                  Datos del Estudiante y Trámite
                </h6>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Estudiante:</span>
                    <span className="fw-semibold text-dark">
                      {getStudentDisplayName(expediente, allUsers)}
                    </span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">DNI:</span>
                    <span className="fw-semibold text-dark">
                      {expediente.student?.user?.dni || expediente.student?.dni || expediente.dni || '-'}
                    </span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Email de contacto:</span>
                    <span className="fw-semibold text-dark">
                      {getStudentEmail(expediente, allUsers) || '-'}
                    </span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Tipo de Práctica:</span>
                    <span className="fw-semibold text-dark">
                      {isInterna
                        ? 'Práctica Interna en Proyecto UNLa'
                        : 'Práctica Externa en Institución/Empresa'}
                    </span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Estado del Trámite:</span>
                    <span className="fw-semibold text-dark">
                      {getStatusLabel(expediente.status)}
                    </span>
                  </div>

                  {expediente.previousKnowledge && (
                    <div className="col-12">
                      <span className="text-muted small d-block">
                        Conocimientos previos / Motivación informados:
                      </span>
                      <div className="p-3 bg-light rounded mt-1 small text-secondary">
                        {expediente.previousKnowledge}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de la Propuesta (si corresponde) */}
              {(expediente.proposal || isInterna) &&
                (resolvedDriveFolderUrl || expediente.proposal?.internalNotes) && (
                <div>
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                    Información de la Propuesta
                  </h6>
                  <div className="row g-3">
                    {resolvedDriveFolderUrl && (
                      <div className="col-12">
                        <span className="text-muted small d-block">
                          Carpeta específica de la propuesta:
                        </span>
                        <a
                          href={resolvedDriveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none fw-semibold small text-break"
                        >
                          {resolvedDriveFolderUrl} ↗
                        </a>
                      </div>
                    )}

                    {expediente.proposal?.internalNotes && (
                      <div className="col-12">
                        <span className="text-muted small d-block">Notas internas de la cátedra:</span>
                        <div className="p-3 bg-light rounded mt-1 small text-secondary">
                          {expediente.proposal.internalNotes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-white rounded-3 border p-4 shadow-sm h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Estado Administrativo</h6>
                <div className="mb-3">
                  <span className="text-muted small d-block mb-1">Carga en SIU Guaraní:</span>
                  <span className={`ppp-siu-badge ${expediente.isSiuLoaded ? 'loaded' : 'pending'}`}>
                    {expediente.isSiuLoaded ? '✓ Asentado en SIU Guaraní' : '○ Pendiente de carga institucional'}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-muted small d-block mb-1">Fecha de creación:</span>
                  <span className="small text-secondary">
                    {expediente.createdAt ? formatPPPDateTime(expediente.createdAt) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted small d-block mb-1">Última actualización:</span>
                  <span className="small text-secondary">
                    {expediente.updatedAt ? formatPPPDateTime(expediente.updatedAt) : '-'}
                  </span>
                </div>
              </div>

              {expediente.isSiuLoaded && (
                <div className="alert alert-success m-0 p-2.5 small mt-3">
                  <strong>¡Felicitaciones!</strong> Esta práctica profesional supervisada ya se encuentra debidamente asentada en los registros académicos de la universidad.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Acciones según Rol */}
        <div className="ppp-actions-panel">
          {isStudent ? (
            <>
              <div className="ppp-actions-title d-flex align-items-center gap-2">
                <FaEye size={18} />
                Acciones del Trámite
              </div>
              <div className="ppp-actions-group">
                <button
                  type="button"
                  className="btn-unla-primary d-inline-flex align-items-center gap-1.5"
                  disabled={!canNotifyDocumentation || actionLoading}
                  title={
                    !canNotifyDocumentation
                      ? 'Disponible únicamente cuando el trámite requiere entrega de documentación o correcciones'
                      : undefined
                  }
                  onClick={() => {
                    setNotifyFile(null);
                    setShowNotifyModal(true);
                  }}
                >
                  <FaPaperPlane size={14} />
                  Notificar entrega de documentación
                </button>

                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={!canAbandon || actionLoading}
                  onClick={() => setShowAbandonModal(true)}
                >
                  Dar de baja trámite
                </button>

                {!canNotifyDocumentation &&
                  (expediente.status === 'pending_application' || expediente.status === 'in_review') && (
                    <span className="small text-muted ms-2">
                      {expediente.status === 'pending_application'
                        ? '(Se habilitará cuando tu postulación sea aceptada y la cátedra solicite la documentación)'
                        : '(Tu entrega está en revisión; volverá a habilitarse si la cátedra solicita correcciones)'}
                    </span>
                  )}
              </div>
            </>
          ) : (
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div className="fw-bold text-dark" style={{ fontSize: '15.5px' }}>
                  Acciones del Trámite
                </div>
                <div className="text-muted" style={{ fontSize: '13px' }}>
                  Dictamen de revisión académica
                </div>
              </div>

              <div className="position-relative d-inline-block" ref={actionsMenuRef}>
                <div
                  className="d-inline-flex align-items-stretch bg-white"
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-light bg-white border-0 d-inline-flex align-items-center gap-2 px-3 py-2 fw-medium text-dark"
                    style={{ fontSize: '13.5px', borderRadius: 0 }}
                    disabled={expediente.status === 'observed' || actionLoading}
                    onClick={() => {
                      setObserveFeedback('');
                      setShowObserveModal(true);
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#f59e0b',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span>Marcar con observaciones</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-light bg-white border-0 border-start d-inline-flex align-items-center px-2 py-2 text-secondary"
                    style={{ borderColor: '#e2e8f0', borderRadius: 0 }}
                    aria-expanded={actionsMenuOpen}
                    aria-label="Más acciones del trámite"
                    disabled={actionLoading}
                    onClick={() => setActionsMenuOpen((prev) => !prev)}
                  >
                    <FaChevronDown size={12} />
                  </button>
                </div>

                {actionsMenuOpen && (
                  <div
                    className="dropdown-menu show shadow-sm border rounded-3 py-2"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 6px)',
                      minWidth: '240px',
                      zIndex: 1050,
                    }}
                  >
                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center gap-2 py-2 text-success fw-medium"
                      disabled={expediente.status === 'approved' || actionLoading}
                      onClick={() => {
                        setActionsMenuOpen(false);
                        setPendingConfirmation('approve');
                      }}
                    >
                      <FaCheck size={14} />
                      <span>Aprobar práctica</span>
                    </button>

                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger"
                      disabled={expediente.status === 'disapproved' || actionLoading}
                      onClick={() => {
                        setActionsMenuOpen(false);
                        setPendingConfirmation('disapprove');
                      }}
                    >
                      <FaCircleXmark size={14} />
                      <span>Desaprobar práctica</span>
                    </button>

                    <div className="dropdown-divider my-1" />

                    {expediente.status !== 'approved' ? (
                      <div className="px-3 py-2 small text-muted d-flex align-items-start gap-2">
                        <FaCircleInfo size={13} className="mt-1 flex-shrink-0" />
                        <span>SIU Guaraní bloqueado hasta aprobación</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center gap-2 py-2 text-success fw-medium"
                        disabled={expediente.isSiuLoaded || actionLoading}
                        onClick={() => {
                          setActionsMenuOpen(false);
                          setPendingConfirmation('siu');
                        }}
                      >
                        <FaCheck size={14} />
                        <span>
                          {expediente.isSiuLoaded
                            ? 'Carga asentada en SIU'
                            : 'Registrar carga en SIU Guaraní'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <PPPActionConfirmModal
          details={confirmationDetails}
          proposalTitle={resolvedProposalTitle}
          expedienteId={expediente.id}
          actionLoading={actionLoading}
          onClose={() => setPendingConfirmation(null)}
          onConfirm={() => {
            if (pendingConfirmation === 'approve') void handleApprove();
            if (pendingConfirmation === 'disapprove') void handleDisapprove();
            if (pendingConfirmation === 'siu') void handleSiuLoad();
          }}
        />

        <PPPAbandonModal
          open={showAbandonModal}
          proposalTitle={resolvedProposalTitle}
          expedienteId={expediente.id}
          actionLoading={actionLoading}
          onClose={() => setShowAbandonModal(false)}
          onConfirm={handleAbandon}
        />

        <PPPDriveModal
          open={showDriveModal}
          driveInput={driveInput}
          actionLoading={actionLoading}
          onDriveInputChange={setDriveInput}
          onClose={() => setShowDriveModal(false)}
          onSubmit={handleUpdateDriveSubmit}
        />

        <PPPNotifyModal
          open={showNotifyModal}
          notifyFile={notifyFile}
          actionLoading={actionLoading}
          onFileChange={setNotifyFile}
          onClose={() => {
            setShowNotifyModal(false);
            setNotifyFile(null);
          }}
          onSubmit={handleNotifySent}
        />

        <PPPObserveModal
          open={showObserveModal}
          observeFeedback={observeFeedback}
          actionLoading={actionLoading}
          onFeedbackChange={setObserveFeedback}
          onClose={() => {
            setShowObserveModal(false);
            setObserveFeedback('');
          }}
          onSubmit={handleObserve}
        />
      </div>
    </div>
  );
};

export default PPPTramiteDetail;

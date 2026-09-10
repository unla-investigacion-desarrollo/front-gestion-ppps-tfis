import React, { useEffect, useState, useMemo } from 'react';
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
} from '../../../redux/slices/pppSlice';
import { PPPStatus } from '../../services/pppService';
import { showToast } from '../../utils/toast';
import './PPP.css';

export const PPPTramiteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser) as any;

  // Roles
  const roles = useMemo(() => {
    const rawRoles = Array.isArray(currentUser?.roles)
      ? currentUser.roles
      : currentUser?.rol
      ? [currentUser.rol]
      : [];
    return rawRoles.map((r: any) => String(r).toUpperCase().trim());
  }, [currentUser]);

  const isAdmin = roles.includes('ADMIN') || roles.includes('ADMINISTRADOR');
  const isTeacher = roles.some((r: string) => ['DOCENTE', 'TEACHER', 'PROFESSOR'].includes(r));
  const isStudent = !isAdmin && !isTeacher;

  // Redux state
  const expediente = useSelector(selectCurrentPPPExpediente);
  const generalDriveUrl = useSelector(selectPPPGeneralDrive);
  const status = useSelector(selectPPPStatus);

  const [actionLoading, setActionLoading] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveInput, setDriveInput] = useState('');

  useEffect(() => {
    if (id) {
      dispatch(fetchPPPExpedienteById(id));
      dispatch(fetchPPPGeneralDrive());
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (generalDriveUrl) {
      setDriveInput(generalDriveUrl);
    }
  }, [generalDriveUrl]);

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
  const handleObserve = async () => {
    if (!window.confirm('¿Confirmás pasar este expediente al estado "Con Observaciones"? El alumno será notificado para reenviar la documentación.')) return;
    setActionLoading(true);
    try {
      await dispatch(observePPPExpediente(expediente.id)).unwrap();
      showToast('Expediente marcado con observaciones', 'info');
    } catch (err: any) {
      showToast(err || 'Error al observar expediente', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('¿Confirmás la aprobación pedagógica de esta Práctica Profesional Supervisada?')) return;
    setActionLoading(true);
    try {
      await dispatch(approvePPPExpediente(expediente.id)).unwrap();
      showToast('¡Práctica Profesional Aprobada con éxito!', 'success');
    } catch (err: any) {
      showToast(err || 'Error al aprobar expediente', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisapprove = async () => {
    if (!window.confirm('¿Estás seguro de desaprobar esta práctica profesional? Esta acción concluye el expediente.')) return;
    setActionLoading(true);
    try {
      await dispatch(disapprovePPPExpediente(expediente.id)).unwrap();
      showToast('Práctica desaprobada. Expediente concluido.', 'error');
    } catch (err: any) {
      showToast(err || 'Error al desaprobar expediente', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSiuLoad = async () => {
    if (!window.confirm('¿Confirmás que la aprobación de la PPP ya fue cargada y registrada en SIU Guaraní?')) return;
    setActionLoading(true);
    try {
      await dispatch(loadSiuPPPExpediente(expediente.id)).unwrap();
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
  const handleNotifySent = async () => {
    if (!window.confirm('¿Confirmás que ya enviaste la documentación y convenios solicitados a la cátedra? El expediente pasará a revisión docente.')) return;
    setActionLoading(true);
    try {
      await dispatch(notifyPPPDocSent(expediente.id)).unwrap();
      showToast('¡Entrega de documentación notificada! Tu trámite está en revisión académica.', 'success');
    } catch (err: any) {
      showToast(err || 'Error al notificar entrega', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm('¿Estás seguro de que deseás dar de baja este trámite de PPP? Esta acción concluirá el expediente definitivamente.')) return;
    setActionLoading(true);
    try {
      await dispatch(abandonPPPExpediente(expediente.id)).unwrap();
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

  return (
    <div className="ppp-page-wrapper">
      <div className="ppp-container">
        {/* Cabecera del Trámite */}
        <div className="ppp-header-card">
          <div className="ppp-header-info">
            <div className="ppp-header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
              </svg>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-light text-secondary border">Expediente #{expediente.id}</span>
                <span className={`badge ${expediente.type === 'interna' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'}`}>
                  Modalidad {expediente.type === 'interna' ? 'Interna' : 'Externa'}
                </span>
              </div>
              <h1 className="ppp-title">{expediente.proposalTitle || 'Práctica Profesional Supervisada'}</h1>
              <p className="ppp-subtitle">
                {isStudent
                  ? 'Seguimiento oficial de tu trámite de práctica profesional en la carrera.'
                  : `Expediente del alumno: ${expediente.studentName || 'Estudiante'} (${expediente.studentEmail || '-'})`}
              </p>
            </div>
          </div>

          <div className="ppp-header-actions">
            {!isStudent ? (
              <>
                <Link to="/ppp/expedientes" className="btn-unla-outline">
                  ← Volver a expedientes
                </Link>
                <button
                  type="button"
                  className="btn-unla-outline"
                  onClick={() => setShowDriveModal(true)}
                >
                  Configurar Drive oficial
                </button>
              </>
            ) : (
              <Link to="/ppp/convocatorias" className="btn-unla-outline">
                ← Catálogo de convocatorias
              </Link>
            )}
          </div>
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

        {/* BOTÓN PRIORITARIO: Descargar Modelos y Convenios Oficiales (Drive General) */}
        <div className="ppp-drive-download-banner">
          <div className="ppp-drive-download-info">
            <div className="ppp-drive-download-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
              </svg>
            </div>
            <div>
              <h6 className="fw-bold text-dark m-0">Modelos y Convenios Oficiales de PPP</h6>
              <p className="text-muted small m-0">
                Descargá las actas acuerdo, convenios marco, planillas de actividades y seguro para presentar en la cátedra.
              </p>
            </div>
          </div>

          <a
            href={generalDriveUrl || expediente.generalDriveUrl || 'https://drive.google.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-unla-primary text-decoration-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .997l.003.088h4.69v-.792z" />
            </svg>
            Abrir carpeta de convenios (Drive) ↗
          </a>
        </div>

        {/* Panel de Datos del Expediente */}
        <div className="row g-4 mb-4">
          <div className="col-md-8">
            <div className="bg-white rounded-3 border p-4 shadow-sm h-100">
              <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Detalles del Expediente</h6>
              <div className="row g-3">
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Estudiante:</span>
                  <span className="fw-semibold text-dark">{expediente.studentName || 'Estudiante'}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Email de contacto:</span>
                  <span className="fw-semibold text-dark">{expediente.studentEmail || '-'}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Tipo de Práctica:</span>
                  <span className="fw-semibold text-dark">
                    {expediente.type === 'interna' ? 'Práctica Interna en Proyecto UNLa' : 'Práctica Externa en Institución/Empresa'}
                  </span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Fecha de Inicio:</span>
                  <span className="fw-semibold text-dark">
                    {expediente.createdAt ? new Date(expediente.createdAt).toLocaleDateString() : '-'}
                  </span>
                </div>

                {expediente.previousKnowledge && (
                  <div className="col-12">
                    <span className="text-muted small d-block">Conocimientos previos informados:</span>
                    <div className="p-3 bg-light rounded mt-1 small text-secondary">
                      {expediente.previousKnowledge}
                    </div>
                  </div>
                )}

                {expediente.driveFolderUrl && (
                  <div className="col-12">
                    <span className="text-muted small d-block">Carpeta específica de la propuesta:</span>
                    <a
                      href={expediente.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-decoration-none fw-semibold small"
                    >
                      {expediente.driveFolderUrl} ↗
                    </a>
                  </div>
                )}
              </div>
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
                <div>
                  <span className="text-muted small d-block mb-1">Última actualización:</span>
                  <span className="small text-secondary">
                    {expediente.updatedAt ? new Date(expediente.updatedAt).toLocaleString() : '-'}
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
          <div className="ppp-actions-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
              <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
            </svg>
            Acciones del Trámite
          </div>

          {/* VISTA ESTUDIANTE: Botones de Notificar y Dar de Baja */}
          {isStudent && (
            <div className="ppp-actions-group">
              <button
                type="button"
                className="btn-unla-primary"
                disabled={!canNotifyDocumentation || actionLoading}
                onClick={handleNotifySent}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.8 14.5a.5.5 0 0 1-.928.016l-3.23-6.46-6.46-3.23a.5.5 0 0 1 .016-.928L14.054.036a.5.5 0 0 1 .54.11z" />
                </svg>
                Notificar entrega de documentación
              </button>

              <button
                type="button"
                className="btn btn-outline-danger"
                disabled={!canAbandon || actionLoading}
                onClick={handleAbandon}
              >
                Dar de baja trámite
              </button>

              {!canNotifyDocumentation && (
                <span className="small text-muted ms-2">
                  (El botón de notificar entrega se habilitará cuando la cátedra requiera documentación o correcciones)
                </span>
              )}
            </div>
          )}

          {/* VISTA DOCENTE / ADMIN: Botones de Transición de Estado y Carga en SIU */}
          {!isStudent && (
            <div className="ppp-actions-group">
              {/* Aprobar */}
              <button
                type="button"
                className="btn btn-success d-inline-flex align-items-center gap-1.5"
                disabled={expediente.status === 'approved' || actionLoading}
                onClick={handleApprove}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                </svg>
                Aprobar práctica
              </button>

              {/* Observar */}
              <button
                type="button"
                className="btn btn-warning text-dark d-inline-flex align-items-center gap-1.5"
                disabled={expediente.status === 'observed' || actionLoading}
                onClick={handleObserve}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                </svg>
                Marcar con observaciones
              </button>

              {/* Desaprobar */}
              <button
                type="button"
                className="btn btn-outline-danger d-inline-flex align-items-center gap-1.5"
                disabled={expediente.status === 'disapproved' || actionLoading}
                onClick={handleDisapprove}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
                </svg>
                Desaprobar práctica
              </button>

              {/* Registrar Carga en SIU Guaraní */}
              <button
                type="button"
                className="btn btn-outline-success d-inline-flex align-items-center gap-1.5"
                disabled={expediente.status !== 'approved' || expediente.isSiuLoaded || actionLoading}
                onClick={handleSiuLoad}
                title={expediente.status !== 'approved' ? 'Requiere aprobación previa' : 'Registrar en SIU'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z" />
                </svg>
                {expediente.isSiuLoaded ? 'Carga asentada en SIU' : 'Registrar carga en SIU Guaraní'}
              </button>
            </div>
          )}
        </div>

        {/* Modal: Configurar Drive General */}
        {showDriveModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
                <div className="modal-header border-bottom px-4 py-3">
                  <h5 className="modal-title fw-bold text-dark">Drive Institucional de Convenios</h5>
                  <button type="button" className="btn-close" onClick={() => setShowDriveModal(false)} />
                </div>
                <form onSubmit={handleUpdateDriveSubmit}>
                  <div className="modal-body px-4 py-3 d-flex flex-column gap-3">
                    <p className="small text-muted m-0">
                      Actualizá el enlace del Google Drive oficial que los alumnos utilizan para descargar modelos de convenios.
                    </p>
                    <div>
                      <label className="form-label fw-semibold small text-secondary">
                        URL de Google Drive <span className="text-danger">*</span>
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        required
                        value={driveInput}
                        onChange={(e) => setDriveInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-top px-4 py-3">
                    <button type="button" className="btn btn-light" onClick={() => setShowDriveModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-unla-primary" disabled={actionLoading}>
                      Guardar URL
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PPPTramiteDetail;

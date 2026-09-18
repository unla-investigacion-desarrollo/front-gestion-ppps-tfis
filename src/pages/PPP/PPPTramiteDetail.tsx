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
import { fetchUsers, selectUsers } from '../../../redux/slices/usersSlice';
import {
  PPPStatus,
  getStudentDisplayName,
  getStudentEmail,
} from '../../services/pppService';
import { showToast } from '../../utils/toast';
import {
  FaFileLines,
  FaFileArrowDown,
  FaFolderOpen,
  FaEye,
  FaPaperPlane,
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleXmark,
  FaCheck,
} from 'react-icons/fa6';
import './PPP.css';

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
      dispatch(fetchUsers());
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
              <FaFileLines size={28} />
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
                  : `Expediente del estudiante: ${getStudentDisplayName(expediente, allUsers)}${getStudentEmail(expediente, allUsers) ? ` (${getStudentEmail(expediente, allUsers)})` : ''}`}
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
              <FaFileArrowDown size={24} />
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
            className="btn-unla-primary text-decoration-none d-inline-flex align-items-center gap-1.5"
          >
            <FaFolderOpen size={16} />
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
                  <span className="fw-semibold text-dark">{getStudentDisplayName(expediente, allUsers)}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Email de contacto:</span>
                  <span className="fw-semibold text-dark">{getStudentEmail(expediente, allUsers) || '-'}</span>
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
          <div className="ppp-actions-title d-flex align-items-center gap-2">
            <FaEye size={18} />
            Acciones del Trámite
          </div>

          {/* VISTA ESTUDIANTE: Botones de Notificar y Dar de Baja */}
          {isStudent && (
            <div className="ppp-actions-group">
              <button
                type="button"
                className="btn-unla-primary d-inline-flex align-items-center gap-1.5"
                disabled={!canNotifyDocumentation || actionLoading}
                onClick={handleNotifySent}
              >
                <FaPaperPlane size={14} />
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
                <FaCircleCheck size={16} />
                Aprobar práctica
              </button>

              {/* Observar */}
              <button
                type="button"
                className="btn btn-warning text-dark d-inline-flex align-items-center gap-1.5"
                disabled={expediente.status === 'observed' || actionLoading}
                onClick={handleObserve}
              >
                <FaCircleExclamation size={16} />
                Marcar con observaciones
              </button>

              {/* Desaprobar */}
              <button
                type="button"
                className="btn btn-outline-danger d-inline-flex align-items-center gap-1.5"
                disabled={expediente.status === 'disapproved' || actionLoading}
                onClick={handleDisapprove}
              >
                <FaCircleXmark size={16} />
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
                <FaCheck size={16} />
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

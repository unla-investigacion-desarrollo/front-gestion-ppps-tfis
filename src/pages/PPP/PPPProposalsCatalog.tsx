import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import {
  fetchPPPProposals,
  createPPPProposal,
  updatePPPProposalStatus,
  applyToPPPProposal,
  fetchPPPGeneralDrive,
  updatePPPGeneralDrive,
  createPPPExternal,
  acceptPPPApplicant,
  rejectPPPApplicant,
  selectPPPProposals,
  selectPPPGeneralDrive,
  selectPPPStatus,
} from '../../../redux/slices/pppSlice';
import { PPPProposal, PPPApplicant } from '../../services/pppService';
import { showToast } from '../../utils/toast';
import {
  FaIdCard,
  FaPlus,
  FaFolder,
  FaFolderOpen,
  FaMagnifyingGlass,
  FaFileLines,
  FaLock,
  FaUsers,
} from 'react-icons/fa6';
import './PPP.css';

export const PPPProposalsCatalog: React.FC = () => {
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

  // Estado de Redux
  const proposals = useSelector(selectPPPProposals);
  const generalDriveUrl = useSelector(selectPPPGeneralDrive);
  const status = useSelector(selectPPPStatus);

  // Estados locales
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'open' | 'closed'>('all');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    driveFolderUrl: '',
    internalNotes: '',
  });

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedProposalToApply, setSelectedProposalToApply] = useState<PPPProposal | null>(null);
  const [previousKnowledge, setPreviousKnowledge] = useState('');

  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedProposalApplicants, setSelectedProposalApplicants] = useState<PPPProposal | null>(null);

  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveInput, setDriveInput] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  // Carga inicial
  useEffect(() => {
    dispatch(fetchPPPProposals({ isStudent }));
    dispatch(fetchPPPGeneralDrive());
  }, [dispatch, isStudent]);

  useEffect(() => {
    if (generalDriveUrl) {
      setDriveInput(generalDriveUrl);
    }
  }, [generalDriveUrl]);

  // Filtrado de propuestas
  const filteredProposals = useMemo(() => {
    let list = [...proposals];

    // Para estudiantes, estrictamente solo abiertas
    if (isStudent) {
      list = list.filter((p) => p.isOpen);
    } else {
      if (filterState === 'open') list = list.filter((p) => p.isOpen);
      if (filterState === 'closed') list = list.filter((p) => !p.isOpen);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (isAdmin && p.internalNotes && p.internalNotes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [proposals, isStudent, filterState, searchQuery, isAdmin]);

  // Manejador: Crear Propuesta Interna (POST /ppp/proposals)
  const handleCreateProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim()) {
      showToast('Completá el título y la descripción obligatorios', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await dispatch(
        createPPPProposal({
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          driveFolderUrl: createForm.driveFolderUrl.trim() || undefined,
          internalNotes: createForm.internalNotes.trim() || undefined,
        })
      ).unwrap();
      showToast('Propuesta interna creada correctamente', 'success');
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', driveFolderUrl: '', internalNotes: '' });
    } catch (err: any) {
      showToast(err || 'Error al crear propuesta', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador: Cambiar Estado de Convocatoria (PATCH /ppp/proposals/:id/status)
  const handleToggleOpenStatus = async (proposal: PPPProposal) => {
    const nextState = !proposal.isOpen;
    try {
      await dispatch(updatePPPProposalStatus({ id: proposal.id, isOpen: nextState })).unwrap();
      showToast(`Convocatoria ${nextState ? 'abierta' : 'cerrada'} correctamente`, 'success');
    } catch (err: any) {
      showToast(err || 'Error al cambiar estado de convocatoria', 'error');
    }
  };

  // Manejador: Postulación a Propuesta (POST /ppp/proposals/:id/apply)
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposalToApply) return;
    if (!previousKnowledge.trim()) {
      showToast('Debés detallar tus conocimientos previos para postularte', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const studentInfo = {
        id: currentUser?.id,
        name: [currentUser?.nombre, currentUser?.apellido].filter(Boolean).join(' ') || currentUser?.email,
        email: currentUser?.email,
      };
      const res = await dispatch(
        applyToPPPProposal({
          proposalId: selectedProposalToApply.id,
          previousKnowledge: previousKnowledge.trim(),
          studentInfo,
        })
      ).unwrap();
      showToast('¡Postulación enviada exitosamente!', 'success');
      setShowApplyModal(false);
      setPreviousKnowledge('');
      // Si recibimos un expediente, podemos redirigir a ver el trámite
      if (res?.expediente?.id) {
        navigate(`/ppp/${res.expediente.id}`);
      }
    } catch (err: any) {
      showToast(err || 'Error al postularse a la convocatoria', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador: Iniciar Trámite Externo (POST /ppp/external)
  const handleCreateExternal = async () => {
    const confirmAction = window.confirm(
      '¿Deseás iniciar un trámite de Práctica Profesional Supervisada externa? Podrás descargar los modelos y convenios oficiales a continuación.'
    );
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      const studentInfo = {
        id: currentUser?.id,
        name: [currentUser?.nombre, currentUser?.apellido].filter(Boolean).join(' ') || currentUser?.email,
        email: currentUser?.email,
      };
      const newExp = await dispatch(createPPPExternal({ studentInfo })).unwrap();
      showToast('Trámite externo iniciado con éxito', 'success');
      if (newExp?.id) {
        navigate(`/ppp/${newExp.id}`);
      }
    } catch (err: any) {
      showToast(err || 'Error al iniciar trámite externo', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador: Configurar Drive General (PATCH /ppp/general-drive)
  const handleUpdateDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveInput.trim()) {
      showToast('La URL institucional del Drive es obligatoria', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await dispatch(updatePPPGeneralDrive(driveInput.trim())).unwrap();
      showToast('Drive general de la carrera actualizado correctamente', 'success');
      setShowDriveModal(false);
    } catch (err: any) {
      showToast(err || 'Error al configurar Drive general', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador: Aceptar / Rechazar Postulante (PATCH /ppp/proposals/:proposalId/students/:studentId/accept)
  const handleApplicantAction = async (proposalId: number | string, studentId: number | string, accept: boolean) => {
    setActionLoading(true);
    try {
      if (accept) {
        await dispatch(acceptPPPApplicant({ proposalId, studentId })).unwrap();
        showToast('Postulante aceptado. Trámite iniciado en estado Documentación Pendiente.', 'success');
      } else {
        await dispatch(rejectPPPApplicant({ proposalId, studentId })).unwrap();
        showToast('Postulación desestimada.', 'info');
      }
      setShowApplicantsModal(false);
    } catch (err: any) {
      showToast(err || 'Error al procesar postulante', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="ppp-page-wrapper">
      <div className="ppp-container">
        {/* Cabecera Principal */}
        <div className="ppp-header-card">
          <div className="ppp-header-info">
            <div className="ppp-header-icon">
              <FaIdCard size={28} />
            </div>
            <div>
              <h1 className="ppp-title">Catálogo de Convocatorias PPP</h1>
              <p className="ppp-subtitle">
                {isStudent
                  ? 'Explorá las convocatorias de Prácticas Profesionales Supervisadas abiertas y postulate o gestioná una práctica externa.'
                  : 'Gestión académica de propuestas internas de PPP, control de convocatorias y postulaciones.'}
              </p>
            </div>
          </div>

          <div className="ppp-header-actions">
            {isStudent ? (
              <button
                type="button"
                className="btn-unla-primary d-inline-flex align-items-center gap-1"
                onClick={handleCreateExternal}
                disabled={actionLoading}
              >
                <FaPlus size={14} />
                Iniciar trámite externo
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-unla-outline d-inline-flex align-items-center gap-1"
                  onClick={() => setShowDriveModal(true)}
                >
                  <FaFolder size={14} />
                  Drive institucional
                </button>
                <button
                  type="button"
                  className="btn-unla-primary d-inline-flex align-items-center gap-1"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FaPlus size={14} />
                  Crear propuesta
                </button>
              </>
            )}
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="ppp-filter-card">
          <div className="ppp-search-box">
            <span className="ppp-search-icon">
              <FaMagnifyingGlass size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por título, temática o palabras clave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {!isStudent && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small fw-semibold">Estado:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: '160px' }}
                value={filterState}
                onChange={(e: any) => setFilterState(e.target.value)}
              >
                <option value="all">Todas ({proposals.length})</option>
                <option value="open">Solo abiertas</option>
                <option value="closed">Solo cerradas</option>
              </select>
            </div>
          )}
        </div>

        {/* Listado de Propuestas */}
        {filteredProposals.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-3 border p-4">
            <div className="text-muted mb-2">
              <FaFileLines size={48} color="#cbd5e1" />
            </div>
            <h5 className="fw-semibold text-secondary">No se encontraron convocatorias de PPP</h5>
            <p className="text-muted small">
              {isStudent
                ? 'No hay propuestas de PPP disponibles en este momento. Podés optar por iniciar un trámite externo.'
                : 'No coinciden convocatorias con el criterio de búsqueda seleccionado.'}
            </p>
          </div>
        ) : (
          <div className="ppp-proposals-grid">
            {filteredProposals.map((proposal) => {
              const applicantsCount = proposal.applicants?.length || 0;

              return (
                <div key={proposal.id} className="ppp-proposal-card">
                  <div className="ppp-proposal-header">
                    <h3 className="ppp-proposal-title">{proposal.title}</h3>
                    <span
                      className={`badge ${
                        proposal.isOpen ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'
                      } px-2.5 py-1 rounded-pill`}
                    >
                      {proposal.isOpen ? 'Convocatoria Abierta' : 'Cerrada'}
                    </span>
                  </div>

                  <p className="ppp-proposal-desc">{proposal.description}</p>

                    {proposal.driveFolderUrl && (
                      <a
                        href={proposal.driveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ppp-proposal-drive-link d-inline-flex align-items-center gap-1"
                      >
                        <FaFolderOpen size={14} />
                        Recursos de la propuesta (Drive) ↗
                      </a>
                    )}

                    {!isStudent && proposal.internalNotes && (
                      <div className="ppp-internal-notes-box">
                        <div className="ppp-internal-notes-title d-inline-flex align-items-center gap-1">
                          <FaLock size={13} />
                          Notas internas de la cátedra:
                        </div>
                      <div>{proposal.internalNotes}</div>
                    </div>
                  )}

                  {/* Pie de Tarjeta con Controles y Acciones */}
                  <div className="ppp-proposal-footer">
                    {isStudent ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-unla-primary w-100"
                        onClick={() => {
                          setSelectedProposalToApply(proposal);
                          setShowApplyModal(true);
                        }}
                      >
                        Postularme a esta convocatoria
                      </button>
                    ) : (
                      <>
                        <div className="ppp-switch-wrapper">
                          <input
                            className="form-check-input ppp-switch"
                            type="checkbox"
                            checked={proposal.isOpen}
                            onChange={() => handleToggleOpenStatus(proposal)}
                            title={proposal.isOpen ? 'Cerrar convocatoria' : 'Abrir convocatoria'}
                          />
                          <span className="small text-muted">{proposal.isOpen ? 'Abierta' : 'Cerrada'}</span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-unla-outline d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setSelectedProposalApplicants(proposal);
                            setShowApplicantsModal(true);
                          }}
                        >
                          <FaUsers size={14} />
                          Postulantes ({applicantsCount})
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL 1: Crear Propuesta Interna (Docente / Admin) */}
        {showCreateModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
                <div className="modal-header border-bottom px-4 py-3">
                  <h5 className="modal-title fw-bold text-dark">Nueva Propuesta de Práctica Profesional (PPP)</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} />
                </div>
                <form onSubmit={handleCreateProposalSubmit}>
                  <div className="modal-body px-4 py-3 d-flex flex-column gap-3">
                    <div>
                      <label className="form-label fw-semibold small text-secondary">
                        Título de la propuesta <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Ej: Desarrollo de Sistema de Información Geográfica Comunitario"
                        value={createForm.title}
                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="form-label fw-semibold small text-secondary">
                        Descripción detallada <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={4}
                        required
                        placeholder="Describí los objetivos de la práctica, actividades a realizar y perfil esperado..."
                        value={createForm.description}
                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="form-label fw-semibold small text-secondary">
                        URL de Carpeta de Recursos (Drive) <span className="text-muted small">(Opcional)</span>
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://drive.google.com/drive/folders/..."
                        value={createForm.driveFolderUrl}
                        onChange={(e) => setCreateForm({ ...createForm, driveFolderUrl: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="form-label fw-semibold small text-secondary">
                        Notas internas de cátedra <span className="text-muted small">(Privado - solo docentes)</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Criterios de admisión internos, observaciones de docentes evaluadores..."
                        value={createForm.internalNotes}
                        onChange={(e) => setCreateForm({ ...createForm, internalNotes: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-top px-4 py-3">
                    <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-unla-primary" disabled={actionLoading}>
                      {actionLoading ? 'Guardando...' : 'Publicar propuesta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Postularse a Propuesta (Estudiante - Formulario 3) */}
        {showApplyModal && selectedProposalToApply && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
                <div className="modal-header border-bottom px-4 py-3">
                  <h5 className="modal-title fw-bold text-dark">Postulación a Convocatoria</h5>
                  <button type="button" className="btn-close" onClick={() => setShowApplyModal(false)} />
                </div>
                <form onSubmit={handleApplySubmit}>
                  <div className="modal-body px-4 py-3 d-flex flex-column gap-3">
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="small text-muted fw-bold text-uppercase">Convocatoria:</div>
                      <div className="fw-semibold text-dark">{selectedProposalToApply.title}</div>
                    </div>

                    <div>
                      <label className="form-label fw-semibold small text-secondary">
                        Conocimientos previos y motivación <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={4}
                        required
                        placeholder="Describí brevemente tu experiencia, materias afines aprobadas y herramientas que manejás..."
                        value={previousKnowledge}
                        onChange={(e) => setPreviousKnowledge(e.target.value)}
                      />
                      <div className="form-text small">
                        Tu identidad se asocia automáticamente a través de tu sesión activa.
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top px-4 py-3">
                    <button type="button" className="btn btn-light" onClick={() => setShowApplyModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-unla-primary" disabled={actionLoading}>
                      {actionLoading ? 'Enviando...' : 'Confirmar postulación'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Ver Postulantes (Docente / Admin) */}
        {showApplicantsModal && selectedProposalApplicants && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
                <div className="modal-header border-bottom px-4 py-3">
                  <div>
                    <h5 className="modal-title fw-bold text-dark">Postulantes Recibidos</h5>
                    <div className="small text-muted">{selectedProposalApplicants.title}</div>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setShowApplicantsModal(false)} />
                </div>
                <div className="modal-body px-4 py-3">
                  {(!selectedProposalApplicants.applicants || selectedProposalApplicants.applicants.length === 0) ? (
                    <div className="text-center py-4 text-muted">
                      No hay alumnos postulados para esta convocatoria todavía.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {selectedProposalApplicants.applicants.map((app: PPPApplicant, idx: number) => (
                        <div key={idx} className="p-3 border rounded-3 bg-white d-flex flex-column gap-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong className="text-dark">{app.studentName || 'Estudiante Postulado'}</strong>
                              {app.studentEmail && <span className="text-muted small ms-2">({app.studentEmail})</span>}
                            </div>
                            {app.status && (
                              <span
                                className={`badge ${
                                  app.status === 'accepted'
                                    ? 'bg-success-subtle text-success'
                                    : app.status === 'rejected'
                                    ? 'bg-danger-subtle text-danger'
                                    : 'bg-warning-subtle text-warning'
                                } px-2.5 py-1 rounded-pill`}
                              >
                                {app.status === 'accepted' ? 'Aceptado' : app.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                              </span>
                            )}
                          </div>

                          <div className="small text-secondary bg-light p-2 rounded">
                            <strong>Conocimientos informados:</strong> {app.previousKnowledge || 'Sin detalles'}
                          </div>

                          {app.status === 'pending' && (
                            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={actionLoading}
                                onClick={() => handleApplicantAction(selectedProposalApplicants.id, app.studentId, false)}
                              >
                                Rechazar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                disabled={actionLoading}
                                onClick={() => handleApplicantAction(selectedProposalApplicants.id, app.studentId, true)}
                              >
                                Aceptar estudiante
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top px-4 py-2.5">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setShowApplicantsModal(false)}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: Configurar Drive General de la Carrera (Docente / Admin) */}
        {showDriveModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
                <div className="modal-header border-bottom px-4 py-3">
                  <h5 className="modal-title fw-bold text-dark">Drive Institucional de la Carrera</h5>
                  <button type="button" className="btn-close" onClick={() => setShowDriveModal(false)} />
                </div>
                <form onSubmit={handleUpdateDriveSubmit}>
                  <div className="modal-body px-4 py-3 d-flex flex-column gap-3">
                    <p className="small text-muted m-0">
                      Este enlace institucional es el que visualizan los alumnos para descargar los modelos de convenios oficiales, actas de compromiso y plantillas de documentación.
                    </p>
                    <div>
                      <label className="form-label fw-semibold small text-secondary">
                        URL de Google Drive Institucional <span className="text-danger">*</span>
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        required
                        placeholder="https://drive.google.com/drive/folders/..."
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
                      {actionLoading ? 'Actualizando...' : 'Guardar enlace'}
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

export default PPPProposalsCatalog;

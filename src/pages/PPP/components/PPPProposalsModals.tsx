import React from 'react';
import { PPPProposal, PPPApplicant } from '../../../services/pppService';
import { CreateProposalFormData } from '../../../hooks/usePPPProposals';

// =========================================================================
// MODAL 1: Crear Propuesta Interna (Docente / Admin)
// =========================================================================
export interface CreateProposalModalProps {
  show: boolean;
  onClose: () => void;
  createForm: CreateProposalFormData;
  onCreateFormChange: (updatedForm: CreateProposalFormData) => void;
  onSubmit: (formSubmitEvent: React.FormEvent) => void;
  actionLoading: boolean;
}

export const PPPCreateProposalModal: React.FC<CreateProposalModalProps> = ({
  show,
  onClose,
  createForm,
  onCreateFormChange,
  onSubmit,
  actionLoading,
}) => {
  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: '14px' }}
        >
          <div className="modal-header border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold text-dark">
              Nueva Propuesta de Práctica Profesional (PPP)
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              title="Cerrar modal"
            />
          </div>
          <form onSubmit={onSubmit}>
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
                  onChange={(changeEvent) =>
                    onCreateFormChange({
                      ...createForm,
                      title: changeEvent.target.value,
                    })
                  }
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
                  onChange={(changeEvent) =>
                    onCreateFormChange({
                      ...createForm,
                      description: changeEvent.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label fw-semibold small text-secondary">
                  URL de Carpeta de Recursos (Drive){' '}
                  <span className="text-muted small">(Opcional)</span>
                </label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={createForm.driveFolderUrl}
                  onChange={(changeEvent) =>
                    onCreateFormChange({
                      ...createForm,
                      driveFolderUrl: changeEvent.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label fw-semibold small text-secondary">
                  Notas internas de cátedra{' '}
                  <span className="text-muted small">(Privado - solo docentes)</span>
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Criterios de admisión internos, observaciones de docentes evaluadores..."
                  value={createForm.internalNotes}
                  onChange={(changeEvent) =>
                    onCreateFormChange({
                      ...createForm,
                      internalNotes: changeEvent.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-unla-primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Guardando...' : 'Publicar propuesta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 2: Postularse a Propuesta (Estudiante)
// =========================================================================
export interface ApplyModalProps {
  show: boolean;
  proposal: PPPProposal | null;
  previousKnowledge: string;
  onPreviousKnowledgeChange: (newText: string) => void;
  onClose: () => void;
  onSubmit: (formSubmitEvent: React.FormEvent) => void;
  actionLoading: boolean;
}

export const PPPApplyModal: React.FC<ApplyModalProps> = ({
  show,
  proposal,
  previousKnowledge,
  onPreviousKnowledgeChange,
  onClose,
  onSubmit,
  actionLoading,
}) => {
  if (!show || !proposal) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: '14px' }}
        >
          <div className="modal-header border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold text-dark">
              Postulación a Convocatoria
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              title="Cerrar modal"
            />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body px-4 py-3 d-flex flex-column gap-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="small text-muted fw-bold text-uppercase">
                  Convocatoria:
                </div>
                <div className="fw-semibold text-dark">{proposal.title}</div>
              </div>

              <div>
                <label className="form-label fw-semibold small text-secondary">
                  Conocimientos previos y motivación{' '}
                  <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Describí brevemente tu experiencia, materias afines aprobadas y herramientas que manejás..."
                  value={previousKnowledge}
                  onChange={(changeEvent) =>
                    onPreviousKnowledgeChange(changeEvent.target.value)
                  }
                />
                <div className="form-text small">
                  Tu identidad se asocia automáticamente a través de tu sesión activa.
                </div>
              </div>
            </div>
            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-unla-primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Enviando...' : 'Confirmar postulación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 3: Ver Postulantes (Docente / Admin)
// =========================================================================
export interface ApplicantsModalProps {
  show: boolean;
  proposal: PPPProposal | null;
  onClose: () => void;
  onApplicantAction: (
    proposalId: number | string,
    studentId: number | string,
    shouldAccept: boolean
  ) => void;
  onNavigateToApplicantsPage?: (proposalId: number | string) => void;
  actionLoading: boolean;
}

export const PPPApplicantsModal: React.FC<ApplicantsModalProps> = ({
  show,
  proposal,
  onClose,
  onApplicantAction,
  onNavigateToApplicantsPage,
  actionLoading,
}) => {
  if (!show || !proposal) return null;

  const applicantsList = proposal.applicants || [];

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: '14px' }}
        >
          <div className="modal-header border-bottom px-4 py-3">
            <div>
              <h5 className="modal-title fw-bold text-dark">
                Postulantes Recibidos ({applicantsList.length})
              </h5>
              <div className="small text-muted">{proposal.title}</div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              title="Cerrar modal"
            />
          </div>
          <div className="modal-body px-4 py-3">
            {onNavigateToApplicantsPage && (
              <div className="alert alert-primary d-flex align-items-center justify-content-between p-3 mb-3 rounded-3">
                <span className="small">
                  ¿Deseás gestionar las postulaciones con vista ampliada, métricas y filtros completos?
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary text-nowrap ms-2"
                  onClick={() => {
                    onClose();
                    onNavigateToApplicantsPage(proposal.id);
                  }}
                >
                  Abrir módulo completo ↗
                </button>
              </div>
            )}

            {applicantsList.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No hay alumnos postulados para esta convocatoria todavía.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {applicantsList.map(
                  (applicantItem: PPPApplicant, applicantIndex: number) => {
                    const studentFullName =
                      applicantItem.student?.fullName ||
                      applicantItem.student?.name ||
                      applicantItem.studentName ||
                      'Estudiante Postulado';
                    const studentEmailAddress =
                      applicantItem.student?.email ||
                      applicantItem.studentEmail ||
                      '';
                    const applicationIdNumber =
                      applicantItem.applicationId ||
                      applicantItem.id ||
                      applicantIndex + 1;
                    const applicantTargetId =
                      applicantItem.student?.id ||
                      applicantItem.studentId ||
                      applicantItem.applicationId ||
                      applicantItem.id ||
                      applicantIndex + 1;

                    const normalizedStatus = (applicantItem.status || '').toLowerCase();
                    const isPending =
                      normalizedStatus === 'pending' ||
                      normalizedStatus === 'pending_application' ||
                      !normalizedStatus;
                    const isAccepted =
                      normalizedStatus === 'accepted' ||
                      normalizedStatus === 'approved';
                    const isRejected =
                      normalizedStatus === 'rejected' ||
                      normalizedStatus === 'application_rejected';

                    return (
                      <div
                        key={applicantIndex}
                        className="p-3 border rounded-3 bg-white d-flex flex-column gap-2"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="badge bg-light text-secondary border me-2">
                              #{applicationIdNumber}
                            </span>
                            <strong className="text-dark">
                              {studentFullName}
                            </strong>
                            {studentEmailAddress && (
                              <span className="text-muted small ms-2">
                                ({studentEmailAddress})
                              </span>
                            )}
                          </div>
                          <span
                            className={`badge ${
                              isAccepted
                                ? 'bg-success-subtle text-success'
                                : isRejected
                                ? 'bg-danger-subtle text-danger'
                                : 'bg-warning-subtle text-warning'
                            } px-2.5 py-1 rounded-pill`}
                          >
                            {isAccepted
                              ? 'Aceptado'
                              : isRejected
                              ? 'Rechazado'
                              : 'Pendiente de evaluación'}
                          </span>
                        </div>

                        {applicantItem.previousKnowledge && (
                          <div className="small text-secondary bg-light p-2 rounded">
                            <strong>Conocimientos informados:</strong>{' '}
                            {applicantItem.previousKnowledge}
                          </div>
                        )}

                        {isPending && (
                          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={actionLoading}
                              onClick={() =>
                                onApplicantAction(
                                  proposal.id,
                                  applicantTargetId,
                                  false
                                )
                              }
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              disabled={actionLoading}
                              onClick={() =>
                                onApplicantAction(
                                  proposal.id,
                                  applicantTargetId,
                                  true
                                )
                              }
                            >
                              Aceptar estudiante
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
          <div className="modal-footer border-top px-4 py-2.5 d-flex justify-content-between">
            {onNavigateToApplicantsPage ? (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  onClose();
                  onNavigateToApplicantsPage(proposal.id);
                }}
              >
                Abrir módulo de postulaciones completo ↗
              </button>
            ) : <span />}
            <button
              type="button"
              className="btn btn-light btn-sm"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 4: Configurar Drive General (Docente / Admin)
// =========================================================================
export interface DriveModalProps {
  show: boolean;
  driveInput: string;
  onDriveInputChange: (newUrl: string) => void;
  onClose: () => void;
  onSubmit: (formSubmitEvent: React.FormEvent) => void;
  actionLoading: boolean;
}

export const PPPDriveModal: React.FC<DriveModalProps> = ({
  show,
  driveInput,
  onDriveInputChange,
  onClose,
  onSubmit,
  actionLoading,
}) => {
  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: '14px' }}
        >
          <div className="modal-header border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold text-dark">
              Drive Institucional de la Carrera
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              title="Cerrar modal"
            />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body px-4 py-3 d-flex flex-column gap-3">
              <p className="small text-muted m-0">
                Este enlace institucional es el que visualizan los alumnos para
                descargar los modelos de convenios oficiales, actas de compromiso y
                plantillas de documentación.
              </p>
              <div>
                <label className="form-label fw-semibold small text-secondary">
                  URL de Google Drive Institucional{' '}
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="url"
                  className="form-control"
                  required
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveInput}
                  onChange={(changeEvent) =>
                    onDriveInputChange(changeEvent.target.value)
                  }
                />
              </div>
            </div>
            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-light" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-unla-primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Actualizando...' : 'Guardar enlace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 5: Notificación y Confirmación de Postulación (Estudiante)
// =========================================================================
export interface AppliedFeedbackModalProps {
  show: boolean;
  onClose: () => void;
  feedback: {
    id: number | string;
    status: string;
    proposalTitle: string;
  } | null;
  onViewTramite: (tramiteId: number | string) => void;
}

export const PPPAppliedFeedbackModal: React.FC<AppliedFeedbackModalProps> = ({
  show,
  onClose,
  feedback,
  onViewTramite,
}) => {
  if (!show || !feedback) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: '14px' }}
        >
          <div className="modal-header border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold text-success">
              ¡Postulación Registrada!
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              title="Cerrar modal"
            />
          </div>
          <div className="modal-body px-4 py-3 d-flex flex-column gap-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="small text-muted fw-bold text-uppercase">
                Convocatoria:
              </div>
              <div className="fw-semibold text-dark">{feedback.proposalTitle}</div>
            </div>

            <div className="d-flex align-items-center justify-content-between p-3 bg-success-subtle border border-success-subtle rounded-3">
              <div>
                <div className="small text-success fw-bold">Número de Trámite / Postulación:</div>
                <div className="fs-3 fw-bold text-success">#{feedback.id}</div>
              </div>
              <span className="badge bg-warning text-dark px-3 py-1.5 rounded-pill">
                Pendiente de evaluación
              </span>
            </div>

            <div className="small text-muted">
              Conservá tu identificador <strong>#{feedback.id}</strong> para consultar el avance académico y documentación de tu postulación en cualquier momento.
            </div>
          </div>
          <div className="modal-footer border-top px-4 py-3">
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
            >
              Seguir explorando
            </button>
            <button
              type="button"
              className="btn-unla-primary"
              onClick={() => {
                onClose();
                onViewTramite(feedback.id);
              }}
            >
              Ver mi trámite / postulación →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

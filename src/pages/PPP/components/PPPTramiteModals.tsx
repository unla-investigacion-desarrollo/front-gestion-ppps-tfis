import React from 'react';
import { FaTriangleExclamation } from 'react-icons/fa6';

export interface PPPConfirmationDetails {
  title: string;
  question: string;
  description: string;
  confirmLabel: string;
  loadingLabel: string;
  confirmClass: string;
  iconClass: string;
  icon: React.ReactNode;
}

interface PPPActionConfirmModalProps {
  details: PPPConfirmationDetails | null;
  proposalTitle: string;
  expedienteId: string | number;
  actionLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PPPActionConfirmModal: React.FC<PPPActionConfirmModalProps> = ({
  details,
  proposalTitle,
  expedienteId,
  actionLoading,
  onClose,
  onConfirm,
}) => {
  if (!details) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ppp-action-confirm-title"
      aria-describedby="ppp-action-confirm-description"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-bottom px-4 py-3">
            <h5 id="ppp-action-confirm-title" className="modal-title fw-bold text-dark">
              {details.title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={actionLoading}
              aria-label="Cerrar"
            />
          </div>
          <div className="modal-body p-4">
            <div className="d-flex align-items-start gap-3">
              <div className={`ppp-action-confirm-icon ${details.iconClass}`} aria-hidden="true">
                {details.icon}
              </div>
              <div>
                <p className="mb-2 fw-semibold text-dark">{details.question}</p>
                <div className="ppp-delete-proposal-title mb-2">
                  {proposalTitle}
                  <span className="text-secondary fw-normal"> · Trámite #{expedienteId}</span>
                </div>
                <p id="ppp-action-confirm-description" className="mb-0 small text-secondary">
                  {details.description}
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer border-top px-4 py-3">
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={details.confirmClass}
              onClick={onConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? details.loadingLabel : details.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PPPAbandonModalProps {
  open: boolean;
  proposalTitle: string;
  expedienteId: string | number;
  actionLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PPPAbandonModal: React.FC<PPPAbandonModalProps> = ({
  open,
  proposalTitle,
  expedienteId,
  actionLoading,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="abandon-ppp-title"
      aria-describedby="abandon-ppp-description"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-bottom px-4 py-3">
            <h5 id="abandon-ppp-title" className="modal-title fw-bold text-dark">
              Dar de baja el trámite
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={actionLoading}
              aria-label="Cerrar"
            />
          </div>
          <div className="modal-body p-4">
            <div className="d-flex align-items-start gap-3">
              <div className="ppp-delete-warning-icon" aria-hidden="true">
                <FaTriangleExclamation size={20} />
              </div>
              <div>
                <p className="mb-2 fw-semibold text-dark">¿Querés dar de baja este trámite?</p>
                <div className="ppp-delete-proposal-title mb-2">
                  {proposalTitle}
                  <span className="text-secondary fw-normal"> · Trámite #{expedienteId}</span>
                </div>
                <p id="abandon-ppp-description" className="mb-0 small text-secondary">
                  El expediente se concluirá definitivamente y no podrás continuar con este trámite.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer border-top px-4 py-3">
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn ppp-delete-confirm-btn"
              onClick={onConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? 'Dando de baja...' : 'Sí, dar de baja'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PPPDriveModalProps {
  open: boolean;
  driveInput: string;
  actionLoading: boolean;
  onDriveInputChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PPPDriveModal: React.FC<PPPDriveModalProps> = ({
  open,
  driveInput,
  actionLoading,
  onDriveInputChange,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
          <div className="modal-header border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold text-dark">Drive Institucional de Convenios</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSubmit}>
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
                  onChange={(e) => onDriveInputChange(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-light" onClick={onClose}>
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
  );
};

interface PPPNotifyModalProps {
  open: boolean;
  notifyFile: File | null;
  actionLoading: boolean;
  onFileChange: (file: File | null) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PPPNotifyModal: React.FC<PPPNotifyModalProps> = ({
  open,
  notifyFile,
  actionLoading,
  onFileChange,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          <div className="modal-header border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold">Notificar entrega de documentación</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body p-4">
              <p className="text-muted small mb-3">
                Adjuntá el archivo PDF con la documentación.
              </p>
              <div>
                <label className="form-label fw-semibold small">
                  Archivo PDF <span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,application/pdf"
                  required
                  onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-light" disabled={actionLoading} onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-unla-primary"
                disabled={actionLoading || !notifyFile}
              >
                {actionLoading ? 'Enviando...' : 'Notificar envío'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface PPPObserveModalProps {
  open: boolean;
  observeFeedback: string;
  actionLoading: boolean;
  onFeedbackChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PPPObserveModal: React.FC<PPPObserveModalProps> = ({
  open,
  observeFeedback,
  actionLoading,
  onFeedbackChange,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          <div className="modal-header border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold">Marcar con observaciones</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body p-4">
              <p className="text-muted small mb-3">
                Indicá las observaciones o correcciones que debe realizar el estudiante antes de reenviar la documentación.
              </p>
              <div>
                <label className="form-label fw-semibold small">
                  Observación / Feedback <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Ej: Por favor, corregir y reenviar."
                  value={observeFeedback}
                  onChange={(e) => onFeedbackChange(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-light" disabled={actionLoading} onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-unla-primary"
                disabled={actionLoading || !observeFeedback.trim()}
              >
                {actionLoading ? 'Enviando...' : 'Enviar observaciones'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

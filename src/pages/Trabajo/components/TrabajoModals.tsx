import React from 'react';

export interface QualificationHelper {
  label: string;
  color: string;
  status: string;
}

interface TrabajoQualifyModalProps {
  open: boolean;
  qualificationInput: string;
  onQualificationChange: (value: string) => void;
  qualificationHelper: QualificationHelper | null;
  actionLoading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TrabajoQualifyModal: React.FC<TrabajoQualifyModalProps> = ({
  open,
  qualificationInput,
  onQualificationChange,
  qualificationHelper,
  actionLoading,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div className="trabajo-modal-backdrop">
      <div className="trabajo-modal-content">
        <div className="trabajo-modal-header">
          <h3>Calificación</h3>
          <button type="button" className="trabajo-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
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
                onChange={(e) => onQualificationChange(e.target.value)}
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
              onClick={onClose}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-trabajo-primary"
              disabled={actionLoading || !qualificationHelper || qualificationHelper.status === 'invalid'}
            >
              {actionLoading ? 'Guardando...' : 'Guardar calificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TrabajoLinksModalProps {
  open: boolean;
  isEditingLinks: boolean;
  docUrlInput: string;
  driveUrlInput: string;
  urlErrors: { doc?: string; drive?: string };
  actionLoading: boolean;
  onDocUrlChange: (value: string) => void;
  onDriveUrlChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TrabajoLinksModal: React.FC<TrabajoLinksModalProps> = ({
  open,
  isEditingLinks,
  docUrlInput,
  driveUrlInput,
  urlErrors,
  actionLoading,
  onDocUrlChange,
  onDriveUrlChange,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div className="trabajo-modal-backdrop">
      <div className="trabajo-modal-content">
        <div className="trabajo-modal-header">
          <h3>{isEditingLinks ? 'Modificar Enlaces de Entrega' : 'Registrar Entrega de Proyecto'}</h3>
          <button type="button" className="trabajo-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="trabajo-modal-body">
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
                onChange={(e) => onDocUrlChange(e.target.value)}
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
                onChange={(e) => onDriveUrlChange(e.target.value)}
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
              onClick={onClose}
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
  );
};

interface TrabajoConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  actionLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const TrabajoConfirmModal: React.FC<TrabajoConfirmModalProps> = ({
  open,
  title,
  message,
  confirmText,
  actionLoading,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="trabajo-modal-backdrop">
      <div className="trabajo-modal-content">
        <div className="trabajo-modal-header">
          <h3>{title}</h3>
          <button type="button" className="trabajo-modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="trabajo-modal-body">
          <p className="mb-0 text-secondary" style={{ fontSize: '15px', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
        <div className="trabajo-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={actionLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-trabajo-primary"
            onClick={onConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

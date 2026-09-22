import React from 'react';
import { FaCircleInfo, FaCheck, FaGraduationCap } from 'react-icons/fa6';

interface RegisterTutoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string | number;
    titulo: string;
    workId?: string | number;
    studentName?: string;
  } | null;
  onConfirm: (data: {
    projectId: string | number;
    workId: string | number;
    studentName?: string;
  }) => void | Promise<void>;
  loading?: boolean;
}

export const RegisterTutoringModal: React.FC<RegisterTutoringModalProps> = ({
  isOpen,
  onClose,
  project,
  onConfirm,
  loading = false,
}) => {
  if (!isOpen || !project) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project.workId) return;
    onConfirm({
      projectId: project.id,
      workId: project.workId,
      studentName: project.studentName,
    });
  };

  return (
    <div className="teacher-modal-backdrop" onClick={loading ? undefined : onClose}>
      <div className="teacher-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="teacher-modal-header">
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: 'var(--unla-wine, #8b1d24)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaGraduationCap size={16} />
            </div>
            <h5 className="teacher-modal-title mb-0">Confirmar Tutoría</h5>
          </div>
          <button
            type="button"
            className="teacher-modal-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleConfirm}>
          <div className="teacher-modal-body">
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold text-uppercase">
                Proyecto
              </label>
              <div className="fw-bold text-dark">{project.titulo}</div>
              {project.studentName && project.studentName !== 'Sin asignar' && (
                <div className="text-secondary small mt-1">
                  Estudiante / Equipo: <span className="fw-medium text-dark">{project.studentName}</span>
                </div>
              )}
            </div>

            <div className="alert alert-light border border-secondary-subtle rounded-3 p-3 mb-3 d-flex align-items-start gap-2.5">
              <FaCircleInfo className="text-primary mt-0.5 flex-shrink-0" size={17} />
              <div className="small text-secondary lh-base">
                ¿Confirmás que se llevó a cabo la sesión de tutoría y que atendiste al estudiante de este proyecto?
                <br />
                Al confirmar, el sistema <strong>dará por atendida la solicitud de tutoría pendiente</strong>,
                registrando tu usuario y la fecha y hora actual como última tutoría realizada.
              </div>
            </div>

            <div className="text-muted small">
              <em>Nota: Esta acción solo confirma la atención de la tutoría; no califica ni aprueba la entrega del proyecto.</em>
            </div>
          </div>

          <div className="teacher-modal-footer">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm teacher-btn-register-tutoria d-inline-flex align-items-center gap-1.5"
              disabled={loading || !project.workId}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Confirmando...</span>
                </>
              ) : (
                <>
                  <FaCheck size={13} />
                  <span>Confirmar tutoría</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

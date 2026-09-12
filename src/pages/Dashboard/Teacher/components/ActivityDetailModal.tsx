import React from 'react';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: {
    fecha: string;
    tipo: string;
    detalle: string;
    descripcion?: string;
    estudiante?: string;
  } | null;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  onClose,
  activity,
}) => {
  if (!isOpen || !activity) return null;

  return (
    <div className="teacher-modal-backdrop" onClick={onClose}>
      <div className="teacher-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="teacher-modal-header">
          <h5 className="teacher-modal-title">Detalle de Actividad</h5>
          <button type="button" className="teacher-modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="teacher-modal-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span
              className={`teacher-badge-${activity.tipo === 'PPP' ? 'interna' : activity.tipo === 'Entrega' ? 'externa' : 'tfi'}`}
            >
              {activity.tipo}
            </span>
            <span className="text-muted small">Programado para: <strong>{activity.fecha}</strong></span>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small fw-semibold">ACTIVIDAD / TAREA</label>
            <div className="fw-bold text-dark fs-6">{activity.detalle}</div>
          </div>

          {activity.estudiante && (
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">ESTUDIANTE INVOLUCRADO</label>
              <div className="text-secondary">{activity.estudiante}</div>
            </div>
          )}

          <div className="p-3 bg-light rounded border border-light">
            <div className="small text-muted mb-1 fw-semibold">ESTADO DEL PROCESO</div>
            <div className="small text-dark">
              {activity.tipo === 'Entrega'
                ? 'La entrega requiere revisión de avances y devolución pedagógica al equipo.'
                : activity.tipo === 'PPP'
                ? 'El expediente se encuentra listo para verificación de documentación y firma.'
                : 'Solicitud pendiente de aprobación docente para incorporación.'}
            </div>
          </div>
        </div>
        <div className="teacher-modal-footer">
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

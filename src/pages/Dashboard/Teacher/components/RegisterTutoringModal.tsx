import React, { useState } from 'react';

interface RegisterTutoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string | number;
    titulo: string;
    students?: any[];
  } | null;
  onConfirm: (data: { projectId: string | number; studentName?: string; notas: string; fecha: string }) => void;
}

export const RegisterTutoringModal: React.FC<RegisterTutoringModalProps> = ({
  isOpen,
  onClose,
  project,
  onConfirm,
}) => {
  const [studentName, setStudentName] = useState('');
  const [notas, setNotas] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 16));

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      projectId: project.id,
      studentName: studentName || 'Equipo del proyecto',
      notas,
      fecha,
    });
    setNotas('');
    onClose();
  };

  return (
    <div className="teacher-modal-backdrop" onClick={onClose}>
      <div className="teacher-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="teacher-modal-header">
          <h5 className="teacher-modal-title">Registrar Tutoría Realizada</h5>
          <button type="button" className="teacher-modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="teacher-modal-body">
            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold">PROYECTO</label>
              <div className="fw-bold text-dark">{project.titulo}</div>
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold" htmlFor="tutoringStudent">
                ESTUDIANTE / ASISTENTES
              </label>
              <input
                id="tutoringStudent"
                type="text"
                className="form-control"
                placeholder="Ej. Ana García, Lucas Fernández..."
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-muted small fw-semibold" htmlFor="tutoringDate">
                FECHA Y HORA DE LA TUTORÍA
              </label>
              <input
                id="tutoringDate"
                type="datetime-local"
                className="form-control"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>

            <div className="mb-2">
              <label className="form-label text-muted small fw-semibold" htmlFor="tutoringNotes">
                NOTAS / ACUERDOS DE LA SESIÓN
              </label>
              <textarea
                id="tutoringNotes"
                className="form-control"
                rows={3}
                placeholder="Describí los temas abordados, dudas despejadas y próximos pasos acordados con los estudiantes..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
          </div>
          <div className="teacher-modal-footer">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-sm teacher-btn-register-tutoria">
              Confirmar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

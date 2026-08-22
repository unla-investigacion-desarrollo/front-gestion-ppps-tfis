import React, { useState } from 'react';
import { Project } from '../../../../redux/slices/projectsSlice';
import { showToast } from '../../../utils/toast';

// --- INTERFAZ DE ACTIVIDAD ---
export interface Activity {
  id: string;
  projectId: string;
  type: 'message' | 'delivery' | 'teacher_note';
  by: string;
  at: string;
  data?: any;
}

// ==========================================
// 1. MODAL DE ACTIVIDAD Y MENSAJES
// ==========================================
interface ActivityModalProps {
  project: Project;
  currentUserId: string;
  users: any[];
  onClose: () => void;
  readActivity: () => Record<string, Activity[]>;
  appendActivity: (entry: Activity) => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  project,
  currentUserId,
  users,
  onClose,
  readActivity,
  appendActivity,
}) => {
  const [messageText, setMessageText] = useState('');

  // Obtiene el nombre completo del remitente de la actividad
  const getUserDisplayName = (userId: string) => {
    if (String(userId) === String(currentUserId)) return 'Yo';
    const userFound = users.find((u) => String(u.id) === String(userId));
    return userFound ? ([userFound.nombre, userFound.apellido].filter(Boolean).join(' ') || userFound.email) : userId;
  };

  // Maneja el envío de un nuevo mensaje de actividad
  const handleSubmitMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanText = messageText.trim();
    if (!cleanText) return;

    appendActivity({
      id: `act-${Date.now()}`,
      projectId: project.id,
      type: 'message',
      by: String(currentUserId),
      at: new Date().toISOString(),
      data: { text: cleanText },
    });

    setMessageText('');
  };

  const activityMap = readActivity();
  const rawActivities = activityMap[project.id] || [];
  // Ordena las actividades cronológicamente (más recientes primero)
  const sortedActivities = [...rawActivities].sort((a, b) => (b.at || '').localeCompare(a.at || ''));

  return (
    <>
      <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content custom-modal-content">
            <div className="modal-header custom-modal-header">
              <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary, #64001d)' }}>
                Actividad del proyecto: {project.titulo}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body custom-modal-body">
              {/* Formulario para agregar un mensaje */}
              <form className="unla-form mb-4" onSubmit={handleSubmitMessage}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="activityMsgBox" style={{ fontWeight: 500 }}>
                    Enviar mensaje o nota al equipo de proyecto
                  </label>
                  <textarea
                    id="activityMsgBox"
                    className="form-control"
                    rows={3}
                    placeholder="Escribí un mensaje para el equipo..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                </div>
                <div className="text-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--unla-primary, #64001d)', border: 'none' }}
                    disabled={!messageText.trim()}
                  >
                    Enviar Mensaje
                  </button>
                </div>
              </form>

              {/* Historial de la línea de tiempo de la actividad */}
              <h6 className="mb-3" style={{ fontWeight: 600 }}>Historial de actividad</h6>
              {sortedActivities.length === 0 ? (
                <div className="text-muted text-center py-4">Aún no hay actividad registrada en este proyecto.</div>
              ) : (
                <ul className="activity-timeline">
                  {sortedActivities.map((act) => (
                    <li key={act.id} className="activity-item">
                      <div className="activity-meta">
                        {new Date(act.at).toLocaleString()} • {getUserDisplayName(act.by)}
                      </div>
                      <div className="activity-content">
                        {act.type === 'message' && <div>{act.data?.text}</div>}
                        {act.type === 'delivery' && (
                          <div className="activity-delivery-box">
                            <strong>Entrega de archivo:</strong>{' '}
                            {act.data?.filename ? (
                              <span className="text-primary" style={{ textDecoration: 'underline' }}>
                                {act.data.filename} ({((act.data.filesize || 0) / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            ) : (
                              <span>{act.data?.link || 'sin enlace adjunto'}</span>
                            )}
                            {act.data?.note && <div className="mt-1 text-muted small">Nota: "{act.data.note}"</div>}
                          </div>
                        )}
                        {act.type === 'teacher_note' && (
                          <div className="activity-delivery-box" style={{ borderLeft: '3px solid #15803d' }}>
                            <strong>Observación del docente:</strong> {act.data?.text || '—'}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-footer custom-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="custom-modal-backdrop" />
    </>
  );
};

// ==========================================
// 2. MODAL DE ASIGNAR ALUMNO
// ==========================================
interface AssignStudentModalProps {
  project: Project;
  students: any[];
  onClose: () => void;
  onAssign: (studentId: string) => Promise<void>;
}

export const AssignStudentModal: React.FC<AssignStudentModalProps> = ({
  project,
  students,
  onClose,
  onAssign,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAssigned = project.students.length;
  const isLimitReached = totalAssigned >= 5;

  const handleSubmitAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStudentId || isLimitReached) return;

    setIsSubmitting(true);
    try {
      await onAssign(selectedStudentId);
      onClose();
    } catch (error) {
      showToast('Ocurrió un error al intentar asignar el alumno.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content custom-modal-content">
            <div className="modal-header custom-modal-header">
              <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary, #64001d)' }}>
                Asignar Alumno
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <form onSubmit={handleSubmitAssign}>
              <div className="modal-body custom-modal-body d-flex flex-column gap-3">
                <div>
                  <strong>Proyecto:</strong> {project.titulo}
                </div>
                <div>
                  <strong>Alumnos asignados actualmente:</strong> {totalAssigned} de 5
                </div>

                {isLimitReached ? (
                  <div className="alert alert-warning py-2 mb-0 small">
                    ⚠️ Se alcanzó el límite máximo de 5 alumnos en este proyecto. No es posible asignar más estudiantes.
                  </div>
                ) : (
                  <div>
                    <label className="form-label" style={{ fontWeight: 500 }} htmlFor="studentSelectBox">
                      Seleccionar Estudiante
                    </label>
                    <select
                      id="studentSelectBox"
                      className="form-select"
                      required
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                    >
                      <option value="">Seleccioná estudiante...</option>
                      {students.map((stud) => (
                        <option key={stud.id} value={stud.id}>
                          {[stud.nombre, stud.apellido].filter(Boolean).join(' ') || stud.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer custom-modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--unla-primary, #64001d)', border: 'none' }}
                  disabled={isLimitReached || !selectedStudentId || isSubmitting}
                >
                  {isSubmitting ? 'Asignando...' : 'Asignar Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="custom-modal-backdrop" />
    </>
  );
};

// ==========================================
// 3. MODAL DE AGREGAR CO-DOCENTE
// ==========================================
interface AddCoTeacherModalProps {
  project: Project;
  teachers: any[];
  onClose: () => void;
  onAdd: (teacherId: string) => Promise<void>;
}

export const AddCoTeacherModal: React.FC<AddCoTeacherModalProps> = ({
  project,
  teachers,
  onClose,
  onAdd,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTeacherId) return;

    setIsSubmitting(true);
    try {
      await onAdd(selectedTeacherId);
      onClose();
    } catch (error) {
      showToast('Ocurrió un error al intentar agregar el co-docente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content custom-modal-content">
            <div className="modal-header custom-modal-header">
              <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary, #64001d)' }}>
                Agregar Co-docente Colaborador
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <form onSubmit={handleSubmitAdd}>
              <div className="modal-body custom-modal-body d-flex flex-column gap-3">
                <div>
                  <strong>Proyecto:</strong> {project.titulo}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 500 }} htmlFor="teacherSelectBox">
                    Seleccionar Docente
                  </label>
                  <select
                    id="teacherSelectBox"
                    className="form-select"
                    required
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                  >
                    <option value="">Seleccioná docente...</option>
                    {teachers.map((teach) => (
                      <option key={teach.id} value={teach.id}>
                        {[teach.nombre, teach.apellido].filter(Boolean).join(' ') || teach.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer custom-modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--unla-primary, #64001d)', border: 'none' }}
                  disabled={!selectedTeacherId || isSubmitting}
                >
                  {isSubmitting ? 'Agregando...' : 'Agregar Co-docente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="custom-modal-backdrop" />
    </>
  );
};

// ==========================================
// 4. MODAL DE EDITAR DETALLES DEL PROYECTO
// ==========================================
interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSave: (titulo: string, descripcion: string, categoria: string) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  onClose,
  onSave,
}) => {
  const [formValues, setFormValues] = useState({
    titulo: project.titulo,
    descripcion: project.descripcion,
    categoria: project.categoria || '',
  });
  const [formErrors, setFormErrors] = useState<{ titulo?: string; descripcion?: string }>({});

  // Realiza las validaciones de campos antes del envío
  const validateForm = () => {
    const errors: { titulo?: string; descripcion?: string } = {};
    if (!formValues.titulo.trim()) {
      errors.titulo = 'El título es obligatorio';
    }
    if (!formValues.descripcion.trim()) {
      errors.descripcion = 'La descripción es obligatoria';
    } else if (formValues.descripcion.trim().length < 20) {
      errors.descripcion = 'La descripción debe tener al menos 20 caracteres';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitEdit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    onSave(formValues.titulo.trim(), formValues.descripcion.trim(), formValues.categoria);
    onClose();
  };

  return (
    <>
      <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content custom-modal-content">
            <div className="modal-header custom-modal-header">
              <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary, #64001d)' }}>
                Editar Proyecto
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body custom-modal-body d-flex flex-column gap-3">
                {/* Campo: Título */}
                <div>
                  <label className="form-label" style={{ fontWeight: 500 }} htmlFor="editTitleInput">
                    Título
                  </label>
                  <input
                    id="editTitleInput"
                    type="text"
                    className={`form-control ${formErrors.titulo ? 'is-invalid' : ''}`}
                    required
                    value={formValues.titulo}
                    onChange={(e) => setFormValues({ ...formValues, titulo: e.target.value })}
                  />
                  {formErrors.titulo && <div className="invalid-feedback">{formErrors.titulo}</div>}
                </div>

                {/* Campo: Categoría */}
                <div>
                  <label className="form-label" style={{ fontWeight: 500 }} htmlFor="editCategorySelect">
                    Categoría
                  </label>
                  <select
                    id="editCategorySelect"
                    className="form-select"
                    value={formValues.categoria}
                    onChange={(e) => setFormValues({ ...formValues, categoria: e.target.value })}
                  >
                    <option value="">Categoría (opcional)</option>
                    <option value="desarrollo">Desarrollo</option>
                    <option value="investigacion">Investigación</option>
                    <option value="extension">Extensión</option>
                  </select>
                </div>

                {/* Campo: Descripción */}
                <div>
                  <label className="form-label" style={{ fontWeight: 500 }} htmlFor="editDescTextarea">
                    Descripción
                  </label>
                  <textarea
                    id="editDescTextarea"
                    className={`form-control ${formErrors.descripcion ? 'is-invalid' : ''}`}
                    rows={4}
                    required
                    placeholder="Escribí una descripción detallada (mínimo 20 caracteres)"
                    value={formValues.descripcion}
                    onChange={(e) => setFormValues({ ...formValues, descripcion: e.target.value })}
                  />
                  {formErrors.descripcion && <div className="invalid-feedback">{formErrors.descripcion}</div>}
                </div>
              </div>

              <div className="modal-footer custom-modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--unla-primary, #64001d)', border: 'none' }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="custom-modal-backdrop" />
    </>
  );
};

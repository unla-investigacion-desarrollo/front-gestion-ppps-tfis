import React, { useEffect, useState } from 'react';
import { showToast } from '../../../../utils/toast';

interface CreateTeacherModalProps {
  isOpen: boolean;
  role?: 'DOCENTE' | 'ADMIN';
  users?: Array<{ email?: string; dni?: string }>;
  onClose: () => void;
  onSubmit: (formData: {
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    password: string;
    specialization?: string;
    isTutor?: boolean;
    rol: 'DOCENTE' | 'ADMIN';
  }) => Promise<boolean>;
}

const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({
  isOpen,
  role = 'DOCENTE',
  users = [],
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    password: '',
    specialization: '',
    isTutor: false,
    rol: role,
  });
  const [emailInUse, setEmailInUse] = useState(false);
  const [dniInUse, setDniInUse] = useState(false);

  useEffect(() => {
    const rawUsers = localStorage.getItem('users');
    let storedUsers: Array<{ email?: string; dni?: string }> = [];
    try {
      storedUsers = rawUsers ? JSON.parse(rawUsers) : [];
    } catch {
      storedUsers = [];
    }

    const allUsers = [...users, ...storedUsers];
    setEmailInUse(
      !!form.email.trim() && allUsers.some(
        (user) => (user.email || '').trim().toLowerCase() === form.email.trim().toLowerCase(),
      ),
    );
    setDniInUse(
      !!form.dni && allUsers.some((user) => user.dni === form.dni),
    );
  }, [form.email, form.dni, users]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (emailInUse) {
      showToast('El email ya está siendo utilizado por otra persona', 'error');
      return;
    }
    if (dniInUse) {
      showToast('El DNI ya está siendo utilizado por otra persona', 'error');
      return;
    }

    const created = await onSubmit({ ...form, rol: form.rol });
    if (created) setForm({
      nombre: '',
      apellido: '',
      dni: '',
      email: '',
      password: '',
      specialization: '',
      isTutor: false,
      rol: form.rol,
    });
  };

  return (
    <>
      <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content custom-modal-content">
            <div className="modal-header custom-modal-header">
              <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary)' }}>
                Crear {form.rol === 'DOCENTE' ? 'Docente' : 'Administrador'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body custom-modal-body d-flex flex-column gap-3">
                <div>
                  <label className="form-label" style={{ fontWeight: 500 }}>Tipo de usuario</label>
                  <select
                    className="form-select"
                    value={form.rol}
                    onChange={(e) => setForm(prev => ({ ...prev, rol: e.target.value as 'DOCENTE' | 'ADMIN' }))}
                  >
                    <option value="DOCENTE">Docente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: 500 }}>Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={form.nombre}
                      onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: 500 }}>Apellido</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={form.apellido}
                      onChange={(e) => setForm(prev => ({ ...prev, apellido: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="row g-2">
                  <div className={form.rol === 'DOCENTE' ? 'col-md-6' : 'col-12'}>
                    <label className="form-label" style={{ fontWeight: 500 }}>DNI</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      maxLength={8}
                      value={form.dni}
                      onChange={(e) => setForm(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, '') }))}
                    />
                    {dniInUse && <div className="form-text text-danger">Este DNI ya está siendo utilizado por otra persona.</div>}
                  </div>
                  {form.rol === 'DOCENTE' && (
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: 500 }}>Especialización</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Ej: Ingeniería de Software"
                        value={form.specialization}
                        onChange={(e) => setForm(prev => ({ ...prev, specialization: e.target.value }))}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 500 }}>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                  {emailInUse && <div className="form-text text-danger">Este email ya está siendo utilizado por otra persona.</div>}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 500 }}>Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                {form.rol === 'DOCENTE' && <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="isTutorSwitch"
                    checked={form.isTutor}
                    onChange={(e) => setForm(prev => ({ ...prev, isTutor: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="isTutorSwitch" style={{ fontWeight: 500 }}>
                    ¿Es Tutor de Proyectos?
                  </label>
                </div>}
              </div>
              <div className="modal-footer custom-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--unla-primary)', border: 'none' }}
                >
                  Crear {form.rol === 'DOCENTE' ? 'Docente' : 'Administrador'}
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

export default CreateTeacherModal;

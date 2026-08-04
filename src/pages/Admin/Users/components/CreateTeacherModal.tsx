import React, { useState } from 'react';

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    password: string;
    specialization: string;
    isTutor: boolean;
  }) => Promise<void>;
}

const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({
  isOpen,
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
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    await onSubmit(form);
    setForm({
      nombre: '',
      apellido: '',
      dni: '',
      email: '',
      password: '',
      specialization: '',
      isTutor: false,
    });
  };

  return (
    <>
      <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content custom-modal-content">
            <div className="modal-header custom-modal-header">
              <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary)' }}>
                Crear Docente
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
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: 500 }}>DNI</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      maxLength={8}
                      value={form.dni}
                      onChange={(e) => setForm(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, '') }))}
                    />
                  </div>
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

                <div className="form-check form-switch mt-2">
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
                </div>
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
                  Crear Docente
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

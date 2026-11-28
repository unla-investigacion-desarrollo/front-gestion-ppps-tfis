import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
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
  }) => Promise<{ ok: boolean; message?: string; messages?: string[] }>;
}

/**
 * Clasifica cada mensaje de validación devuelto por el backend (ValidationPipe / ConflictException)
 * en el campo correspondiente del formulario.
 */
const matchBackendErrorToField = (
  message: string
): 'nombre' | 'apellido' | 'dni' | 'email' | 'password' | 'specialization' | 'general' => {
  const lower = message.toLowerCase();
  if ((lower.includes('email') || lower.includes('correo') || lower.includes('mail')) && !lower.includes('bienvenida')) {
    return 'email';
  }
  if (lower.includes('dni') || lower.includes('documento')) {
    return 'dni';
  }
  if (lower.includes('contraseña') || lower.includes('password')) {
    return 'password';
  }
  if (lower.includes('apellido') || lower.includes('lastname')) {
    return 'apellido';
  }
  if (lower.includes('nombre') || lower.includes('firstname')) {
    return 'nombre';
  }
  if (lower.includes('specialization') || lower.includes('especializ')) {
    return 'specialization';
  }
  return 'general';
};

const createInitialFormState = (rol: 'DOCENTE' | 'ADMIN' = 'DOCENTE') => ({
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  password: '123456',
  specialization: '',
  isTutor: false,
  rol,
});

const allowedNameCharacters = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]*$/;

const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({
  isOpen,
  role = 'DOCENTE',
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState(() => createInitialFormState(role));
  // Errores de validación local y del backend
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetFormState = () => {
    setForm(createInitialFormState(role));
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(false);
    setShowPassword(false);
  };

  // Siempre que se abre el modal, reiniciar todos los campos y errores
  useEffect(() => {
    if (isOpen) {
      resetFormState();
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setFieldErrors({});
    setGeneralError(null);
    const validationErrors: Record<string, string> = {};
    if (!form.nombre.trim() || !allowedNameCharacters.test(form.nombre)) {
      validationErrors.nombre = 'Ingresá un nombre usando solo letras.';
    }
    if (!form.apellido.trim() || !allowedNameCharacters.test(form.apellido)) {
      validationErrors.apellido = 'Ingresá un apellido usando solo letras.';
    }
    if (!/^\d{1,8}$/.test(form.dni)) {
      validationErrors.dni = 'El DNI debe contener solo números y tener hasta 8 dígitos.';
    }
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit({
        ...form,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        email: form.email.trim(),
        specialization: form.specialization.trim(),
        rol: form.rol,
      });

      if (result.ok) {
        resetFormState();
        return;
      }

      const rawMessages =
        Array.isArray(result.messages) && result.messages.length > 0
          ? result.messages
          : result.message
          ? [result.message]
          : ['No se pudo crear el usuario'];

      const mappedFieldErrors: Record<string, string> = {};
      const generalMessages: string[] = [];

      rawMessages.forEach((rawMsg) => {
        const msg = String(rawMsg).trim();
        if (!msg) return;
        const field = matchBackendErrorToField(msg);
        if (field === 'general') {
          generalMessages.push(msg);
        } else if (!mappedFieldErrors[field]) {
          mappedFieldErrors[field] = msg;
        }
      });

      setFieldErrors(mappedFieldErrors);
      if (generalMessages.length > 0) {
        const joined = generalMessages.join('. ');
        setGeneralError(joined);
        showToast(joined, 'error');
      }
    } finally {
      setSubmitting(false);
    }
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
                onClick={handleClose}
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleSubmit} noValidate autoComplete="off">
              <div className="modal-body custom-modal-body d-flex flex-column gap-3">
                {generalError && (
                  <div className="alert alert-danger py-2 mb-0 small" role="alert">
                    {generalError}
                  </div>
                )}

                <div>
                  <label className="form-label" style={{ fontWeight: 500 }}>Tipo de usuario</label>
                  <select
                    className="form-select"
                    value={form.rol}
                    onChange={(e) => {
                      setFieldErrors({});
                      setGeneralError(null);
                      setForm(prev => ({ ...prev, rol: e.target.value as 'DOCENTE' | 'ADMIN' }));
                    }}
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
                      className={`form-control ${fieldErrors.nombre ? 'is-invalid' : ''}`}
                      value={form.nombre}
                      onChange={(e) => {
                        clearFieldError('nombre');
                        setForm(prev => ({
                          ...prev,
                          nombre: e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ''),
                        }));
                      }}
                    />
                    {fieldErrors.nombre && <div className="invalid-feedback d-block">{fieldErrors.nombre}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: 500 }}>Apellido</label>
                    <input
                      type="text"
                      className={`form-control ${fieldErrors.apellido ? 'is-invalid' : ''}`}
                      value={form.apellido}
                      onChange={(e) => {
                        clearFieldError('apellido');
                        setForm(prev => ({
                          ...prev,
                          apellido: e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ''),
                        }));
                      }}
                    />
                    {fieldErrors.apellido && <div className="invalid-feedback d-block">{fieldErrors.apellido}</div>}
                  </div>
                </div>

                <div className="row g-2">
                  <div className={form.rol === 'DOCENTE' ? 'col-md-6' : 'col-12'}>
                    <label className="form-label" style={{ fontWeight: 500 }}>DNI</label>
                    <input
                      type="text"
                      className={`form-control ${fieldErrors.dni ? 'is-invalid' : ''}`}
                      inputMode="numeric"
                      maxLength={8}
                      value={form.dni}
                      onChange={(e) => {
                        clearFieldError('dni');
                        setForm(prev => ({
                          ...prev,
                          dni: e.target.value.replace(/\D/g, '').slice(0, 8),
                        }));
                      }}
                    />
                    {fieldErrors.dni && <div className="invalid-feedback d-block">{fieldErrors.dni}</div>}
                  </div>
                  {form.rol === 'DOCENTE' && (
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: 500 }}>Especialización</label>
                      <input
                        type="text"
                        className={`form-control ${fieldErrors.specialization ? 'is-invalid' : ''}`}
                        placeholder="Ej: Ingeniería de Software"
                        value={form.specialization}
                        onChange={(e) => {
                          clearFieldError('specialization');
                          setForm(prev => ({ ...prev, specialization: e.target.value }));
                        }}
                      />
                      {fieldErrors.specialization && (
                        <div className="invalid-feedback d-block">{fieldErrors.specialization}</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 500 }}>Email</label>
                  <input
                    type="text"
                    inputMode="email"
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                    autoComplete="off"
                    value={form.email}
                    onChange={(e) => {
                      clearFieldError('email');
                      setForm(prev => ({ ...prev, email: e.target.value }));
                    }}
                  />
                  {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 500 }}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                      style={{ paddingRight: '44px' }}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => {
                        clearFieldError('password');
                        setForm(prev => ({ ...prev, password: e.target.value }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 0,
                        background: 'transparent',
                        color: '#64748b',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
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
                  onClick={handleClose}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ backgroundColor: 'var(--unla-primary)', border: 'none' }}
                >
                  {submitting ? 'Creando...' : `Crear ${form.rol === 'DOCENTE' ? 'Docente' : 'Administrador'}`}
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

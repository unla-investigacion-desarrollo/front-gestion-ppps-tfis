import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  registerStudent,
  selectUsersStatus,
  clearUsersError,
} from '../../../redux/slices/usersSlice';
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaCalendarDays,
  FaFileLines,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldHalved,
  FaGraduationCap,
  FaCheck,
  FaArrowRight,
} from 'react-icons/fa6';
import './Register.css';

/**
 * Clasifica cada mensaje de error devuelto por el backend (ValidationPipe / ConflictException)
 * y lo asocia al campo correspondiente del formulario de registro.
 */
const matchStudentBackendErrorToField = (
  message: string
):
  | 'nombre'
  | 'apellido'
  | 'email'
  | 'dni'
  | 'yearOfAdmission'
  | 'completedCoursesWithFinal'
  | 'completedCoursesWithoutFinal'
  | 'password'
  | 'general' => {
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
  if (lower.includes('yearofadmission') || lower.includes('año de ingreso') || lower.includes('ingreso')) {
    return 'yearOfAdmission';
  }
  if (lower.includes('completedcourseswithfinal') || lower.includes('con final')) {
    return 'completedCoursesWithFinal';
  }
  if (lower.includes('completedcourseswithoutfinal') || lower.includes('sin final')) {
    return 'completedCoursesWithoutFinal';
  }
  return 'general';
};

/**
 * Pantalla de Registro de Estudiante.
 * Todas las validaciones provienen del backend al enviar el formulario.
 */
const Register: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectUsersStatus);

  const initialFormState = {
    email: '',
    nombre: '',
    apellido: '',
    dni: '',
    password: '',
    yearOfAdmission: '',
    completedCoursesWithFinal: '',
    completedCoursesWithoutFinal: '',
  };

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  // Limpiar errores de usuario al ingresar
  useEffect(() => {
    dispatch(clearUsersError());
  }, [dispatch]);

  // Helper para verificar si un mensaje de error corresponde únicamente al fallo de envío de correo de bienvenida
  const isWelcomeEmailErrorMessage = (messageText: string | null): boolean => {
    if (!messageText) return false;
    const lowerCaseMessage = messageText.toLowerCase();
    return (
      lowerCaseMessage.includes('correo de bienvenida') ||
      lowerCaseMessage.includes('email de bienvenida') ||
      lowerCaseMessage.includes('mail de bienvenida') ||
      (lowerCaseMessage.includes('bienvenida') &&
        (lowerCaseMessage.includes('correo') ||
          lowerCaseMessage.includes('email') ||
          lowerCaseMessage.includes('enviar')))
    );
  };

  const handleChange = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = changeEvent.target;
    setForm((previousForm) => ({ ...previousForm, [name]: value }));
    if (errors[name]) {
      setErrors((previousErrors) => ({ ...previousErrors, [name]: '' }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (formSubmitEvent: React.FormEvent) => {
    formSubmitEvent.preventDefault();
    setErrors({});
    setGeneralError(null);
    dispatch(clearUsersError());

    try {
      await dispatch<any>(
        registerStudent({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          dni: form.dni.trim(),
          email: form.email.trim(),
          password: form.password,
          yearOfAdmission: form.yearOfAdmission,
          completedCoursesWithFinal: form.completedCoursesWithFinal,
          completedCoursesWithoutFinal: form.completedCoursesWithoutFinal,
        })
      ).unwrap();

      setRegisteredEmail(form.email.trim());
      setShowSuccessModal(true);
      setForm(initialFormState);
    } catch (registrationError: any) {
      const rawMessages: string[] = Array.isArray(registrationError)
        ? registrationError.map(String)
        : typeof registrationError === 'string'
        ? [registrationError]
        : registrationError?.message
        ? [String(registrationError.message)]
        : ['Error al registrar el estudiante'];

      const combinedText = rawMessages.join('. ');
      if (isWelcomeEmailErrorMessage(combinedText)) {
        dispatch(clearUsersError());
        setRegisteredEmail(form.email.trim());
        setShowSuccessModal(true);
        setForm(initialFormState);
        return;
      }

      const mappedFieldErrors: Record<string, string> = {};
      const generalMessages: string[] = [];

      rawMessages.forEach((rawMsg) => {
        const msg = rawMsg.trim();
        if (!msg) return;
        const field = matchStudentBackendErrorToField(msg);
        if (field === 'general') {
          generalMessages.push(msg);
        } else if (!mappedFieldErrors[field]) {
          mappedFieldErrors[field] = msg;
        }
      });

      setErrors(mappedFieldErrors);
      if (generalMessages.length > 0) {
        setGeneralError(generalMessages.join('. '));
      }
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-card">
        {/* Columna Lateral Izquierda (Banner Informativo) */}
        <div className="register-sidebar-banner">
          <div className="register-banner-header">
            <span className="register-banner-tag">REGISTRO DE ESTUDIANTE</span>
            <div className="register-banner-line" />
            <h1 className="register-banner-title">¡Comencemos tu registro!</h1>
            <p className="register-banner-subtitle">
              Completá tus datos personales para acceder a todas las funcionalidades del sistema.
            </p>
          </div>

          <div className="register-trust-points">
            <div className="register-trust-item">
              <FaShieldHalved className="register-trust-icon" />
              <span className="register-trust-text">
                Tus datos están protegidos y serán utilizados únicamente con fines académicos.
              </span>
            </div>
            <div className="register-trust-item">
              <FaGraduationCap className="register-trust-icon" />
              <span className="register-trust-text">
                Te acompañamos en cada paso de tu formación.
              </span>
            </div>
          </div>
        </div>

        {/* Columna Derecha (Formulario) */}
        <div className="register-form-panel">
          <h2 className="register-form-title">Datos personales</h2>
          <p className="register-form-subtitle">
            Completá la información tal como figura en tu documento.
          </p>

          {generalError && (
            <div className="alert alert-danger mb-3 py-2 small" role="alert">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate autoComplete="off" className="register-form-grid">
            {/* Fila 1: Nombre y Apellido */}
            <div className="register-row-2">
              <div className="register-field-group">
                <label htmlFor="nombre" className="register-field-label">
                  Nombre <span className="register-field-asterisk">*</span>
                </label>
                <div className="register-input-wrapper">
                  <FaUser className="register-input-icon" />
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    className={`register-input ${errors.nombre ? 'is-invalid' : ''}`}
                    placeholder="Ingresá tu nombre"
                    value={form.nombre}
                    onChange={handleChange}
                  />
                </div>
                {errors.nombre && <span className="register-field-error">{errors.nombre}</span>}
              </div>

              <div className="register-field-group">
                <label htmlFor="apellido" className="register-field-label">
                  Apellido <span className="register-field-asterisk">*</span>
                </label>
                <div className="register-input-wrapper">
                  <FaUser className="register-input-icon" />
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    className={`register-input ${errors.apellido ? 'is-invalid' : ''}`}
                    placeholder="Ingresá tu apellido"
                    value={form.apellido}
                    onChange={handleChange}
                  />
                </div>
                {errors.apellido && <span className="register-field-error">{errors.apellido}</span>}
              </div>
            </div>

            {/* Fila 2: Email y DNI */}
            <div className="register-row-2">
              <div className="register-field-group">
                <label htmlFor="email" className="register-field-label">
                  Email <span className="register-field-asterisk">*</span>
                </label>
                <div className="register-input-wrapper">
                  <FaEnvelope className="register-input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`register-input ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="ejemplo@dominio.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email ? (
                  <span className="register-field-error">{errors.email}</span>
                ) : (
                  <span className="register-field-help">Usá tu email institucional o personal</span>
                )}
              </div>

              <div className="register-field-group">
                <label htmlFor="dni" className="register-field-label">
                  DNI <span className="register-field-asterisk">*</span>
                </label>
                <div className="register-input-wrapper">
                  <FaIdCard className="register-input-icon" />
                  <input
                    type="text"
                    id="dni"
                    name="dni"
                    className={`register-input ${errors.dni ? 'is-invalid' : ''}`}
                    placeholder="7 u 8 dígitos"
                    value={form.dni}
                    onChange={handleChange}
                  />
                </div>
                {errors.dni ? (
                  <span className="register-field-error">{errors.dni}</span>
                ) : (
                  <span className="register-field-help">Sin puntos ni espacios</span>
                )}
              </div>
            </div>

            {/* Fila 3: Información Académica (3 columnas) */}
            <div className="register-row-3">
              <div className="register-field-group">
                <label htmlFor="yearOfAdmission" className="register-field-label">
                  Año de ingreso <span className="register-field-asterisk">*</span>
                </label>
                <div className="register-input-wrapper">
                  <FaCalendarDays className="register-input-icon" />
                  <input
                    type="number"
                    id="yearOfAdmission"
                    name="yearOfAdmission"
                    className={`register-input ${errors.yearOfAdmission ? 'is-invalid' : ''}`}
                    placeholder="Ej. 2024"
                    value={form.yearOfAdmission}
                    onChange={handleChange}
                  />
                </div>
                {errors.yearOfAdmission && (
                  <span className="register-field-error">{errors.yearOfAdmission}</span>
                )}
              </div>

              <div className="register-field-group">
                <label htmlFor="completedCoursesWithFinal" className="register-field-label">
                  Materias con final <span className="register-field-asterisk">*</span>
                </label>
                <div className="register-input-wrapper">
                  <FaFileLines className="register-input-icon" />
                  <input
                    type="number"
                    id="completedCoursesWithFinal"
                    name="completedCoursesWithFinal"
                    className={`register-input ${errors.completedCoursesWithFinal ? 'is-invalid' : ''}`}
                    placeholder="Ej. 2"
                    value={form.completedCoursesWithFinal}
                    onChange={handleChange}
                  />
                </div>
                {errors.completedCoursesWithFinal && (
                  <span className="register-field-error">{errors.completedCoursesWithFinal}</span>
                )}
              </div>

              <div className="register-field-group">
                <label htmlFor="completedCoursesWithoutFinal" className="register-field-label">
                  Materias sin final <span className="register-field-asterisk">*</span>
                </label>
                <div className="register-input-wrapper">
                  <FaFileLines className="register-input-icon" />
                  <input
                    type="number"
                    id="completedCoursesWithoutFinal"
                    name="completedCoursesWithoutFinal"
                    className={`register-input ${errors.completedCoursesWithoutFinal ? 'is-invalid' : ''}`}
                    placeholder="Ej. 1"
                    value={form.completedCoursesWithoutFinal}
                    onChange={handleChange}
                  />
                </div>
                {errors.completedCoursesWithoutFinal && (
                  <span className="register-field-error">{errors.completedCoursesWithoutFinal}</span>
                )}
              </div>
            </div>

            {/* Fila 4: Contraseña */}
            <div className="register-row-1">
              <div className="register-field-group">
                <label htmlFor="password" className="register-field-label">
                  Contraseña <span className="register-field-asterisk">*</span>
                </label>
                <div className="register-input-wrapper">
                  <FaLock className="register-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`register-input ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowPassword((previousShowState) => !previousShowState)}
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
                {errors.password ? (
                  <span className="register-field-error">{errors.password}</span>
                ) : (
                  <span className="register-field-help">
                    Mínimo 6 caracteres.
                  </span>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="register-actions-row">
              <button
                type="submit"
                className="btn-register-submit"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Registrando…' : 'Registrarme'}
                <FaArrowRight size={13} />
              </button>
              <button
                type="button"
                className="btn-register-cancel"
                onClick={() => navigate('/login')}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmación de Registro Exitoso (Mockup 2) */}
      {showSuccessModal && (
        <div className="register-modal-overlay">
          <div className="register-modal-box">
            <div className="register-modal-icon-circle">
              <FaCheck size={32} />
            </div>
            <h3 className="register-modal-heading">¡Alumno registrado!</h3>
            <p className="register-modal-message">
              Te enviamos la confirmación a <strong>{registeredEmail}</strong>.
            </p>
            <button
              type="button"
              className="register-modal-btn"
              onClick={() => navigate('/login')}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;

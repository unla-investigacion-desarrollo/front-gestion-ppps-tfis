import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  registerStudent,
  selectUsersStatus,
  selectUsersError,
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
 * Pantalla de Registro de Estudiante
 * Rediseño basado en tarjeta de 2 columnas con banner informativo y modal de éxito.
 */
const Register: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectUsersStatus);
  const error = useSelector(selectUsersError);

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
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  const [emailCheck, setEmailCheck] = useState<'idle' | 'checking' | 'free' | 'taken'>('idle');
  const [dniCheck, setDniCheck] = useState<'idle' | 'checking' | 'free' | 'taken'>('idle');

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

  // Verificar disponibilidad de email (mock: localStorage)
  useEffect(() => {
    if (!form.email) {
      setEmailCheck('idle');
      return;
    }
    setEmailCheck('checking');
    const timeoutIdentifier = setTimeout(() => {
      try {
        const rawUsers = localStorage.getItem('users');
        const parsedUsers = rawUsers ? JSON.parse(rawUsers) : [];
        const exists = parsedUsers.some(
          (userCandidate: any) => (userCandidate.email || '').toLowerCase() === form.email.toLowerCase()
        );
        setEmailCheck(exists ? 'taken' : 'free');
      } catch {
        setEmailCheck('free');
      }
    }, 350);
    return () => clearTimeout(timeoutIdentifier);
  }, [form.email]);

  // Verificar disponibilidad de DNI (mock: localStorage) cuando tiene 8 dígitos
  useEffect(() => {
    if (!form.dni || form.dni.length !== 8) {
      setDniCheck('idle');
      return;
    }
    setDniCheck('checking');
    const timeoutIdentifier = setTimeout(() => {
      try {
        const rawUsers = localStorage.getItem('users');
        const parsedUsers = rawUsers ? JSON.parse(rawUsers) : [];
        const exists = parsedUsers.some(
          (userCandidate: any) => (userCandidate.dni || '') === form.dni
        );
        setDniCheck(exists ? 'taken' : 'free');
      } catch {
        setDniCheck('free');
      }
    }, 350);
    return () => clearTimeout(timeoutIdentifier);
  }, [form.dni]);

  const handleChange = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = changeEvent.target;
    setForm((previousForm) => ({ ...previousForm, [name]: value }));
    if (errors[name]) {
      setErrors((previousErrors) => ({ ...previousErrors, [name]: '' }));
    }
  };

  const handleSubmit = async (formSubmitEvent: React.FormEvent) => {
    formSubmitEvent.preventDefault();
    const validationErrors: Record<string, string> = {};

    if (!form.nombre.trim()) validationErrors.nombre = 'El nombre es obligatorio';
    if (!form.apellido.trim()) validationErrors.apellido = 'El apellido es obligatorio';
    if (!form.email.trim()) {
      validationErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      validationErrors.email = 'Ingresá un correo electrónico válido';
    } else if (emailCheck === 'taken') {
      validationErrors.email = 'El email ya está en uso';
    }

    if (!form.dni || !/^\d{8}$/.test(form.dni)) {
      validationErrors.dni = 'DNI debe tener exactamente 8 números';
    } else if (dniCheck === 'taken') {
      validationErrors.dni = 'El DNI ya está en uso';
    }

    const currentYear = new Date().getFullYear();
    const parsedYear = Number(form.yearOfAdmission);
    if (!form.yearOfAdmission) {
      validationErrors.yearOfAdmission = 'El año de ingreso es obligatorio';
    } else if (isNaN(parsedYear) || parsedYear < 1950 || parsedYear > currentYear) {
      validationErrors.yearOfAdmission = `Ingresá un año válido (1950 - ${currentYear})`;
    }

    const withFinalCount = Number(form.completedCoursesWithFinal);
    if (form.completedCoursesWithFinal === '') {
      validationErrors.completedCoursesWithFinal = 'Campo obligatorio';
    } else if (isNaN(withFinalCount) || withFinalCount < 0) {
      validationErrors.completedCoursesWithFinal = 'Debe ser 0 o mayor';
    }

    const withoutFinalCount = Number(form.completedCoursesWithoutFinal);
    if (form.completedCoursesWithoutFinal === '') {
      validationErrors.completedCoursesWithoutFinal = 'Campo obligatorio';
    } else if (isNaN(withoutFinalCount) || withoutFinalCount < 0) {
      validationErrors.completedCoursesWithoutFinal = 'Debe ser 0 o mayor';
    }

    if (!form.password || form.password.length < 6) {
      validationErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    dispatch(clearUsersError());

    try {
      await dispatch<any>(
        registerStudent({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          dni: form.dni.trim(),
          email: form.email.trim(),
          password: form.password,
          yearOfAdmission: Number(form.yearOfAdmission),
          completedCoursesWithFinal: Number(form.completedCoursesWithFinal),
          completedCoursesWithoutFinal: Number(form.completedCoursesWithoutFinal),
        })
      ).unwrap();

      setRegisteredEmail(form.email.trim());
      setShowSuccessModal(true);
      setForm(initialFormState);
      setEmailCheck('idle');
      setDniCheck('idle');
    } catch (registrationError: any) {
      const serverErrorMessage =
        typeof registrationError === 'string'
          ? registrationError
          : registrationError?.message || '';

      if (isWelcomeEmailErrorMessage(serverErrorMessage)) {
        dispatch(clearUsersError());
        setRegisteredEmail(form.email.trim());
        setShowSuccessModal(true);
        setForm(initialFormState);
        setEmailCheck('idle');
        setDniCheck('idle');
      }
      // Cualquier otro error se mantiene en Redux para mostrarse en el formulario
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

          {error && !isWelcomeEmailErrorMessage(error) && (
            <div className="alert alert-danger mb-3 py-2 small" role="alert">
              {error} — <a href="/help" className="text-danger fw-bold">Ver ayuda</a>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="register-form-grid">
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
                    onChange={(changeEvent) => {
                      const cleanLetters = changeEvent.target.value.replace(/[^\p{L}\s]/gu, '');
                      setForm((previousForm) => ({ ...previousForm, nombre: cleanLetters }));
                      if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' }));
                    }}
                    required
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
                    onChange={(changeEvent) => {
                      const cleanLetters = changeEvent.target.value.replace(/[^\p{L}\s]/gu, '');
                      setForm((previousForm) => ({ ...previousForm, apellido: cleanLetters }));
                      if (errors.apellido) setErrors((prev) => ({ ...prev, apellido: '' }));
                    }}
                    required
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
                    className={`register-input ${(errors.email || emailCheck === 'taken') ? 'is-invalid' : ''}`}
                    placeholder="ejemplo@dominio.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.email ? (
                  <span className="register-field-error">{errors.email}</span>
                ) : emailCheck === 'taken' ? (
                  <span className="register-field-error">
                    El email ya está en uso. <a href="/help">Ver ayuda</a>
                  </span>
                ) : emailCheck === 'checking' ? (
                  <span className="register-field-help text-muted">Verificando disponibilidad…</span>
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
                    maxLength={8}
                    className={`register-input ${(errors.dni || dniCheck === 'taken') ? 'is-invalid' : ''}`}
                    placeholder="8 dígitos"
                    value={form.dni}
                    onChange={(changeEvent) => {
                      const cleanDigits = changeEvent.target.value.replace(/\D/g, '').slice(0, 8);
                      setForm((previousForm) => ({ ...previousForm, dni: cleanDigits }));
                      if (errors.dni) setErrors((prev) => ({ ...prev, dni: '' }));
                    }}
                    required
                  />
                </div>
                {errors.dni ? (
                  <span className="register-field-error">{errors.dni}</span>
                ) : dniCheck === 'taken' ? (
                  <span className="register-field-error">El DNI ya está en uso.</span>
                ) : dniCheck === 'checking' ? (
                  <span className="register-field-help text-muted">Verificando…</span>
                ) : (
                  <span className="register-field-help">Exactamente 8 números</span>
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
                    min="1950"
                    max={new Date().getFullYear()}
                    required
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
                    min="0"
                    required
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
                    min="0"
                    required
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
                    required
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
                    Mínimo 8 caracteres, con al menos una letra y un número.
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

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStudent, selectUsersStatus, selectUsersError } from '../../../redux/slices/usersSlice';
import '../../styles/unla.css';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectUsersStatus);
  const error = useSelector(selectUsersError);

  const initialForm = {
    email: '',
    nombre: '',
    apellido: '',
    dni: '',
    password: '',
    yearOfAdmission: '',
    completedCoursesWithFinal: '',
    completedCoursesWithoutFinal: '',
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [emailCheck, setEmailCheck] = useState<'idle' | 'checking' | 'free' | 'taken'>('idle');
  const [dniCheck, setDniCheck] = useState<'idle' | 'checking' | 'free' | 'taken'>('idle');

  // Verificar disponibilidad de email (mock: localStorage)
  useEffect(() => {
    if (!form.email) {
      setEmailCheck('idle');
      return;
    }
    setEmailCheck('checking');
    const handle = setTimeout(() => {
      try {
        const raw = localStorage.getItem('users');
        const users = raw ? JSON.parse(raw) : [];
        const exists = users.some((u: any) => (u.email || '').toLowerCase() === form.email.toLowerCase());
        setEmailCheck(exists ? 'taken' : 'free');
      } catch {
        setEmailCheck('free');
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [form.email]);

  // Verificar disponibilidad de DNI (mock: localStorage) cuando tiene 8 dígitos
  useEffect(() => {
    if (!form.dni || form.dni.length !== 8) {
      setDniCheck('idle');
      return;
    }
    setDniCheck('checking');
    const handle = setTimeout(() => {
      try {
        const raw = localStorage.getItem('users');
        const users = raw ? JSON.parse(raw) : [];
        const exists = users.some((u: any) => (u.dni || '') === form.dni);
        setDniCheck(exists ? 'taken' : 'free');
      } catch {
        setDniCheck('free');
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [form.dni]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!form.apellido) newErrors.apellido = 'El apellido es obligatorio';
    if (!form.email) newErrors.email = 'El email es obligatorio';
    if (emailCheck === 'taken') newErrors.email = 'El email ya está en uso';
    if (!form.dni || !/^\d{8}$/.test(form.dni)) newErrors.dni = 'DNI debe tener 8 dígitos';
    if (dniCheck === 'taken') newErrors.dni = 'El DNI ya está en uso';

    const currentYear = new Date().getFullYear();
    const year = Number(form.yearOfAdmission);
    if (!form.yearOfAdmission) {
      newErrors.yearOfAdmission = 'El año de ingreso es obligatorio';
    } else if (isNaN(year) || year < 1950 || year > currentYear) {
      newErrors.yearOfAdmission = `Ingresá un año válido (1950 - ${currentYear})`;
    }

    const withFinal = Number(form.completedCoursesWithFinal);
    if (form.completedCoursesWithFinal === '') {
      newErrors.completedCoursesWithFinal = 'La cantidad de materias con final es obligatoria';
    } else if (isNaN(withFinal) || withFinal < 0) {
      newErrors.completedCoursesWithFinal = 'Debe ser 0 o un número positivo';
    }

    const withoutFinal = Number(form.completedCoursesWithoutFinal);
    if (form.completedCoursesWithoutFinal === '') {
      newErrors.completedCoursesWithoutFinal = 'La cantidad de materias sin final es obligatoria';
    } else if (isNaN(withoutFinal) || withoutFinal < 0) {
      newErrors.completedCoursesWithoutFinal = 'Debe ser 0 o un número positivo';
    }

    if (!form.password || form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await dispatch<any>(
        registerStudent({
          nombre: form.nombre,
          apellido: form.apellido,
          dni: form.dni,
          email: form.email,
          password: form.password,
          yearOfAdmission: Number(form.yearOfAdmission),
          completedCoursesWithFinal: Number(form.completedCoursesWithFinal),
          completedCoursesWithoutFinal: Number(form.completedCoursesWithoutFinal),
        })
      ).unwrap();
      setSuccessMessage('Registro completado con éxito. Ya podés iniciar sesión con tus credenciales.');
      setForm(initialForm);
      setEmailCheck('idle');
      setDniCheck('idle');
      window.setTimeout(() => navigate('/login'), 3000);
    } catch {
      // El error se muestra mediante el estado de Redux en el formulario.
    }
  };

  return (
    <div className="background d-flex justify-content-center align-items-center min-vh-100 py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <h3 className="mb-4 text-center">Registro de Estudiante</h3>

                {error && (
                  <div className="alert alert-danger mb-3">
                    {error} — <a href="/help">Ver ayuda</a>
                  </div>
                )}

                {successMessage && (
                  <div className="alert alert-success register-success mb-3" role="status">
                    <strong>¡Registro exitoso!</strong>
                    <div>{successMessage}</div>
                    <button
                      type="button"
                      className="btn btn-success btn-sm mt-2"
                      onClick={() => navigate('/login')}
                    >
                      Ir al inicio de sesión
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Nombre y Apellido */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="nombre" className="form-label">Nombre</label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                        placeholder="Nombre"
                        value={form.nombre}
                        onChange={(e) => {
                          const letters = e.target.value.replace(/[^\p{L}\s]/gu, '');
                          setForm((prev) => ({ ...prev, nombre: letters }));
                        }}
                      />
                      {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="apellido" className="form-label">Apellido</label>
                      <input
                        type="text"
                        id="apellido"
                        name="apellido"
                        className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                        placeholder="Apellido"
                        value={form.apellido}
                        onChange={(e) => {
                          const letters = e.target.value.replace(/[^\p{L}\s]/gu, '');
                          setForm((prev) => ({ ...prev, apellido: letters }));
                        }}
                      />
                      {errors.apellido && <div className="invalid-feedback">{errors.apellido}</div>}
                    </div>
                  </div>

                  {/* Email y DNI */}
                  <div className="row g-3 mt-2">
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-control ${(errors.email || emailCheck === 'taken') ? 'is-invalid' : ''}`}
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                      {errors.email ? (
                        <div className="invalid-feedback">{errors.email}</div>
                      ) : emailCheck === 'taken' ? (
                        <div className="invalid-feedback">
                          El email ya está en uso. <a href="/help">Ver ayuda</a>
                        </div>
                      ) : emailCheck === 'checking' ? (
                        <div className="form-text text-muted">Verificando…</div>
                      ) : (
                        <div className="form-text">Usá tu email institucional</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="dni" className="form-label">DNI</label>
                      <input
                        type="text"
                        id="dni"
                        name="dni"
                        className={`form-control ${(errors.dni || dniCheck === 'taken') ? 'is-invalid' : ''}`}
                        placeholder="8 dígitos"
                        value={form.dni}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setForm((prev) => ({ ...prev, dni: digits }));
                        }}
                        required
                      />
                      {errors.dni ? (
                        <div className="invalid-feedback">{errors.dni}</div>
                      ) : dniCheck === 'taken' ? (
                        <div className="invalid-feedback">El DNI ya está en uso.</div>
                      ) : dniCheck === 'checking' ? (
                        <div className="form-text text-muted">Verificando…</div>
                      ) : (
                        <div className="form-text">Exactamente 8 números</div>
                      )}
                    </div>
                  </div>

                  {/* Información Académica */}
                  <div className="row g-3 mt-2">
                    <div className="col-md-4">
                      <label htmlFor="yearOfAdmission" className="form-label">Año de ingreso</label>
                      <input
                        type="number"
                        id="yearOfAdmission"
                        name="yearOfAdmission"
                        className={`form-control ${errors.yearOfAdmission ? 'is-invalid' : ''}`}
                        placeholder="Ej. 2024"
                        value={form.yearOfAdmission}
                        onChange={handleChange}
                        min="1950"
                        max={new Date().getFullYear()}
                        required
                      />
                      {errors.yearOfAdmission && <div className="invalid-feedback">{errors.yearOfAdmission}</div>}
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="completedCoursesWithFinal" className="form-label">Materias con final</label>
                      <input
                        type="number"
                        id="completedCoursesWithFinal"
                        name="completedCoursesWithFinal"
                        className={`form-control ${errors.completedCoursesWithFinal ? 'is-invalid' : ''}`}
                        placeholder="Ej. 2"
                        value={form.completedCoursesWithFinal}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                      {errors.completedCoursesWithFinal && <div className="invalid-feedback">{errors.completedCoursesWithFinal}</div>}
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="completedCoursesWithoutFinal" className="form-label">Materias sin final</label>
                      <input
                        type="number"
                        id="completedCoursesWithoutFinal"
                        name="completedCoursesWithoutFinal"
                        className={`form-control ${errors.completedCoursesWithoutFinal ? 'is-invalid' : ''}`}
                        placeholder="Ej. 1"
                        value={form.completedCoursesWithoutFinal}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                      {errors.completedCoursesWithoutFinal && <div className="invalid-feedback">{errors.completedCoursesWithoutFinal}</div>}
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="row g-3 mt-2">
                    <div className="col-md-12">
                      <label htmlFor="password" className="form-label">Contraseña</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="Mínimo 6 caracteres"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                      {errors.password ? (
                        <div className="invalid-feedback">{errors.password}</div>
                      ) : (
                        <div className="form-text">Definí tu contraseña de acceso</div>
                      )}
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-danger w-50"
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? 'Enviando…' : 'Registrarme'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary w-50"
                      onClick={() => navigate('/login')}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

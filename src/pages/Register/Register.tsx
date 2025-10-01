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
    fechaNacimiento: '',
  };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const isFutureDate = (yyyyMmDd: string) => {
    if (!yyyyMmDd) return false;
    const today = new Date();
    const input = new Date(yyyyMmDd + 'T00:00:00');
    // compare only date part
    const todayYMD = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return input > todayYMD;
  };

  const getAge = (yyyyMmDd: string) => {
    if (!yyyyMmDd) return 0;
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - y;
    const hasHadBirthday = (today.getMonth() + 1 > m) || ((today.getMonth() + 1 === m) && (today.getDate() >= d));
    if (!hasHadBirthday) age--;
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.email) newErrors.email = 'El email es obligatorio';
    if (emailCheck === 'taken') newErrors.email = 'El email ya está en uso';
    if (!form.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!form.apellido) newErrors.apellido = 'El apellido es obligatorio';
    if (!form.dni || !/^\d{8}$/.test(form.dni)) newErrors.dni = 'DNI debe tener 8 dígitos';
    if (dniCheck === 'taken') newErrors.dni = 'El DNI ya está en uso';
    if (!form.fechaNacimiento) {
      newErrors.fechaNacimiento = 'Fecha de nacimiento obligatoria';
    } else if (isFutureDate(form.fechaNacimiento)) {
      newErrors.fechaNacimiento = 'La fecha no puede ser futura';
    } else if (getAge(form.fechaNacimiento) < 18) {
      newErrors.fechaNacimiento = 'Debés tener al menos 18 años';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    try {
      await dispatch<any>(registerStudent({ ...form}));
      // mensaje sutil arriba del form
      window.alert('Registro completado. Vas a recibir un email con tu usuario y contraseña temporales. Deberás cambiarlas en tu primer ingreso.');
      setForm(initialForm);
      setEmailCheck('idle');
      setDniCheck('idle');
      navigate('/login');
    } catch {}
  };


  return (
      <div className="background d-flex justify-content-center align-items-center vh-100">
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
    
                    {/* Email, DNI y Fecha */}
                    <div className="row g-3 mt-2">
                      <div className="col-md-4">
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
    
                      <div className="col-md-4">
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
    
                      <div className="col-md-4">
                        <label htmlFor="fechaNacimiento" className="form-label">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          id="fechaNacimiento"
                          name="fechaNacimiento"
                          className={`form-control ${errors.fechaNacimiento ? 'is-invalid' : ''}`}
                          value={form.fechaNacimiento}
                          onChange={handleChange}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                        {errors.fechaNacimiento ? (
                          <div className="invalid-feedback">{errors.fechaNacimiento}</div>
                        ) : (
                          <div className="form-text">Seleccioná día, mes y año</div>
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

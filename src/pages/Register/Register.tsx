import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStudent, selectUsersStatus, selectUsersError } from '../../../redux/slices/usersSlice';
import '../../styles/unla.css';
import { useNavigate } from 'react-router-dom';
import { CARRERAS } from '../../constants/carreras';

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
    carrera: '',
    fechaNacimiento: '',
    sexo: '' as '' | 'F' | 'M' | 'N',
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
    if (!form.carrera) newErrors.carrera = 'Seleccioná tu carrera';
    if (!form.fechaNacimiento) {
      newErrors.fechaNacimiento = 'Fecha de nacimiento obligatoria';
    } else if (isFutureDate(form.fechaNacimiento)) {
      newErrors.fechaNacimiento = 'La fecha no puede ser futura';
    } else if (getAge(form.fechaNacimiento) < 18) {
      newErrors.fechaNacimiento = 'Debés tener al menos 18 años';
    }
    if (!form.sexo) newErrors.sexo = 'Seleccioná tu sexo';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    try {
      await dispatch<any>(registerStudent({ ...form, sexo: form.sexo as 'F' | 'M' | 'N' }));
      // mensaje sutil arriba del form
      window.alert('Registro enviado. Tu cuenta está pendiente de aprobación.');
      setForm(initialForm);
      setEmailCheck('idle');
      setDniCheck('idle');
      navigate('/login');
    } catch {}
  };


  return (
    <div className="unla-page" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="unla-card" style={{ width: '100%', maxWidth: 560 }}>
        <h1>Registro de Estudiante</h1>
        {error && (
          <div className="unla-hint error" style={{ marginBottom: 8 }}>
            {error} — <a href="/help">Ver ayuda</a>
          </div>
        )}
        <form className="unla-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label htmlFor="nombre" className="unla-label">Nombre</label>
              <input
                id="nombre"
                className={`unla-input ${errors.nombre ? 'unla-error' : ''}`}
                name="nombre"
                placeholder="Nombre (solo letras)"
                value={form.nombre}
                onChange={(e) => {
                  const letters = e.target.value.replace(/[^\p{L}\s]/gu, '');
                  setForm((prev) => ({ ...prev, nombre: letters }));
                }}
                aria-invalid={!!errors.nombre}
              />
            </div>
            <div>
              <label htmlFor="apellido" className="unla-label">Apellido</label>
              <input
                id="apellido"
                className={`unla-input ${errors.apellido ? 'unla-error' : ''}`}
                name="apellido"
                placeholder="Apellido (solo letras)"
                value={form.apellido}
                onChange={(e) => {
                  const letters = e.target.value.replace(/[^\p{L}\s]/gu, '');
                  setForm((prev) => ({ ...prev, apellido: letters }));
                }}
                aria-invalid={!!errors.apellido}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {errors.nombre && <div className="unla-hint error">{errors.nombre}</div>}
            {errors.apellido && <div className="unla-hint error">{errors.apellido}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label htmlFor="email" className="unla-label">Email</label>
              <input
                id="email"
                className={`unla-input ${errors.email || emailCheck === 'taken' ? 'unla-error' : ''}`}
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                aria-invalid={!!errors.email || emailCheck === 'taken'}
                required
              />
            </div>
            <div>
              <label htmlFor="dni" className="unla-label">DNI</label>
              <input
                id="dni"
                className={`unla-input ${(errors.dni || dniCheck === 'taken') ? 'unla-error' : ''}`}
                name="dni"
                placeholder="DNI (solo números)"
                value={form.dni}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setForm((prev) => ({ ...prev, dni: digits }));
                }}
                aria-invalid={!!errors.dni || dniCheck === 'taken'}
                required
              />
            </div>
            <div>
              <label htmlFor="fechaNacimiento" className="unla-label">Fecha de Nacimiento</label>
              <input
                id="fechaNacimiento"
                className={`unla-input ${errors.fechaNacimiento ? 'unla-error' : ''}`}
                name="fechaNacimiento"
                type="date"
                placeholder="Fecha de Nacimiento"
                value={form.fechaNacimiento}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                aria-invalid={!!errors.fechaNacimiento}
                required
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {errors.email ? (
              <div className="unla-hint error">{errors.email}</div>
            ) : emailCheck === 'taken' ? (
              <div className="unla-hint error">El email ya está en uso. Si olvidaste tu contraseña, pedí al admin el reseteo. <a href="/help">Ver ayuda</a></div>
            ) : emailCheck === 'checking' ? (
              <div className="unla-hint">Verificando disponibilidad…</div>
            ) : (
              <div className="unla-hint">Usá tu email institucional si tenés</div>
            )}
            {errors.dni ? (
              <div className="unla-hint error">{errors.dni}</div>
            ) : dniCheck === 'taken' ? (
              <div className="unla-hint error">El DNI ya está en uso.</div>
            ) : dniCheck === 'checking' ? (
              <div className="unla-hint">Verificando DNI…</div>
            ) : (
              <div className="unla-hint">Debe contener exactamente 8 dígitos</div>
            )}
            {errors.fechaNacimiento ? (
              <div className="unla-hint error">{errors.fechaNacimiento}</div>
            ) : (
              <div className="unla-hint">Seleccioná día, mes y año</div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label htmlFor="carrera" className="unla-label">Carrera</label>
              <select
                id="carrera"
                className={`unla-input ${errors.carrera ? 'unla-error' : ''}`}
                name="carrera"
                value={form.carrera}
                onChange={(e) => setForm((prev) => ({ ...prev, carrera: e.target.value }))}
                aria-invalid={!!errors.carrera}
                required
              >
                <option value="" disabled>Seleccioná tu carrera</option>
                {CARRERAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sexo" className="unla-label">Sexo</label>
              <select
                id="sexo"
                className={`unla-input ${errors.sexo ? 'unla-error' : ''}`}
                name="sexo"
                value={form.sexo}
                onChange={(e) => setForm((prev) => ({ ...prev, sexo: e.target.value as 'F' | 'M' | 'N' | '' }))}
                aria-invalid={!!errors.sexo}
                required
              >
                <option value="" disabled>Seleccioná sexo</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="N">Prefiero no decirlo</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {errors.carrera && <div className="unla-hint error">{errors.carrera}</div>}
            {errors.sexo && <div className="unla-hint error">{errors.sexo}</div>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="unla-btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Enviando...' : 'Registrarme'}
            </button>
            <button
              type="button"
              className="unla-btn"
              onClick={() => navigate('/login')}
              style={{ background: '#777' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="unla-btn"
              onClick={() => {
                setForm(initialForm);
                setErrors({});
                setEmailCheck('idle');
                setDniCheck('idle');
              }}
              style={{ background: '#999', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
              aria-label="Limpiar formulario"
              title="Limpiar formulario"
            >
              <span role="img" aria-hidden="true">🧹</span>
              <span>Limpiar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStudent, selectUsersStatus, selectUsersError } from '../../../redux/slices/usersSlice';
import '../../styles/unla.css';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectUsersStatus);
  const error = useSelector(selectUsersError);

  const [form, setForm] = useState({
    email: '',
    nombre: '',
    apellido: '',
    dni: '',
    legajo: '',
    carrera: '',
    fechaNacimiento: '',
    cuil: '',
    sexo: '' as '' | 'F' | 'M',
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.email) newErrors.email = 'El email es obligatorio';
    if (emailCheck === 'taken') newErrors.email = 'El email ya está en uso';
    if (!form.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!form.apellido) newErrors.apellido = 'El apellido es obligatorio';
    if (!form.dni || !/^\d{8}$/.test(form.dni)) newErrors.dni = 'DNI debe tener 8 dígitos';
    if (dniCheck === 'taken') newErrors.dni = 'El DNI ya está en uso';
    if (!form.cuil || !/^\d{11}$/.test(form.cuil)) newErrors.cuil = 'CUIL debe tener 11 dígitos';
    if (form.cuil && !isValidCuil(form.cuil)) newErrors.cuil = 'CUIL inválido (dígito verificador)';
    if (!form.fechaNacimiento) newErrors.fechaNacimiento = 'Fecha de nacimiento obligatoria';
    if (!form.sexo) newErrors.sexo = 'Seleccioná tu sexo';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    try {
      await dispatch<any>(registerStudent({ ...form, sexo: form.sexo as 'F' | 'M' }));
      // mensaje sutil arriba del form
      window.alert('Registro enviado. Tu cuenta está pendiente de aprobación.');
      setForm({ email: '', nombre: '', apellido: '', dni: '', legajo: '', carrera: '', fechaNacimiento: '', cuil: '', sexo: '' });
      navigate('/login');
    } catch {}
  };

  // Valida CUIL: 11 dígitos y dígito verificador
  const isValidCuil = (cuil: string) => {
    if (!/^\d{11}$/.test(cuil)) return false;
    const nums = cuil.split('').map(n => parseInt(n, 10));
    const weights = [5,4,3,2,7,6,5,4,3,2];
    const sum = weights.reduce((acc, w, i) => acc + w * nums[i], 0);
    const mod = sum % 11;
    const dv = mod === 0 ? 0 : (mod === 1 ? 9 : 11 - mod);
    return dv === nums[10];
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
          <input className={`unla-input ${errors.email || emailCheck === 'taken' ? 'unla-error' : ''}`} name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} aria-invalid={!!errors.email || emailCheck === 'taken'} required />
          {errors.email ? (
            <div className="unla-hint error">{errors.email}</div>
          ) : emailCheck === 'taken' ? (
            <div className="unla-hint error">El email ya está en uso. Si olvidaste tu contraseña, pedí al admin el reseteo. <a href="/help">Ver ayuda</a></div>
          ) : emailCheck === 'checking' ? (
            <div className="unla-hint">Verificando disponibilidad…</div>
          ) : (
            <div className="unla-hint">Usá tu email institucional si tenés</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
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
            <input
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {errors.nombre && <div className="unla-hint error">{errors.nombre}</div>}
            {errors.apellido && <div className="unla-hint error">{errors.apellido}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
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
            <input className="unla-input" name="legajo" placeholder="Legajo" value={form.legajo} onChange={handleChange} />
          </div>
          {errors.dni ? (
            <div className="unla-hint error">{errors.dni}</div>
          ) : dniCheck === 'taken' ? (
            <div className="unla-hint error">El DNI ya está en uso.</div>
          ) : dniCheck === 'checking' ? (
            <div className="unla-hint">Verificando DNI…</div>
          ) : (
            <div className="unla-hint">Debe contener exactamente 8 dígitos</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              className={`unla-input ${errors.fechaNacimiento ? 'unla-error' : ''}`}
              name="fechaNacimiento"
              type="date"
              placeholder="Fecha de Nacimiento"
              value={form.fechaNacimiento}
              onChange={handleChange}
              aria-invalid={!!errors.fechaNacimiento}
              required
            />
            <input
              className={`unla-input ${errors.cuil ? 'unla-error' : ''}`}
              name="cuil"
              placeholder="CUIL (solo números)"
              value={form.cuil}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                setForm((prev) => ({ ...prev, cuil: digits }));
              }}
              aria-invalid={!!errors.cuil}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {errors.fechaNacimiento ? (
              <div className="unla-hint error">{errors.fechaNacimiento}</div>
            ) : (
              <div className="unla-hint">Seleccioná día, mes y año</div>
            )}
            {errors.cuil ? (
              <div className="unla-hint error">{errors.cuil}</div>
            ) : (
              <div className="unla-hint">Debe contener 11 dígitos (con dígito verificador válido)</div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              className="unla-input"
              name="carrera"
              placeholder="Carrera (solo letras)"
              value={form.carrera}
              onChange={(e) => {
                const letters = e.target.value.replace(/[^\p{L}\s]/gu, '');
                setForm((prev) => ({ ...prev, carrera: letters }));
              }}
            />
            <select
              className={`unla-input ${errors.sexo ? 'unla-error' : ''}`}
              name="sexo"
              value={form.sexo}
              onChange={(e) => setForm((prev) => ({ ...prev, sexo: e.target.value as 'F' | 'M' | '' }))}
              aria-invalid={!!errors.sexo}
              required
            >
              <option value="" disabled>Seleccioná sexo</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>
          {errors.sexo && <div className="unla-hint error">{errors.sexo}</div>}
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

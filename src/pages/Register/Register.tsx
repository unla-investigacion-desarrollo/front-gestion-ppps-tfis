import React, { useState } from 'react';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validación de DNI numérico
    if (!form.dni || !/^\d{8}$/.test(form.dni)) {
      alert('Por favor, ingresá un DNI válido de 8 dígitos.');
      return;
    }
    // Validación de CUIL numérico (11 dígitos)
    if (!form.cuil || !/^\d{11}$/.test(form.cuil)) {
      alert('Por favor, ingresá un CUIL válido de 11 dígitos.');
      return;
    }
    // Validación de dígito verificador de CUIL
    if (!isValidCuil(form.cuil)) {
      alert('El CUIL ingresado no es válido (dígito verificador incorrecto).');
      return;
    }
    // Validar fecha de nacimiento
    if (!form.fechaNacimiento) {
      alert('Por favor, seleccioná tu fecha de nacimiento.');
      return;
    }
    // Validar sexo seleccionado
    if (!form.sexo) {
      alert('Por favor, seleccioná tu sexo.');
      return;
    }
    try {
      await dispatch<any>(registerStudent({ ...form, sexo: form.sexo as 'F' | 'M' }));
      alert('Registro enviado. Tu cuenta está pendiente de aprobación.');
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
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <form className="unla-form" onSubmit={handleSubmit}>
          <input className="unla-input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              className="unla-input"
              name="nombre"
              placeholder="Nombre (solo letras)"
              value={form.nombre}
              onChange={(e) => {
                const letters = e.target.value.replace(/[^\p{L}\s]/gu, '');
                setForm((prev) => ({ ...prev, nombre: letters }));
              }}
            />
            <input
              className="unla-input"
              name="apellido"
              placeholder="Apellido (solo letras)"
              value={form.apellido}
              onChange={(e) => {
                const letters = e.target.value.replace(/[^\p{L}\s]/gu, '');
                setForm((prev) => ({ ...prev, apellido: letters }));
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              className="unla-input"
              name="dni"
              placeholder="DNI (solo números)"
              value={form.dni}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                setForm((prev) => ({ ...prev, dni: digits }));
              }}
              required
            />
            <input className="unla-input" name="legajo" placeholder="Legajo" value={form.legajo} onChange={handleChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              className="unla-input"
              name="fechaNacimiento"
              type="date"
              placeholder="Fecha de Nacimiento"
              value={form.fechaNacimiento}
              onChange={handleChange}
              required
            />
            <input
              className="unla-input"
              name="cuil"
              placeholder="CUIL (solo números)"
              value={form.cuil}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                setForm((prev) => ({ ...prev, cuil: digits }));
              }}
              required
            />
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
              className="unla-input"
              name="sexo"
              value={form.sexo}
              onChange={(e) => setForm((prev) => ({ ...prev, sexo: e.target.value as 'F' | 'M' | '' }))}
              required
            >
              <option value="" disabled>Seleccioná sexo</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

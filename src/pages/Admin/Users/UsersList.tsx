import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectUsers, createOrInviteTeacher, deleteUser, resetPassword } from '../../../../redux/slices/usersSlice';
import '../../../styles/unla.css';

const UsersList: React.FC = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const [form, setForm] = useState({
    email: '',
    nombre: '',
    apellido: '',
    dni: '',
    sexo: '' as '' | 'F' | 'M',
    departamento: '',
    categoria: '',
    invite: true,
    password: ''
  });
  const [filters, setFilters] = useState({ q: '', rol: 'ALL', estado: 'ALL' });

  useEffect(() => {
    dispatch<any>(fetchUsers());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones básicas
    if (!form.email) { alert('Email es obligatorio'); return; }
    if (!form.nombre || /[^\p{L}\s]/gu.test(form.nombre)) { alert('Nombre debe contener solo letras'); return; }
    if (!form.apellido || /[^\p{L}\s]/gu.test(form.apellido)) { alert('Apellido debe contener solo letras'); return; }
    if (!/^\d{8}$/.test(form.dni)) { alert('DNI debe tener 8 dígitos'); return; }
    if (!form.sexo) { alert('Seleccioná el sexo'); return; }
    await dispatch<any>(createOrInviteTeacher({ 
      email: form.email,
      nombre: form.nombre,
      apellido: form.apellido,
      dni: form.dni,
      sexo: form.sexo as 'F' | 'M',
      departamento: form.departamento,
      categoria: form.categoria,
      invite: form.invite,
      password: form.invite ? undefined : form.password,
    }));
    setForm({ email: '', nombre: '', apellido: '', dni: '', sexo: '', departamento: '', categoria: '', invite: true, password: '' });
  };

  return (
    <div className="unla-page">
      <div className="unla-card" style={{ width: '100%', margin: '0 auto' }}>
        <h1>Usuarios</h1>

        <h2 className="unla-section-title">Crear/Invitar Docente</h2>
        <form className="unla-form" onSubmit={handleSubmit} style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' as const }}>
          <input className="unla-input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input
            className="unla-input"
            name="nombre"
            placeholder="Nombre (solo letras)"
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value.replace(/[^\p{L}\s]/gu, '') }))}
          />
          <input
            className="unla-input"
            name="apellido"
            placeholder="Apellido (solo letras)"
            value={form.apellido}
            onChange={(e) => setForm((prev) => ({ ...prev, apellido: e.target.value.replace(/[^\p{L}\s]/gu, '') }))}
          />
          <input
            className="unla-input"
            name="dni"
            placeholder="DNI (8 dígitos)"
            value={form.dni}
            onChange={(e) => setForm((prev) => ({ ...prev, dni: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
            required
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
          <input className="unla-input" name="departamento" placeholder="Departamento" value={form.departamento} onChange={handleChange} />
          <input className="unla-input" name="categoria" placeholder="Categoría" value={form.categoria} onChange={handleChange} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={form.invite}
                onChange={(e) => setForm((prev) => ({ ...prev, invite: e.target.checked }))}
              />
              Invitar por email (sin contraseña)
            </label>
          </div>
          {!form.invite && (
            <input
              className="unla-input"
              name="password"
              placeholder="Contraseña inicial (definida por admin)"
              value={form.password}
              onChange={handleChange}
              type="text"
              required
              style={{ gridColumn: '1 / -1' }}
            />
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <button className="unla-btn" type="submit">{form.invite ? 'Invitar Docente' : 'Crear Docente'}</button>
          </div>
        </form>

        <h2 className="unla-section-title">Listado</h2>
        <div className="unla-table-container">
        <table className="unla-table wide">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>DNI</th>
              <th>Sexo</th>
              <th>Departamento</th>
              <th>Categoría</th>
              <th>Legajo</th>
              <th>Carrera</th>
              <th>Fecha Nac.</th>
              <th>CUIL</th>
              <th>Contraseña</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((u) => {
                const q = filters.q.trim().toLowerCase();
                const matchesQ = !q || [u.email, u.nombre, u.apellido].filter(Boolean).join(' ').toLowerCase().includes(q);
                const matchesRol = filters.rol === 'ALL' || u.rol === filters.rol;
                const matchesEstado = filters.estado === 'ALL' || u.estado === filters.estado;
                return matchesQ && matchesRol && matchesEstado;
              })
              .map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{[u.nombre, u.apellido].filter(Boolean).join(' ')}</td>
                <td>{u.rol}</td>
                <td>{u.estado}</td>
                <td>{u.dni ?? '-'}</td>
                <td>{u.sexo ?? '-'}</td>
                <td>{u.departamento ?? '-'}</td>
                <td>{u.categoria ?? '-'}</td>
                <td>{u.legajo ?? '-'}</td>
                <td>{u.carrera ?? '-'}</td>
                <td>{u.fechaNacimiento ?? '-'}</td>
                <td>{u.cuil ?? '-'}</td>
                <td>{u.password ?? '-'}</td>
                <td>
                  {u.dni && (
                    <button
                      className="unla-btn"
                      onClick={async () => {
                        const res = await dispatch<any>(resetPassword({ id: u.id }));
                        if (res && res.payload) {
                          alert(`Contraseña reseteada a: DNI${u.dni}`);
                        }
                      }}
                      style={{ marginRight: 8 }}
                    >
                      Resetear
                    </button>
                  )}
                  <button
                    className="unla-btn"
                    onClick={async () => {
                      if (confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) {
                        await dispatch<any>(deleteUser({ id: u.id }));
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default UsersList;

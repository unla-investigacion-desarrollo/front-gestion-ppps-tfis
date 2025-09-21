import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectUsers, createOrInviteTeacher, deleteUser, resetPassword } from '../../../../redux/slices/usersSlice';
import '../../../styles/unla.css';

const UsersList: React.FC = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const [form, setForm] = useState({ email: '', nombre: '', apellido: '', departamento: '', categoria: '', invite: true, password: '' });

  useEffect(() => {
    dispatch<any>(fetchUsers());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch<any>(createOrInviteTeacher({ 
      email: form.email,
      nombre: form.nombre,
      apellido: form.apellido,
      departamento: form.departamento,
      categoria: form.categoria,
      invite: form.invite,
      password: form.invite ? undefined : form.password,
    }));
    setForm({ email: '', nombre: '', apellido: '', departamento: '', categoria: '', invite: true, password: '' });
  };

  return (
    <div className="unla-page">
      <div className="unla-card" style={{ maxWidth: 920, margin: '0 auto' }}>
        <h1>Usuarios</h1>

        <h2 className="unla-section-title">Crear/Invitar Docente</h2>
        <form className="unla-form" onSubmit={handleSubmit} style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' as const }}>
          <input className="unla-input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="unla-input" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
          <input className="unla-input" name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} />
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
        <table className="unla-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Contraseña</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{[u.nombre, u.apellido].filter(Boolean).join(' ')}</td>
                <td>{u.rol}</td>
                <td>{u.estado}</td>
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
  );
};

export default UsersList;

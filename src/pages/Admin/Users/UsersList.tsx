import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectUsers, createOrInviteTeacher, deleteUser, resetPassword, activateInvitedTeacher, toggleUserActivation } from '../../../../redux/slices/usersSlice';
import { selectCurrentUser } from '../../../../redux/slices/authSlice';
import '../../../styles/unla.css';

const UsersList: React.FC = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const currentUser = useSelector(selectCurrentUser);
  const isSuperAdmin = !!currentUser?.roles?.includes('SUPER_ADMIN');
  const isAdminOnly = !!currentUser?.roles?.includes('ADMIN') && !isSuperAdmin;
  const canManage = (targetRole: string) => {
    if (isSuperAdmin) return true;
    if (isAdminOnly) return targetRole === 'DOCENTE' || targetRole === 'ESTUDIANTE';
    return false;
  };
  const showActionsColumn = users.some((u) => canManage(u.rol));
  const [form, setForm] = useState({
    email: '',
    nombre: '',
    apellido: '',
    dni: '',
    sexo: '' as '' | 'F' | 'M',
    invite: true,
    password: '',
    rol: 'DOCENTE' as 'DOCENTE' | 'ADMIN',
  });
  const [filters, setFilters] = useState({ q: '', rol: 'ALL', estado: 'ALL' });
  const [activatePw, setActivatePw] = useState<Record<string, string>>({});
  const [dniCheckTeach, setDniCheckTeach] = useState<'idle' | 'checking' | 'free' | 'taken'>('idle');
  const [emailCheck, setEmailCheck] = useState<'idle' | 'checking' | 'free' | 'taken'>('idle');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'email', dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch<any>(fetchUsers());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Debounced DNI availability check for teacher form
  useEffect(() => {
    if (!form.dni || form.dni.length !== 8) {
      setDniCheckTeach('idle');
      return;
    }
    setDniCheckTeach('checking');
    const handle = setTimeout(() => {
      try {
        const raw = localStorage.getItem('users');
        const users = raw ? JSON.parse(raw) : [];
        const exists = users.some((u: any) => (u.dni || '') === form.dni);
        setDniCheckTeach(exists ? 'taken' : 'free');
      } catch {
        setDniCheckTeach('free');
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [form.dni]);

  // Debounced Email availability check
  useEffect(() => {
    const email = (form.email || '').trim().toLowerCase();
    if (!email) {
      setEmailCheck('idle');
      return;
    }
    setEmailCheck('checking');
    const handle = setTimeout(() => {
      try {
        const raw = localStorage.getItem('users');
        const users = raw ? JSON.parse(raw) : [];
        const exists = users.some((u: any) => (u.email || '').toLowerCase() === email);
        setEmailCheck(exists ? 'taken' : 'free');
      } catch {
        setEmailCheck('free');
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [form.email]);

  const toggleSort = (key: string) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const compare = (a: any, b: any, key: string) => {
    const getValue = (u: any) => {
      switch (key) {
        case 'nombreCompleto':
          return [u.nombre, u.apellido].filter(Boolean).join(' ').toLowerCase();
        default:
          return (u[key] ?? '').toString().toLowerCase();
      }
    };
    const va = getValue(a);
    const vb = getValue(b);
    if (va < vb) return -1;
    if (va > vb) return 1;
    return 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones básicas
    if (!form.email) { alert('Email es obligatorio'); return; }
    if (emailCheck === 'taken') { alert('El email ya está en uso'); return; }
    if (!form.nombre || /[^\p{L}\s]/gu.test(form.nombre)) { alert('Nombre debe contener solo letras'); return; }
    if (!form.apellido || /[^\p{L}\s]/gu.test(form.apellido)) { alert('Apellido debe contener solo letras'); return; }
    if (!/^\d{8}$/.test(form.dni)) { alert('DNI debe tener 8 dígitos'); return; }
    if (!form.sexo) { alert('Seleccioná el sexo'); return; }
    if (dniCheckTeach === 'taken') { alert('El DNI ya está en uso'); return; }
    await dispatch<any>(createOrInviteTeacher({ 
      email: form.email,
      nombre: form.nombre,
      apellido: form.apellido,
      dni: form.dni,
      sexo: form.sexo as 'F' | 'M',
      invite: form.invite,
      password: form.invite ? undefined : form.password,
      rol: form.rol,
    }));
    setForm({ email: '', nombre: '', apellido: '', dni: '', sexo: '', invite: true, password: '', rol: 'DOCENTE' });
  };

  return (
    <div className="unla-page">
      <div className="unla-card" style={{ width: '100%', margin: '0 auto' }}>
        <h1>Usuarios</h1>

        <h2 className="unla-section-title">{isSuperAdmin ? 'Crear/Invitar Admin o Docente' : 'Crear/Invitar Docente'}</h2>
        <form className="unla-form" onSubmit={handleSubmit} style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' as const }}>
          {isSuperAdmin && (
            <select
              className="unla-input"
              name="rol"
              value={form.rol}
              onChange={(e) => setForm((prev) => ({ ...prev, rol: e.target.value as 'DOCENTE' | 'ADMIN', invite: e.target.value === 'DOCENTE' ? prev.invite : false }))}
              required
            >
              <option value="DOCENTE">Docente</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}
          <input className="unla-input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <div style={{ gridColumn: '1 / -1' }}>
            {form.email.trim() && emailCheck === 'taken' ? (
              <div className="unla-hint error">El email ya está en uso.</div>
            ) : form.email.trim() && emailCheck === 'checking' ? (
              <div className="unla-hint">Verificando email…</div>
            ) : (
              <div className="unla-hint">Ingresá un email válido. No debe estar registrado.</div>
            )}
          </div>
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
          <div style={{ gridColumn: '1 / -1' }}>
            {form.dni.length === 8 && dniCheckTeach === 'taken' ? (
              <div className="unla-hint error">El DNI ya está en uso.</div>
            ) : form.dni.length === 8 && dniCheckTeach === 'checking' ? (
              <div className="unla-hint">Verificando DNI…</div>
            ) : (
              <div className="unla-hint">Debe contener exactamente 8 dígitos</div>
            )}
          </div>
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
          {/* Campos 'departamento' y 'categoria' eliminados */}
          {form.rol === 'DOCENTE' && (
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
          )}
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
            <button className="unla-btn" type="submit">{form.invite ? `Invitar ${form.rol === 'DOCENTE' ? 'Docente' : 'Usuario'}` : `Crear ${form.rol === 'DOCENTE' ? 'Docente' : 'Admin'}`}</button>
          </div>
        </form>

        <h2 className="unla-section-title">Filtros</h2>
        <div className="unla-form" style={{ gridTemplateColumns: '2fr 1fr 1fr', display: 'grid' as const, marginBottom: 12 }}>
          <input
            className="unla-input"
            placeholder="Buscar por email, nombre o apellido"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <select
            className="unla-input"
            value={filters.rol}
            onChange={(e) => setFilters((f) => ({ ...f, rol: e.target.value }))}
          >
            <option value="ALL">Rol: todos</option>
            <option value="ESTUDIANTE">Estudiante</option>
            <option value="DOCENTE">Docente</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <select
            className="unla-input"
            value={filters.estado}
            onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}
          >
            <option value="ALL">Estado: todos</option>
            <option value="pending">Pendiente</option>
            <option value="active">Activo</option>
            <option value="invited">Invitado</option>
            <option value="rejected">Rechazado</option>
            <option value="disabled">Deshabilitado</option>
          </select>
        </div>

        <h2 className="unla-section-title">Listado</h2>
        <div className="unla-table-container">
        <table className="unla-table wide">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('email')}>
                Email {sort.key === 'email' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('nombreCompleto')}>
                Nombre {sort.key === 'nombreCompleto' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('rol')}>
                Rol {sort.key === 'rol' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('estado')}>
                Estado {sort.key === 'estado' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
              </th>
              {showActionsColumn && <th>Acciones</th>}
              <th>Contraseña</th>
              <th>DNI</th>
              <th>Sexo</th>
              {/* Columnas Departamento y Categoría eliminadas */}
              <th>Legajo</th>
              <th>Carrera</th>
              <th>Fecha Nac.</th>
              <th>CUIL</th>
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
              .sort((a, b) => {
                const dir = sort.dir === 'asc' ? 1 : -1;
                return dir * compare(a, b, sort.key);
              })
              .slice((page - 1) * pageSize, page * pageSize)
              .map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{[u.nombre, u.apellido].filter(Boolean).join(' ')}</td>
                <td>{u.rol}</td>
                <td>{u.estado}</td>
                {showActionsColumn && (
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {canManage(u.rol) && (
                      <>
                    {u.rol === 'DOCENTE' && u.estado === 'invited' && (
                      <>
                        <input
                          className="unla-input"
                          placeholder="Contraseña inicial"
                          value={activatePw[u.id] || ''}
                          onChange={(e) => setActivatePw((m) => ({ ...m, [u.id]: e.target.value }))}
                          style={{ maxWidth: 200 }}
                        />
                        <button
                          type="button"
                          className="unla-btn"
                          title="Activar docente invitado"
                          onClick={async () => {
                            const pwd = (activatePw[u.id] || '').trim();
                            if (pwd.length < 4) { alert('La contraseña debe tener al menos 4 caracteres'); return; }
                            const res = await dispatch<any>(activateInvitedTeacher({ id: u.id, password: pwd }));
                            if (res && !res.error) {
                              setActivatePw((m) => ({ ...m, [u.id]: '' }));
                              alert('Docente activado correctamente');
                            }
                          }}
                        >
                          ✔️ Activar
                        </button>
                      </>
                    )}
                    {u.dni && (
                      <button
                        type="button"
                        className="unla-btn"
                        title="Resetear contraseña a DNI + número"
                        onClick={async () => {
                          const res = await dispatch<any>(resetPassword({ id: u.id }));
                          if (res && res.payload) {
                            alert(`Contraseña reseteada a: DNI${u.dni}`);
                          }
                        }}
                      >
                        ♻️ Resetear
                      </button>
                    )}
                    {u.estado === 'active' ? (
                      <button
                        type="button"
                        className="unla-btn"
                        title="Desactivar cuenta"
                        onClick={async () => {
                          const ok = confirm('¿Desactivar esta cuenta?');
                          if (!ok) return;
                          await dispatch<any>(toggleUserActivation({ id: u.id, enable: false }));
                        }}
                      >
                        ⛔ Desactivar
                      </button>
                    ) : (u.estado === 'disabled' || u.estado === 'rejected') ? (
                      <button
                        type="button"
                        className="unla-btn"
                        title="Activar cuenta"
                        onClick={async () => {
                          const ok = confirm('¿Activar esta cuenta?');
                          if (!ok) return;
                          await dispatch<any>(toggleUserActivation({ id: u.id, enable: true }));
                        }}
                      >
                        ✅ Activar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="unla-btn"
                      title="Eliminar usuario"
                      onClick={async () => {
                        if (confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) {
                          await dispatch<any>(deleteUser({ id: u.id }));
                        }
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                      </>
                    )}
                  </div>
                </td>
                )}
                <td>{(isAdminOnly && (u.rol === 'ADMIN' || u.rol === 'SUPER_ADMIN')) ? '-' : (u.password ?? '-')}</td>
                <td>{u.dni ?? '-'}</td>
                <td>{u.sexo ?? '-'}</td>
                {/* Datos de Departamento y Categoría eliminados */}
                <td>{u.legajo ?? '-'}</td>
                <td>{u.carrera ?? '-'}</td>
                <td>{u.fechaNacimiento ?? '-'}</td>
                <td>{u.cuil ?? '-'}</td>
              </tr>
              ))}
          </tbody>
        </table>
        </div>
        {/* Pagination */}
        {(() => {
          const filteredCount = users.filter((u) => {
            const q = filters.q.trim().toLowerCase();
            const matchesQ = !q || [u.email, u.nombre, u.apellido].filter(Boolean).join(' ').toLowerCase().includes(q);
            const matchesRol = filters.rol === 'ALL' || u.rol === filters.rol;
            const matchesEstado = filters.estado === 'ALL' || u.estado === filters.estado;
            return matchesQ && matchesRol && matchesEstado;
          }).length;
          const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
          const canPrev = page > 1;
          const canNext = page < totalPages;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <div style={{ color: 'var(--unla-muted)' }}>Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredCount)} de {filteredCount}</div>
              <div className="spacer" />
              <button className="unla-btn" type="button" disabled={!canPrev} onClick={() => canPrev && setPage(page - 1)}>Anterior</button>
              <div>Pagina {page} / {totalPages}</div>
              <button className="unla-btn" type="button" disabled={!canNext} onClick={() => canNext && setPage(page + 1)}>Siguiente</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default UsersList;

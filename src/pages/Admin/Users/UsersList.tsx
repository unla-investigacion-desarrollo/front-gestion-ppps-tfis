import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Redux Actions & Selectors
import {
  fetchUsers,
  selectUsers,
  createOrInviteTeacher,
  deleteUser,
  resetPassword,
  activateInvitedTeacher,
  toggleUserActivation
} from '../../../../redux/slices/usersSlice';
import { selectCurrentUser } from '../../../../redux/slices/authSlice';

// Styles & Assets
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../../../styles/unla.css';
import bgImage from '../../../assets/fondo-rojo.jpg';
import './UsersList.css';

// Refactored Subcomponents
import UserForm from './components/UserForm';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import Pagination from '../../../components/Pagination';

/**
 * Componente Contenedor Principal para la Gestión de Usuarios (Vistas de Admin/Super Admin).
 * Orquesta la carga de datos, cálculo de estadísticas, filtrado de datos y visualización interactiva.
 * Incorpora modales de invitación y edición, tarjetas de estadísticas y filtros desacoplados.
 */
const UsersList: React.FC = () => {
  const dispatch = useDispatch();

  // --- SELECTORES DE REDUX ---
  const users = useSelector(selectUsers);
  const currentUser = useSelector(selectCurrentUser);

  // --- LÓGICA DE ROLES Y PERMISOS ---
  const isSuperAdmin = !!currentUser?.roles?.includes('SUPER_ADMIN');
  const isAdminOnly = !!currentUser?.roles?.includes('ADMIN') && !isSuperAdmin;

  const canManage = (targetRole: string) => {
    if (isSuperAdmin) return true;
    if (isAdminOnly) return targetRole === 'DOCENTE' || targetRole === 'ESTUDIANTE';
    return false;
  };

  const showActionsColumn = users.some((u) => canManage(u.rol));

  // --- ESTADO LOCAL ---
  const [filters, setFilters] = useState({ q: '', rol: 'ALL', estado: 'ALL' });
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'email', dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Estados para modales de creación y edición
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Carga inicial
  useEffect(() => {
    dispatch<any>(fetchUsers());
  }, [dispatch]);

  // Reset a la primera página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // --- ESTADÍSTICAS ---
  // Calculadas sobre el total de usuarios en base de datos (excluyendo la papelera de reciclaje)
  const totalCount = users.filter((u) => u.estado !== 'papelera').length;
  const activeCount = users.filter((u) => u.estado === 'active').length;
  const pendingCount = users.filter((u) => u.estado === 'pending' || u.estado === 'invited').length;
  const inactiveCount = users.filter((u) => u.estado === 'disabled' || u.estado === 'rejected').length;

  // --- MANEJADORES DE ACCIONES ---
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
    const va = getValue(a); // renombrar variables de una letra por algo descriptivo
    const vb = getValue(b);
    if (va < vb) return -1;
    if (va > vb) return 1;
    return 0;
  };

  // Crear o Invitar
  const handleCreateOrInvite = async (formData: any) => {
    await dispatch<any>(createOrInviteTeacher(formData));
  };

  // Editar los campos del usuario en localStorage
  const handleEditUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const raw = localStorage.getItem('users');
    const usersList = raw ? JSON.parse(raw) : [];
    const idx = usersList.findIndex((user: any) => user.id === editingUser.id);
    if (idx !== -1) {
      usersList[idx] = {
        ...usersList[idx],
        nombre: editingUser.nombre,
        apellido: editingUser.apellido,
        dni: editingUser.dni,
        legajo: editingUser.legajo,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('users', JSON.stringify(usersList));
      dispatch<any>(fetchUsers());
    }
    setEditingUser(null);
  };

  // Restaurar de papelera
  const handleRestoreUser = async (u: any) => {
    const updated = { ...u, estado: 'active', updatedAt: new Date().toISOString() };
    const raw = localStorage.getItem('users');
    const usersList = raw ? JSON.parse(raw) : [];
    const idx = usersList.findIndex((user: any) => user.id === u.id);
    if (idx !== -1) {
      usersList[idx] = updated;
      localStorage.setItem('users', JSON.stringify(usersList));
      dispatch<any>(fetchUsers());
    }
  };

  // Eliminar definitivo
  const handleDeletePermanently = async (u: any) => {
    if (window.confirm('¿Eliminar definitivamente este usuario?')) { // revisar si es necesario
      const raw = localStorage.getItem('users');
      const usersList = raw ? JSON.parse(raw) : [];
      const updated = usersList.filter((user: any) => user.id !== u.id);
      localStorage.setItem('users', JSON.stringify(updated));
      dispatch<any>(fetchUsers());
    }
  };

  // Activar docente invitado
  const handleActivateTeacher = async (id: string, pwd: string, clearPassword: () => void) => {
    if (pwd.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    const res = await dispatch<any>(activateInvitedTeacher({ id, password: pwd }));
    if (res && !res.error) {
      clearPassword();
      alert('Docente activado correctamente');
    }
  };

  // Resetear contraseña
  const handleResetPassword = async (u: any) => {
    const res = await dispatch<any>(resetPassword({ id: u.id }));
    if (res && res.payload) {
      if (isSuperAdmin) {
        const nuevaPass = res.payload.password || (u.dni ? `DNI${u.dni}` : 'alumno123');
        alert(`Contraseña reseteada a: ${nuevaPass}`); // reemplazar todos los alert por algo copado
      } else {
        alert('Contraseña reseteada correctamente');
      }
    }
  };

  // Habilitar/Deshabilitar cuenta
  const handleToggleActivation = async (id: string, enable: boolean) => {
    const actionLabel = enable ? 'Activar' : 'Desactivar';
    const ok = confirm(`¿${actionLabel} esta cuenta?`);
    if (!ok) return;
    await dispatch<any>(toggleUserActivation({ id, enable }));
  };

  // Soft delete (Papelera)
  const handleDeleteUser = async (id: string) => {
    if (confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) { // ver si volamos la papelera
      await dispatch<any>(deleteUser({ id }));
    }
  };

  // Limpiar filtros a valores iniciales
  const handleClearFilters = () => {
    setFilters({ q: '', rol: 'ALL', estado: 'ALL' });
  };

  // --- PROCESAMIENTO DE DATOS ---
  const allFilteredUsers = users.filter((u) => {
    const q = filters.q.trim().toLowerCase();
    const matchesQ = !q || [u.email, u.nombre, u.apellido].filter(Boolean).join(' ').toLowerCase().includes(q);
    const matchesRol = filters.rol === 'ALL' || u.rol === filters.rol;
    const matchesEstado = filters.estado === 'papelera'
      ? u.estado === 'papelera'
      : (filters.estado === 'ALL' || u.estado === filters.estado) && u.estado !== 'papelera';
    return matchesQ && matchesRol && matchesEstado;
  });

  const sortedUsers = [...allFilteredUsers].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return dir * compare(a, b, sort.key);
  });

  const paginatedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      className="unla-page users-page-container"
      style={{
        backgroundImage: `url(${bgImage})`
      }}
    >
      <div className="unla-card users-card-main">

        {/* Cabecera principal con Título, Subtítulo y Botón de Invitación */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="m-0 users-title">Usuarios</h1>
            <p className="m-0 text-muted users-subtitle">Gestioná los docentes del sistema</p>
          </div>
          <button
            type="button"
            className="btn btn-invite-teacher d-flex align-items-center gap-2"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <span>+</span> Invitar docente
          </button>
        </div>

        {/* Sección 1: Tarjetas de estadísticas */}
        <div className="row g-3 mb-4">
          {/* Card: Total */}
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-total">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <div className="stat-label">Total docentes</div>
                <div className="stat-value">{totalCount}</div>
              </div>
            </div>
          </div>

          {/* Card: Activos */}
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-active">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div>
                <div className="stat-label">Activos</div>
                <div className="stat-value">{activeCount}</div>
              </div>
            </div>
          </div>

          {/* Card: Pendientes */}
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-pending">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              </div>
              <div>
                <div className="stat-label">Pendientes</div>
                <div className="stat-value">{pendingCount}</div>
              </div>
            </div>
          </div>

          {/* Card: Inactivos */}
          <div className="col-md-3">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-inactive">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm10-5h-8v2h8V9z" />
                </svg>
              </div>
              <div>
                <div className="stat-label">Inactivos</div>
                <div className="stat-value">{inactiveCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Filtros de Búsqueda Desacoplados */}
        <UserFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Barra del Listado con Interruptor para ver Papelera */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="m-0 list-section-title">Listado de usuarios</h2>
          <button
            className="btn btn-sm btn-secondary btn-toggle-trash"
            onClick={() => setFilters(f => ({ ...f, estado: f.estado === 'papelera' ? 'ALL' : 'papelera' }))}
          >
            {filters.estado === 'papelera' ? 'Ver activos' : 'Ver papelera'}
          </button>
        </div>

        {/* Sección 3: Tabla de Usuarios */}
        <UserTable
          users={paginatedUsers}
          isSuperAdmin={isSuperAdmin}
          showActionsColumn={showActionsColumn}
          canManage={canManage}
          sort={sort}
          onToggleSort={toggleSort}
          onRestoreUser={handleRestoreUser}
          onDeletePermanently={handleDeletePermanently}
          onActivateTeacher={handleActivateTeacher}
          onResetPassword={handleResetPassword}
          onToggleActivation={handleToggleActivation}
          onDeleteUser={handleDeleteUser}
          onEditClick={(user) => setEditingUser(user)}
          filtersEstado={filters.estado}
        />

        {/* Sección 4: Paginación */}
        <Pagination
          currentPage={page}
          totalItems={allFilteredUsers.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* --- MODAL PARA CREAR/INVITAR DOCENTES --- */}
      {isInviteModalOpen && (
        <>
          <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary)' }}>
                    {isSuperAdmin ? 'Crear / Invitar Usuario' : 'Crear / Invitar Docente'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsInviteModalOpen(false)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body custom-modal-body">
                  <UserForm
                    isSuperAdmin={isSuperAdmin}
                    onSubmit={async (data) => {
                      await handleCreateOrInvite(data);
                      setIsInviteModalOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="custom-modal-backdrop" />
        </>
      )}

      {/* --- MODAL PARA EDITAR INFORMACIÓN DE USUARIOS --- */}
      {editingUser && (
        <>
          <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary)' }}>
                    Editar Usuario: {editingUser.email}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditingUser(null)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleEditUser}>
                  <div className="modal-body custom-modal-body d-flex flex-column gap-3">
                    <div>
                      <label className="form-label" style={{ fontWeight: 500 }}>Nombre</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editingUser.nombre || ''}
                        onChange={(e) => setEditingUser((u: any) => ({ ...u, nombre: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 500 }}>Apellido</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editingUser.apellido || ''}
                        onChange={(e) => setEditingUser((u: any) => ({ ...u, apellido: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 500 }}>DNI</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        maxLength={8}
                        value={editingUser.dni || ''}
                        onChange={(e) => setEditingUser((u: any) => ({ ...u, dni: e.target.value.replace(/\D/g, '') }))}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 500 }}>Legajo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingUser.legajo || ''}
                        onChange={(e) => setEditingUser((u: any) => ({ ...u, legajo: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="modal-footer custom-modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setEditingUser(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ backgroundColor: 'var(--unla-primary)', border: 'none' }}
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="custom-modal-backdrop" />
        </>
      )}

    </div>
  );
};

export default UsersList;

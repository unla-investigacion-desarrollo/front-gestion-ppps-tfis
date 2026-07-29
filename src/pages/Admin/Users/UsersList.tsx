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

// Refactored Subcomponents
import UserForm from './components/UserForm';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import Pagination from '../../../components/Pagination';

/**
 * Componente Contenedor Principal para la Gestión de Usuarios (Vistas de Admin/Super Admin).
 * Orquesta la carga de datos desde Redux, el filtrado, ordenado y paginado del listado de usuarios,
 * y delega la renderización visual a subcomponentes especializados y reutilizables.
 */
const UsersList: React.FC = () => {
  const dispatch = useDispatch();

  // --- SELECTORES DE REDUX (ESTADO GLOBAL) ---
  const users = useSelector(selectUsers);
  const currentUser = useSelector(selectCurrentUser);

  // --- LÓGICA DE ROLES Y PERMISOS ---
  // Determina si el usuario logueado posee rol SUPER_ADMIN o únicamente ADMIN
  const isSuperAdmin = !!currentUser?.roles?.includes('SUPER_ADMIN');
  const isAdminOnly = !!currentUser?.roles?.includes('ADMIN') && !isSuperAdmin;

  // Evalúa si el usuario autenticado tiene permisos para gestionar a un usuario con determinado rol
  const canManage = (targetRole: string) => {
    if (isSuperAdmin) return true;
    if (isAdminOnly) return targetRole === 'DOCENTE' || targetRole === 'ESTUDIANTE';
    return false;
  };

  // Verifica si al menos uno de los usuarios en la lista actual puede ser gestionado (para mostrar/ocultar la columna acciones)
  const showActionsColumn = users.some((u) => canManage(u.rol));

  // --- ESTADO LOCAL ---
  const [filters, setFilters] = useState({ q: '', rol: 'ALL', estado: 'ALL' });
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'email', dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // --- EFECTOS (SIDE EFFECTS) ---
  // Carga inicial de la lista de usuarios al montar el componente
  useEffect(() => {
    dispatch<any>(fetchUsers());
  }, [dispatch]);

  // Resetea a la primera página cuando cambian los criterios de búsqueda/filtros
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // --- MANEJADORES DE ORDENAMIENTO (SORTING) ---
  // Alterna la dirección de ordenación de una columna específica
  const toggleSort = (key: string) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Función de comparación para ordenar strings/atributos del usuario
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

  // --- MANEJADORES DE ACCIONES (API CALLS & REDUX DISPATCH) ---

  // Crea un nuevo usuario o envía una invitación por email
  const handleCreateOrInvite = async (formData: any) => {
    await dispatch<any>(createOrInviteTeacher(formData));
  };

  // Restaura un usuario desde la papelera de reciclaje local
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

  // Elimina de forma definitiva al usuario del almacenamiento local (localStorage)
  const handleDeletePermanently = async (u: any) => {
    if (window.confirm('¿Eliminar definitivamente este usuario?')) {
      const raw = localStorage.getItem('users');
      const usersList = raw ? JSON.parse(raw) : [];
      const updated = usersList.filter((user: any) => user.id !== u.id);
      localStorage.setItem('users', JSON.stringify(updated));
      dispatch<any>(fetchUsers());
    }
  };

  // Asigna contraseña inicial y activa la cuenta de un docente invitado
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

  // Resetea la contraseña de un usuario (para Admin/Super Admin)
  const handleResetPassword = async (u: any) => {
    const res = await dispatch<any>(resetPassword({ id: u.id }));
    if (res && res.payload) {
      if (isSuperAdmin) {
        const nuevaPass = res.payload.password || (u.dni ? `DNI${u.dni}` : 'alumno123');
        alert(`Contraseña reseteada a: ${nuevaPass}`);
      } else {
        alert('Contraseña reseteada correctamente');
      }
    }
  };

  // Habilita o deshabilita temporalmente una cuenta de usuario
  const handleToggleActivation = async (id: string, enable: boolean) => {
    const actionLabel = enable ? 'Activar' : 'Desactivar';
    const ok = confirm(`¿${actionLabel} esta cuenta?`);
    if (!ok) return;
    await dispatch<any>(toggleUserActivation({ id, enable }));
  };

  // Envía un usuario a la papelera (soft delete)
  const handleDeleteUser = async (id: string) => {
    if (confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) {
      await dispatch<any>(deleteUser({ id }));
    }
  };

  // --- PROCESAMIENTO DE DATOS (FILTRADO, ORDENADO Y PAGINACIÓN) ---

  // Aplica los filtros de búsqueda por query, rol y estado.
  // Nota: Si el estado buscado es 'papelera', mostramos solo papelera; de lo contrario, excluimos papelera.
  const allFilteredUsers = users.filter((u) => {
    const q = filters.q.trim().toLowerCase();
    const matchesQ = !q || [u.email, u.nombre, u.apellido].filter(Boolean).join(' ').toLowerCase().includes(q);
    const matchesRol = filters.rol === 'ALL' || u.rol === filters.rol;
    const matchesEstado = filters.estado === 'papelera'
      ? u.estado === 'papelera'
      : (filters.estado === 'ALL' || u.estado === filters.estado) && u.estado !== 'papelera';
    return matchesQ && matchesRol && matchesEstado;
  });

  // Ordenación de la lista filtrada
  const sortedUsers = [...allFilteredUsers].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return dir * compare(a, b, sort.key);
  });

  // Segmentación del listado según la paginación actual
  const paginatedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      className="unla-page"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '16px'
      }}
    >
      <div className="unla-card" style={{ width: '100%', margin: '0 auto' }}>
        <h1>Usuarios</h1>

        {/* Sección Formulario de Creación/Invitación */}
        <UserForm
          isSuperAdmin={isSuperAdmin}
          onSubmit={handleCreateOrInvite}
        />

        {/* Sección de Filtros de Búsqueda */}
        <UserFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Barra informativa del Listado e interruptor de la Papelera de reciclaje */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <h2 className="unla-section-title" style={{ margin: 0 }}>Listado</h2>
          <button
            className="btn btn-secondary"
            style={{ fontWeight: 600, padding: '6px 18px' }}
            onClick={() => setFilters(f => ({ ...f, estado: f.estado === 'papelera' ? 'ALL' : 'papelera' }))}
          >
            {filters.estado === 'papelera' ? 'Ver activos' : 'Ver papelera'}
          </button>
        </div>

        {/* Tabla Principal de Usuarios */}
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
          filtersEstado={filters.estado}
        />

        {/* Componente Genérico de Paginación */}
        <Pagination
          currentPage={page}
          totalItems={allFilteredUsers.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default UsersList;

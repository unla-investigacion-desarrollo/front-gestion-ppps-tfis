import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Redux Actions & Selectors
import {
  fetchUsers,
  selectUsers,
  createOrInviteTeacher,
  registerProfessor,
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
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import Pagination from '../../../components/Pagination';
import InviteTeacherModal from './components/InviteTeacherModal';
import CreateTeacherModal from './components/CreateTeacherModal';
import { userService } from '../../../services/userService';


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

  // Estados para modales de creación, edición, eliminación y detalles del usuario
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [activatingTeacher, setActivatingTeacher] = useState<any | null>(null);
  const [activatePasswordVal, setActivatePasswordVal] = useState('');
  const [isCreateTeacherModalOpen, setIsCreateTeacherModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  // Preparar estado del usuario para editar
  const handleStartEdit = (user: any) => {
    const roleMap: Record<string, string> = {
      student: 'ESTUDIANTE',
      professor: 'DOCENTE',
      admin: 'ADMIN',
      ESTUDIANTE: 'ESTUDIANTE',
      DOCENTE: 'DOCENTE',
      ADMIN: 'ADMIN',
      SUPER_ADMIN: 'SUPER_ADMIN',
    };

    const normalizedRole = roleMap[user.role] || roleMap[user.rol] || user.rol || user.role;

    setEditingUser({
      ...user,
      nombre: user.nombre || user.firstName || '',
      apellido: user.apellido || user.lastName || '',
      dni: user.dni || '',
      email: user.email || '',
      rol: normalizedRole,
      yearOfAdmission: user.yearOfAdmission || '',
      completedCoursesWithFinal: user.completedCoursesWithFinal ?? 0,
      completedCoursesWithoutFinal: user.completedCoursesWithoutFinal ?? 0,
      specialization: user.specialization || user.categoria || '',
      isTutor: !!user.isTutor,
    });
  };

  // Editar los campos del usuario en el backend
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token') || '';
      const userId = editingUser.id;

      const updateData: any = {
        firstName: editingUser.nombre,
        lastName: editingUser.apellido,
        dni: editingUser.dni,
        email: editingUser.email,
      };

      if (editingUser.rol === 'ESTUDIANTE') {
        updateData.yearOfAdmission = Number(editingUser.yearOfAdmission);
        updateData.completedCoursesWithFinal = Number(editingUser.completedCoursesWithFinal);
        updateData.completedCoursesWithoutFinal = Number(editingUser.completedCoursesWithoutFinal);
      } else if (editingUser.rol === 'DOCENTE') {
        updateData.specialization = editingUser.specialization;
        updateData.isTutor = !!editingUser.isTutor;
      }

      await userService.updateUser(userId, token, updateData);

      // También actualizamos en localStorage local para la simulación
      const raw = localStorage.getItem('users');
      const usersList = raw ? JSON.parse(raw) : [];
      const idx = usersList.findIndex((user: any) => user.id === editingUser.id);
      if (idx !== -1) {
        usersList[idx] = {
          ...usersList[idx],
          nombre: editingUser.nombre,
          apellido: editingUser.apellido,
          firstName: editingUser.nombre,
          lastName: editingUser.apellido,
          dni: editingUser.dni,
          email: editingUser.email,
          yearOfAdmission: updateData.yearOfAdmission,
          completedCoursesWithFinal: updateData.completedCoursesWithFinal,
          completedCoursesWithoutFinal: updateData.completedCoursesWithoutFinal,
          specialization: updateData.specialization,
          categoria: updateData.specialization,
          isTutor: updateData.isTutor,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify(usersList));
      }
      
      dispatch<any>(fetchUsers());
      alert('Usuario actualizado correctamente');
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      alert(error.message || 'Error al actualizar el usuario');
    } finally {
      setEditingUser(null);
    }
  };

  // Ver detalles completos del usuario en otra pantalla
  const handleViewUser = async (user: any) => {
    setLoadingDetail(true);
    try {
      const token = localStorage.getItem('token') || '';
      const userId = user.id;
      const data = await userService.getUserProfile(userId, token);
      
      const roleMap: Record<string, string> = {
        student: 'ESTUDIANTE',
        professor: 'DOCENTE',
        admin: 'ADMIN',
        ESTUDIANTE: 'ESTUDIANTE',
        DOCENTE: 'DOCENTE',
        ADMIN: 'ADMIN',
        SUPER_ADMIN: 'SUPER_ADMIN',
      };

      const normalizedRole = roleMap[data.role] || roleMap[user.rol] || user.rol || data.role;

      setSelectedUserDetail({
        ...user,
        ...data,
        nombre: data.firstName || user.nombre || user.firstName,
        apellido: data.lastName || user.apellido || user.lastName,
        rol: normalizedRole,
      });
    } catch (error: any) {
      console.error('Error al obtener detalles del usuario:', error);
      // Fallback a los datos locales si falla la petición (útil para usuarios mock)
      setSelectedUserDetail(user);
    } finally {
      setSelectedUserDetail(prev => prev ? prev : user); // En caso de que se retorne vacío
      setLoadingDetail(false);
    }
  };

  // Activar docente invitado desde modal
  const handleActivateTeacherSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activatingTeacher) return;
    if (activatePasswordVal.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    const res = await dispatch<any>(activateInvitedTeacher({ id: activatingTeacher.id, password: activatePasswordVal }));
    if (res && !res.error) {
      alert('Docente activado correctamente');
      setActivatingTeacher(null);
      setActivatePasswordVal('');
    }
  };

  // Crear docente mediante registro directo en el backend
  const handleCreateTeacherSubmit = async (formData: any) => {
    try {
      const res = await dispatch<any>(registerProfessor({
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        email: formData.email,
        password: formData.password,
        specialization: formData.specialization,
        isTutor: formData.isTutor,
      }));
      
      if (res.error) {
        alert(res.payload || 'Error al registrar el docente');
      } else {
        alert('Docente registrado y creado correctamente');
        setIsCreateTeacherModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Error al procesar la solicitud');
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

  // Iniciar proceso de eliminación (abrir modal de confirmación)
  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem('token') || '';
      const userId = userToDelete.id;
      await userService.deleteUser(userId, token);

      // Eliminar de localStorage para coherencia en el mockup local
      const raw = localStorage.getItem('users');
      const usersList = raw ? JSON.parse(raw) : [];
      const updated = usersList.filter((u: any) => u.id !== userToDelete.id);
      localStorage.setItem('users', JSON.stringify(updated));

      dispatch<any>(fetchUsers());
      alert('Usuario eliminado correctamente');
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      alert(error.message || 'Error al eliminar el usuario');
    } finally {
      setUserToDelete(null);
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
    const matchesEstado = (filters.estado === 'ALL' || u.estado === filters.estado) && u.estado !== 'papelera';
    return matchesQ && matchesRol && matchesEstado;
  });

  const sortedUsers = [...allFilteredUsers].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return dir * compare(a, b, sort.key);
  });

  const paginatedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

  if (selectedUserDetail) {
    return (
      <div className="unla-page users-page-container">
        <div className="unla-card users-card-main">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div>
              <h1 className="m-0 users-title">Detalles del Usuario</h1>
              <p className="m-0 text-muted users-subtitle">Información completa de {selectedUserDetail.email}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary d-flex align-items-center gap-2"
              onClick={() => setSelectedUserDetail(null)}
              style={{ fontWeight: '600' }}
            >
              ← Volver al listado
            </button>
          </div>

          {/* Details Body */}
          <div className="row g-4">
            {/* Tarjeta de Información General */}
            <div className="col-md-6">
              <div className="card shadow-sm h-100" style={{ borderRadius: '12px', border: '1px solid var(--unla-border)' }}>
                <div className="card-header bg-light py-3" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                  <h5 className="m-0 mb-0 font-weight-bold" style={{ color: 'var(--unla-primary)', fontWeight: 600 }}>Información General</h5>
                </div>
                <div className="card-body d-flex flex-column gap-3">
                  <div>
                    <span className="text-muted d-block small">Nombre completo</span>
                    <strong style={{ fontSize: '18px' }}>
                      {[selectedUserDetail.nombre || selectedUserDetail.firstName, selectedUserDetail.apellido || selectedUserDetail.lastName].filter(Boolean).join(' ') || 'Sin nombre'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted d-block small">Email</span>
                    <strong>{selectedUserDetail.email || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-muted d-block small">DNI</span>
                    <strong>{selectedUserDetail.dni || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-muted d-block small">Rol del Sistema</span>
                    <span className="badge mt-1" style={{
                      backgroundColor: selectedUserDetail.rol === 'ESTUDIANTE' ? '#fae8ff' : (selectedUserDetail.rol === 'DOCENTE' ? '#e0f2fe' : '#dcfce7'),
                      color: selectedUserDetail.rol === 'ESTUDIANTE' ? '#a21caf' : (selectedUserDetail.rol === 'DOCENTE' ? '#0369a1' : '#15803d'),
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '16px'
                    }}>
                      {selectedUserDetail.rol || selectedUserDetail.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted d-block small">Estado de la cuenta</span>
                    <strong className="text-capitalize">{selectedUserDetail.estado || '-'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Información de Rol Específico */}
            <div className="col-md-6">
              {(selectedUserDetail.rol === 'ESTUDIANTE' || selectedUserDetail.role === 'ESTUDIANTE') ? (
                <div className="card shadow-sm h-100" style={{ borderRadius: '12px', border: '1px solid var(--unla-border)' }}>
                  <div className="card-header bg-light py-3" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                    <h5 className="m-0 mb-0 font-weight-bold text-success" style={{ fontWeight: 600 }}>Detalles del Estudiante</h5>
                  </div>
                  <div className="card-body d-flex flex-column gap-3">
                    <div>
                      <span className="text-muted d-block small">Año de Ingreso</span>
                      <strong style={{ fontSize: '18px' }}>{selectedUserDetail.yearOfAdmission || 'No especificado'}</strong>
                    </div>
                    <div>
                      <span className="text-muted d-block small">Materias aprobadas con final</span>
                      <strong style={{ fontSize: '18px' }}>{selectedUserDetail.completedCoursesWithFinal ?? '0'}</strong>
                    </div>
                    <div>
                      <span className="text-muted d-block small">Materias cursadas sin final</span>
                      <strong style={{ fontSize: '18px' }}>{selectedUserDetail.completedCoursesWithoutFinal ?? '0'}</strong>
                    </div>
                  </div>
                </div>
              ) : (selectedUserDetail.rol === 'DOCENTE' || selectedUserDetail.role === 'DOCENTE') ? (
                <div className="card shadow-sm h-100" style={{ borderRadius: '12px', border: '1px solid var(--unla-border)' }}>
                  <div className="card-header bg-light py-3" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                    <h5 className="m-0 mb-0 font-weight-bold text-primary" style={{ fontWeight: 600 }}>Detalles del Docente</h5>
                  </div>
                  <div className="card-body d-flex flex-column gap-3">
                    <div>
                      <span className="text-muted d-block small">Especialidad / Categoría</span>
                      <strong style={{ fontSize: '18px' }}>{selectedUserDetail.specialization || selectedUserDetail.categoria || 'No especificada'}</strong>
                    </div>
                    <div>
                      <span className="text-muted d-block small">¿Es Tutor de Proyectos?</span>
                      <strong style={{ fontSize: '18px' }}>
                        {selectedUserDetail.isTutor ? 'Sí' : 'No'}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card shadow-sm h-100 d-flex align-items-center justify-content-center border-0 bg-transparent">
                  <div className="text-center p-4 text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-info-circle mb-3" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                    </svg>
                    <p className="mb-0">Los usuarios administradores no poseen información adicional específica.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="unla-page users-page-container">
      <div className="unla-card users-card-main">

        {/* Cabecera principal con Título, Subtítulo y Botón de Invitación */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="m-0 users-title">Usuarios</h1>
            <p className="m-0 text-muted users-subtitle">Gestioná los usuarios del sistema</p>
          </div>
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-invite-teacher d-flex align-items-center justify-content-center"
              id="dropdownAddUser"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ fontSize: '22px', fontWeight: 'bold', width: '42px', height: '42px', padding: 0, borderRadius: '50%' }}
              title="Agregar usuario"
            >
              +
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="dropdownAddUser" style={{ marginTop: '8px', zIndex: 1010 }}>
              <li>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center gap-2 py-2"
                  onClick={() => setIsInviteModalOpen(true)}
                  style={{ fontSize: '14px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-envelope" viewBox="0 0 16 16">
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/>
                  </svg>
                  Invitar docente (correo)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center gap-2 py-2"
                  onClick={() => setIsCreateTeacherModalOpen(true)}
                  style={{ fontSize: '14px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-plus" viewBox="0 0 16 16">
                    <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                    <path fillRule="evenodd" d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5"/>
                  </svg>
                  Crear docente (directo)
                </button>
              </li>
            </ul>
          </div>
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

        {/* Barra del Listado */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="m-0 list-section-title">Listado de usuarios</h2>
        </div>

        {/* Sección 3: Tabla de Usuarios */}
        <UserTable
          users={paginatedUsers}
          isSuperAdmin={isSuperAdmin}
          showActionsColumn={showActionsColumn}
          canManage={canManage}
          sort={sort}
          onToggleSort={toggleSort}
          onActivateClick={(user) => setActivatingTeacher(user)}
          onResetPassword={handleResetPassword}
          onToggleActivation={handleToggleActivation}
          onDeleteUser={handleDeleteUser}
          onEditClick={handleStartEdit}
          onViewClick={handleViewUser}
        />

        {/* Espaciador flexible para empujar la paginación al fondo */}
        <div style={{ flexGrow: 1 }} />

        {/* Sección 4: Paginación */}
        <Pagination
          currentPage={page}
          totalItems={allFilteredUsers.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* --- MODAL PARA CREAR/INVITAR DOCENTES --- */}
      <InviteTeacherModal
        isOpen={isInviteModalOpen}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleCreateOrInvite}
      />

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
                      <label className="form-label" style={{ fontWeight: 500 }}>Email</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={editingUser.email || ''}
                        onChange={(e) => setEditingUser((u: any) => ({ ...u, email: e.target.value }))}
                      />
                    </div>
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

                    {/* Campos específicos de Estudiante */}
                    {editingUser.rol === 'ESTUDIANTE' && (
                      <>
                        <div>
                          <label className="form-label" style={{ fontWeight: 500 }}>Año de Ingreso</label>
                          <input
                            type="number"
                            className="form-control"
                            required
                            value={editingUser.yearOfAdmission || ''}
                            onChange={(e) => setEditingUser((u: any) => ({ ...u, yearOfAdmission: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontWeight: 500 }}>Materias aprobadas con final</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editingUser.completedCoursesWithFinal ?? ''}
                            onChange={(e) => setEditingUser((u: any) => ({ ...u, completedCoursesWithFinal: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontWeight: 500 }}>Materias cursadas sin final</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editingUser.completedCoursesWithoutFinal ?? ''}
                            onChange={(e) => setEditingUser((u: any) => ({ ...u, completedCoursesWithoutFinal: e.target.value }))}
                          />
                        </div>
                      </>
                    )}

                    {/* Campos específicos de Docente */}
                    {editingUser.rol === 'DOCENTE' && (
                      <>
                        <div>
                          <label className="form-label" style={{ fontWeight: 500 }}>Especialidad / Categoría</label>
                          <input
                            type="text"
                            className="form-control"
                            required
                            value={editingUser.specialization || ''}
                            onChange={(e) => setEditingUser((u: any) => ({ ...u, specialization: e.target.value }))}
                          />
                        </div>
                        <div className="form-check mt-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="isTutorEdit"
                            checked={!!editingUser.isTutor}
                            onChange={(e) => setEditingUser((u: any) => ({ ...u, isTutor: e.target.checked }))}
                          />
                          <label className="form-check-label" htmlFor="isTutorEdit" style={{ fontWeight: 500 }}>
                            ¿Es Tutor?
                          </label>
                        </div>
                      </>
                    )}
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

      {/* --- MODAL PARA ACTIVAR DOCENTES INVITADOS --- */}
      {activatingTeacher && (
        <>
          <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary)' }}>
                    Activar Docente: {activatingTeacher.email}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setActivatingTeacher(null);
                      setActivatePasswordVal('');
                    }}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleActivateTeacherSubmit}>
                  <div className="modal-body custom-modal-body d-flex flex-column gap-3">
                    <div>
                      <p className="text-muted small mb-3">
                        Para activar la cuenta de este docente invitado, por favor ingresá una contraseña inicial.
                      </p>
                      <label className="form-label" style={{ fontWeight: 500 }}>Contraseña inicial</label>
                      <input
                        type="password"
                        className="form-control"
                        required
                        minLength={4}
                        autoComplete="new-password"
                        placeholder="Mínimo 4 caracteres"
                        value={activatePasswordVal}
                        onChange={(e) => setActivatePasswordVal(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer custom-modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setActivatingTeacher(null);
                        setActivatePasswordVal('');
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                    >
                      Activar Docente
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="custom-modal-backdrop" />
        </>
      )}

      {/* --- MODAL PARA CREAR DOCENTE DIRECTO --- */}
      <CreateTeacherModal
        isOpen={isCreateTeacherModalOpen}
        onClose={() => setIsCreateTeacherModalOpen(false)}
        onSubmit={handleCreateTeacherSubmit}
      />

      {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
      {userToDelete && (
        <>
          <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1} style={{ display: 'block' }}>
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary)' }}>
                    Confirmar Eliminación
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setUserToDelete(null)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body custom-modal-body text-center py-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="var(--unla-primary)" className="bi bi-exclamation-triangle mb-3" viewBox="0 0 16 16">
                    <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"/>
                    <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                  </svg>
                  <p className="mb-0" style={{ fontSize: '18px', fontWeight: 500 }}>
                    ¿Está seguro de que desea eliminar al usuario <strong>{userToDelete.email}</strong>?
                  </p>
                  <p className="text-muted small mt-2">
                    Esta acción lo eliminará definitivamente de la base de datos.
                  </p>
                </div>
                <div className="modal-footer custom-modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setUserToDelete(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleConfirmDelete}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="custom-modal-backdrop" />
        </>
      )}

      {loadingDetail && (
        <div className="custom-modal-backdrop d-flex align-items-center justify-content-center" style={{ zIndex: 2000 }}>
          <div className="spinner-border text-light" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando detalles...</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsersList;

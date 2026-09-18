import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Redux Actions & Selectors
import {
  fetchUsers,
  selectUsers,
  createOrInviteTeacher,
  registerProfessor,
  registerAdmin,
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
import { showToast } from '../../../utils/toast';
import {
  FaCircleInfo,
  FaEnvelope,
  FaUserPlus,
  FaUser,
  FaCircleCheck,
  FaClock,
  FaUserXmark,
  FaTriangleExclamation,
} from 'react-icons/fa6';

// Refactored Subcomponents
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import Pagination from '../../../components/Pagination';
import InviteTeacherModal from './components/InviteTeacherModal';
import CreateTeacherModal from './components/CreateTeacherModal';
import { userService } from '../../../services/userService';


/**
 * Componente contenedor principal para la gestión de usuarios por administradores.
 * Orquesta la carga de datos, cálculo de estadísticas, filtrado de datos y visualización interactiva.
 * Incorpora modales de invitación y edición, tarjetas de estadísticas y filtros desacoplados.
 */
const UsersList: React.FC = () => {
  const dispatch = useDispatch();

  // --- SELECTORES DE REDUX ---
  const users = useSelector(selectUsers);
  const currentUser = useSelector(selectCurrentUser);

  // --- LÓGICA DE ROLES Y PERMISOS ---
  const isAdmin = !!currentUser?.roles?.some((role) => ['ADMIN', 'ADMINISTRADOR'].includes(role));

  const isCurrentUser = (user: any) => (
    !!currentUser?.id && String(user?.id) === String(currentUser.id)
  );

  const canManage = (targetRole: string, targetUser?: any) => {
    if (isAdmin && !isCurrentUser(targetUser)) return ['DOCENTE', 'ADMIN', 'ESTUDIANTE'].includes(targetRole);
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
  const [creationRole, setCreationRole] = useState<'DOCENTE' | 'ADMIN'>('DOCENTE');
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
    };

    const normalizedRole = roleMap[user.role] || roleMap[user.rol] || user.rol || user.role;

    setEditingUser({
      ...user,
      nombre: user.nombre || user.firstName || '',
      apellido: user.apellido || user.lastName || '',
      dni: user.dni || '',
      email: user.email || '',
      rol: normalizedRole,
      legajo: user.legajo || user.fileNumber || '',
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
        fileNumber: editingUser.legajo,
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
          rol: editingUser.rol,
          legajo: editingUser.legajo,
          fileNumber: editingUser.legajo,
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
      showToast('Usuario actualizado correctamente', 'success');
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      showToast(error.message || 'Error al actualizar el usuario', 'error');
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
      };

      const normalizedRole = roleMap[data.role] || roleMap[user.rol] || user.rol || data.role;

      setSelectedUserDetail({
        ...user,
        ...data,
        nombre: data.firstName || user.nombre || user.firstName,
        apellido: data.lastName || user.apellido || user.lastName,
        rol: normalizedRole,
        legajo: data.fileNumber || data.legajo || user.legajo || user.fileNumber,
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
      showToast('La contraseña debe tener al menos 4 caracteres', 'error');
      return;
    }
    const res = await dispatch<any>(activateInvitedTeacher({ id: activatingTeacher.id, password: activatePasswordVal }));
    if (res && !res.error) {
      showToast('Docente activado correctamente', 'success');
      setActivatingTeacher(null);
      setActivatePasswordVal('');
    }
  };

  // Crear docente mediante registro directo en el backend
  const handleCreateTeacherSubmit = async (formData: any): Promise<boolean> => {
    try {
      if (formData.rol === 'ADMIN') {
        const res = await dispatch<any>(registerAdmin({
          nombre: formData.nombre,
          apellido: formData.apellido,
          dni: formData.dni,
          email: formData.email,
          password: formData.password,
        }));

        if (res.error) {
          showToast(res.payload || 'Error al registrar el administrador', 'error');
        } else {
          showToast('Administrador creado correctamente', 'success');
          setIsCreateTeacherModalOpen(false);
          dispatch<any>(fetchUsers());
        }
        return !res.error;
      }

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
        showToast(res.payload || 'Error al registrar el docente', 'error');
      } else {
        try {
          const raw = localStorage.getItem('users');
          const usersList = raw ? JSON.parse(raw) : [];
          const idx = usersList.findIndex((u: any) => u.email?.toLowerCase().trim() === formData.email?.toLowerCase().trim());
          const newDocente = {
            id: res.payload?.id || 'prof-' + Date.now(),
            email: formData.email,
            nombre: formData.nombre,
            apellido: formData.apellido,
            firstName: formData.nombre,
            lastName: formData.apellido,
            dni: formData.dni,
            password: formData.password,
            specialization: formData.specialization,
            categoria: formData.specialization,
            isTutor: !!formData.isTutor,
            rol: 'DOCENTE',
            roles: ['DOCENTE'],
            estado: 'active',
            createdAt: new Date().toISOString(),
          };
          if (idx >= 0) {
            usersList[idx] = { ...usersList[idx], ...newDocente };
          } else {
            usersList.push(newDocente);
          }
          localStorage.setItem('users', JSON.stringify(usersList));
        } catch {}

        showToast('Docente registrado y creado correctamente', 'success');
        setIsCreateTeacherModalOpen(false);
        dispatch<any>(fetchUsers());
      }
      return !res.error;
    } catch (err: any) {
      showToast(err.message || 'Error al procesar la solicitud', 'error');
      return false;
    }
  };

  // Resetear contraseña
  const handleResetPassword = async (u: any) => {
    const res = await dispatch<any>(resetPassword({ id: u.id }));
    if (res && res.payload) {
      showToast('Contraseña reseteada correctamente', 'success');
    }
  };

  // Habilitar/Deshabilitar cuenta
  const handleToggleActivation = async (user: any, enable: boolean) => {
    const id = user.id;
    if (String(id) === String(currentUser?.id)) {
      showToast('No podés desactivar tu propia cuenta.', 'error');
      return;
    }
    const actionLabel = enable ? 'Activar' : 'Desactivar';
    const ok = confirm(`¿${actionLabel} esta cuenta?`);
    if (!ok) return;
    const result = await dispatch<any>(toggleUserActivation({ id, enable, user }));
    if (result?.error) {
      showToast(result.payload || result.error.message || `No se pudo ${actionLabel.toLowerCase()} la cuenta.`, 'error');
      return;
    }
    showToast(`Cuenta ${enable ? 'activada' : 'desactivada'} correctamente.`, 'success');
  };

  // Iniciar proceso de eliminación (abrir modal de confirmación)
  const handleDeleteUser = (user: any) => {
    if (isCurrentUser(user)) {
      showToast('No podés eliminar tu propia cuenta.', 'error');
      return;
    }
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (isCurrentUser(userToDelete)) {
      showToast('No podés eliminar tu propia cuenta.', 'error');
      setUserToDelete(null);
      return;
    }
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
      showToast('Usuario eliminado correctamente', 'success');
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      showToast(error.message || 'Error al eliminar el usuario', 'error');
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
                    <span className="text-muted d-block small">Legajo</span>
                    <strong>{selectedUserDetail.legajo || selectedUserDetail.fileNumber || '-'}</strong>
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
                    <FaCircleInfo size={64} className="mb-3" />
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
                  onClick={() => {
                    setCreationRole('DOCENTE');
                    setIsInviteModalOpen(true);
                  }}
                  style={{ fontSize: '14px' }}
                >
                  <FaEnvelope size={16} />
                  Invitar docente (correo)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center gap-2 py-2"
                  onClick={() => {
                    setCreationRole('DOCENTE');
                    setIsCreateTeacherModalOpen(true);
                  }}
                  style={{ fontSize: '14px' }}
                >
                  <FaUserPlus size={16} />
                  Crear usuario
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
                <FaUser size={20} />
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
                <FaCircleCheck size={20} />
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
                <FaClock size={20} />
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
                <FaUserXmark size={20} />
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
        isAdmin={isAdmin}
        initialRole={creationRole}
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
                    <div>
                      <label className="form-label" style={{ fontWeight: 500 }}>Legajo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingUser.legajo || ''}
                        onChange={(e) => setEditingUser((u: any) => ({ ...u, legajo: e.target.value }))}
                      />
                    </div>
                    {isAdmin && (
                      <div>
                        <label className="form-label" style={{ fontWeight: 500 }}>Rol</label>
                        <select
                          className="form-select"
                          value={editingUser.rol || 'DOCENTE'}
                          onChange={(e) => setEditingUser((u: any) => ({ ...u, rol: e.target.value }))}
                        >
                          <option value="ESTUDIANTE">Estudiante</option>
                          <option value="DOCENTE">Docente</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                    )}

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
        users={users}
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
                  <FaTriangleExclamation size={48} color="var(--unla-primary)" className="mb-3" />
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

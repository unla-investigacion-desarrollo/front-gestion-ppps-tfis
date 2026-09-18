import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProjects,
  selectPendingProjectRequests,
  selectProjects,
  approveStudentProjectRequest,
  rejectStudentProjectRequest,
} from '../../../../redux/slices/projectsSlice';
import {
  fetchUsers,
  selectPendingUsers,
  selectUsers,
  approveUser,
  rejectUser,
} from '../../../../redux/slices/usersSlice';
import ProjectApprovalTable from './components/ProjectApprovalTable';
import './ApprovalQueue.css';
import { showToast } from '../../../utils/toast';
import {
  FaFileCircleCheck,
  FaMagnifyingGlass,
  FaArrowRotateLeft,
  FaHourglassHalf,
  FaCheck,
  FaXmark,
} from 'react-icons/fa6';

const ApprovalQueue: React.FC = () => {
  const dispatch = useDispatch<any>();

  const [activeTab, setActiveTab] = useState<'projects' | 'users'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [sortBy, setSortBy] = useState('recientes');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const rawPendingProjectRequests = useSelector(selectPendingProjectRequests);
  const rawPendingUsers = useSelector(selectPendingUsers);
  const allUsers = useSelector(selectUsers);
  const allProjects = useSelector(selectProjects);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Solicitudes pendientes reales traídas de la base de datos a través de Redux
  const pendingProjectRequests = rawPendingProjectRequests || [];

  // Filtrado de solicitudes a proyectos
  const filteredProjectRequests = useMemo(() => {
    let list = [...pendingProjectRequests];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const student = allUsers.find((u) => String(u.id) === String(r.studentUserId));
        const studentName = [student?.nombre, student?.apellido].filter(Boolean).join(' ').toLowerCase();
        const studentEmail = (student?.email || '').toLowerCase();
        const projectTitle = (r.projectTitle || '').toLowerCase();
        return (
          studentName.includes(q) ||
          studentEmail.includes(q) ||
          projectTitle.includes(q) ||
          (student?.legajo && String(student.legajo).includes(q))
        );
      });
    }

    if (sortBy === 'antiguos') {
      list.reverse();
    }

    return list;
  }, [pendingProjectRequests, searchQuery, sortBy, allUsers]);

  // Filtrado de usuarios pendientes
  const filteredUsers = useMemo(() => {
    let list = [...rawPendingUsers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((u) => {
        const name = [u.nombre, u.apellido].filter(Boolean).join(' ').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    if (sortBy === 'antiguos') {
      list.reverse();
    }

    return list;
  }, [rawPendingUsers, searchQuery, sortBy]);

  // Resetear filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('todos');
    setSortBy('recientes');
    setCurrentPage(1);
  };

  // Paginación
  const activeItemsCount =
    activeTab === 'projects' ? filteredProjectRequests.length : filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(activeItemsCount / pageSize));

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjectRequests.slice(start, start + pageSize);
  }, [filteredProjectRequests, currentPage, pageSize]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Manejador para aprobar solicitud de proyecto
  const handleApproveProjectRequest = async (projectId: string, studentUserId: string) => {
    const result = await dispatch(approveStudentProjectRequest({ projectId, studentUserId }));
    if (!(result as any).error) {
      showToast('¡Solicitud aprobada con éxito! El estudiante fue asignado al proyecto.', 'success');
    } else {
      showToast((result as any).payload || 'Error al aprobar la solicitud del estudiante', 'error');
    }
  };

  // Manejador para rechazar solicitud de proyecto
  const handleRejectProjectRequest = async (projectId: string, studentUserId: string) => {
    const result = await dispatch(rejectStudentProjectRequest({ projectId, studentUserId }));
    if (!(result as any).error) {
      showToast('Solicitud rechazada y removida.', 'info');
    } else {
      showToast((result as any).payload || 'Error al rechazar la solicitud', 'error');
    }
  };

  // Manejador para aprobar usuario nuevo
  const onApproveUser = async (id: string) => {
    const result = await dispatch(approveUser({ id }));
    if (result && result.payload) {
      const u = result.payload as any;
      if (u.password) {
        showToast(`Aprobado. Contraseña temporal: ${u.password}`, 'success');
      } else {
        showToast('Usuario aprobado correctamente.', 'success');
      }
    }
  };

  // Manejador para rechazar usuario nuevo
  const onRejectUser = async (id: string) => {
    await dispatch(rejectUser({ id }));
    showToast('Usuario rechazado.', 'info');
  };

  // Cálculo de texto mostrando X - Y de Z
  const startIndex = activeItemsCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, activeItemsCount);

  return (
    <div className="approvals-page-wrapper">
      <div className="approvals-container">
        <div className="approvals-card">
          {/* Cabecera idéntica al Mockup */}
          <div className="approvals-header">
            <div className="approvals-header-icon-box">
              <FaFileCircleCheck size={24} />
            </div>
            <div>
              <h1 className="approvals-header-title">Solicitudes</h1>
              <p className="approvals-header-subtitle">
                Revisa y gestiona las solicitudes de postulación a proyectos y registros de usuarios.
              </p>
            </div>
          </div>

          {/* Pestañas de navegación idénticas al Mockup */}
          <div className="approvals-tabs">
            <button
              type="button"
              className={`approvals-tab-button ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('projects');
                setCurrentPage(1);
              }}
            >
              <span>Solicitudes a Proyectos</span>
              <span className={activeTab === 'projects' ? 'approvals-tab-counter' : 'approvals-tab-counter-inactive'}>
                {pendingProjectRequests.length}
              </span>
            </button>

            <button
              type="button"
              className={`approvals-tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('users');
                setCurrentPage(1);
              }}
            >
              <span>Nuevos Usuarios</span>
              {rawPendingUsers.length > 0 && (
                <span className={activeTab === 'users' ? 'approvals-tab-counter' : 'approvals-tab-counter-inactive'}>
                  {rawPendingUsers.length}
                </span>
              )}
            </button>
          </div>

          {/* Barra de Filtros idéntica al Mockup */}
          <div className="approvals-filters-bar">
            {/* Input de Búsqueda con lupa */}
            <div className="approvals-search-box">
              <span className="approvals-search-icon">
                <FaMagnifyingGlass size={15} />
              </span>
              <input
                type="text"
                className="approvals-search-input"
                placeholder={
                  activeTab === 'projects'
                    ? 'Buscar por estudiante, proyecto o correo...'
                    : 'Buscar por usuario o correo...'
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Select de Estado */}
            <select
              className="approvals-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="todos">Estado: todos</option>
              <option value="pendiente">Estado: pendiente</option>
            </select>

            {/* Select de Ordenamiento */}
            <select
              className="approvals-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recientes">Ordenar por: más recientes</option>
              <option value="antiguos">Ordenar por: más antiguos</option>
            </select>

            {/* Botón Limpiar Filtros */}
            <button
              type="button"
              className="approvals-clear-btn d-inline-flex align-items-center gap-1"
              onClick={handleClearFilters}
            >
              <FaArrowRotateLeft size={13} />
              Limpiar filtros
            </button>
          </div>

          {/* Contenido Pestaña 1: Solicitudes de Proyectos */}
          {activeTab === 'projects' && (
            <ProjectApprovalTable
              requests={paginatedProjects}
              users={allUsers}
              projects={allProjects}
              onApprove={handleApproveProjectRequest}
              onReject={handleRejectProjectRequest}
            />
          )}

          {/* Contenido Pestaña 2: Nuevos Usuarios */}
          {activeTab === 'users' && (
            <div className="approvals-table-container">
              {paginatedUsers.length === 0 ? (
                <div className="alert alert-info py-4 text-center mb-0" style={{ borderRadius: '10px' }}>
                  No hay usuarios pendientes de aprobación en el sistema.
                </div>
              ) : (
                <table className="approvals-table">
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Usuario</th>
                      <th style={{ width: '25%' }}>Rol</th>
                      <th style={{ width: '20%' }}>Estado</th>
                      <th style={{ width: '20%', textAlign: 'right', paddingRight: '24px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => {
                      const first = (u.nombre || '').trim().charAt(0).toUpperCase();
                      const second = (u.apellido || '').trim().charAt(0).toUpperCase();
                      const initials = `${first}${second}` || 'U';
                      const fullName = [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email;

                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="approvals-user-cell">
                              <div className="approvals-user-avatar">
                                {initials}
                              </div>
                              <div>
                                <div className="approvals-user-name">{fullName}</div>
                                <div className="approvals-user-email">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                              {u.rol}
                            </span>
                          </td>
                          <td>
                            <span className="badge-status-mockup-pending">
                              <FaHourglassHalf size={12} style={{ marginRight: '4px' }} />
                              Pendiente
                            </span>
                          </td>
                          <td>
                            <div className="approvals-actions-container justify-content-end" style={{ paddingRight: '8px' }}>
                              <button
                                type="button"
                                className="btn-mockup-approve"
                                onClick={() => onApproveUser(u.id)}
                              >
                                <FaCheck size={13} />
                                Aprobar
                              </button>
                              <button
                                type="button"
                                className="btn-mockup-reject"
                                onClick={() => onRejectUser(u.id)}
                              >
                                <FaXmark size={12} />
                                Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Paginación idéntica al Mockup */}
          <div className="approvals-pagination-footer">
            <div className="approvals-pagination-info">
              Mostrando {startIndex} - {endIndex} de {activeItemsCount} solicitudes
            </div>

            <div className="approvals-pagination-controls">
              <button
                type="button"
                className="approvals-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`approvals-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="approvals-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalQueue;

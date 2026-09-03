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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                <path d="M10.854 7.854a.5.5 0 0 0-.708-.708L7.5 9.793 6.354 8.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z" />
              </svg>
            </div>
            <div>
              <h1 className="approvals-header-title">Aprobaciones</h1>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                </svg>
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

            {/* Botón Limpiar Filtros con icono de embudo */}
            <button
              type="button"
              className="approvals-clear-btn"
              onClick={handleClearFilters}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.308l2-.667V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
              </svg>
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
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '2px' }}>
                                <path d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13.5v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 0 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3.5v-1h-1a.5.5 0 0 1-.5-.5zm2.5.5v1a3.5 3.5 0 0 0 1.989 3.158c.533.256.886.772.886 1.342v.7c0 .57-.353 1.086-.886 1.342A3.5 3.5 0 0 0 4.5 13.5v1h7v-1a3.5 3.5 0 0 0-1.989-3.158C8.978 10.086 8.625 9.57 8.625 9v-.7c0-.57.353-1.086.886-1.342A3.5 3.5 0 0 0 11.5 3.5v-1h-7z"/>
                              </svg>
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                </svg>
                                Aprobar
                              </button>
                              <button
                                type="button"
                                className="btn-mockup-reject"
                                onClick={() => onRejectUser(u.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                                </svg>
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

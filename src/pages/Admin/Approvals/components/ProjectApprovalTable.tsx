import React, { useState, useEffect, useRef } from 'react';
import { PendingProjectStudentRequest } from '../../../../../redux/slices/projectsSlice';
import { User } from '../../../../../redux/slices/usersSlice';

interface ProjectApprovalTableProps {
  requests: PendingProjectStudentRequest[];
  users: User[];
  projects?: any[];
  onApprove: (projectId: string, studentUserId: string) => Promise<void>;
  onReject: (projectId: string, studentUserId: string) => Promise<void>;
  loading?: boolean;
}

export const ProjectApprovalTable: React.FC<ProjectApprovalTableProps> = ({
  requests,
  users,
  projects = [],
  onApprove,
  onReject,
  loading = false,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [viewingRequest, setViewingRequest] = useState<PendingProjectStudentRequest | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extraer iniciales para el avatar
  const getInitials = (name: string, lastName?: string) => {
    if (!name && !lastName) return 'U';
    const first = name ? name.trim().charAt(0).toUpperCase() : '';
    const second = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
    return `${first}${second}` || first || 'U';
  };

  // Obtener datos detallados del estudiante exclusivamente desde la base de datos (usersSlice)
  const getStudentDetails = (studentUserId: string, req?: any) => {
    const found = users.find((u) => String(u.id) === String(studentUserId));
    const fullName = found
      ? [found.nombre, found.apellido].filter(Boolean).join(' ') || found.email
      : req?.studentName || `Estudiante #${studentUserId}`;
    const email = found?.email || req?.studentEmail || '—';
    const legajo = found?.legajo || found?.dni || req?.studentLegajo || '—';
    const initials = found
      ? getInitials(found.nombre || '', found.apellido || '')
      : req?.studentName
      ? getInitials(req.studentName.split(' ')[0], req.studentName.split(' ')[1])
      : 'E';

    return {
      fullName,
      email,
      legajo,
      initials,
      rawUser: found,
    };
  };

  // Obtener detalles del proyecto
  const getProjectDetails = (projectId: string) => {
    return projects.find((p) => String(p.id) === String(projectId)) || null;
  };

  // Clases para badge de categoría
  const getCategoryBadgeClass = (categoryName: string) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('extension') || cat.includes('extensión')) {
      return 'badge-category-extension';
    }
    if (cat.includes('dev') || cat.includes('desarrollo')) {
      return 'badge-category-development';
    }
    if (cat.includes('research') || cat.includes('investig') || cat.includes('investigación')) {
      return 'badge-category-research';
    }
    return 'badge-category-default';
  };

  const handleApproveClick = async (projectId: string, studentUserId: string) => {
    setProcessingId(studentUserId);
    setOpenDropdownKey(null);
    try {
      await onApprove(projectId, studentUserId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = async (projectId: string, studentUserId: string) => {
    setOpenDropdownKey(null);
    if (window.confirm('¿Estás seguro de que deseas rechazar la postulación de este estudiante?')) {
      setProcessingId(studentUserId);
      try {
        await onReject(projectId, studentUserId);
      } finally {
        setProcessingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
        Cargando solicitudes de proyectos...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="alert alert-info py-4 text-center mb-0" style={{ borderRadius: '10px' }}>
        No se encontraron solicitudes de proyectos pendientes para mostrar.
      </div>
    );
  }

  // Datos para el modal de expediente
  const selectedStudent = viewingRequest ? getStudentDetails(viewingRequest.studentUserId, viewingRequest) : null;
  const selectedProject = viewingRequest ? getProjectDetails(viewingRequest.projectId) : null;

  return (
    <>
      <div className="approvals-table-container">
        <table className="approvals-table">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Estudiante</th>
              <th style={{ width: '27%' }}>Proyecto solicitado</th>
              <th style={{ width: '15%' }}>Estado</th>
              <th style={{ width: '16%' }}>Fecha de solicitud</th>
              <th style={{ width: '14%', textAlign: 'right', paddingRight: '24px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, idx) => {
              const rowKey = `${req.projectId}-${req.studentUserId}-${idx}`;
              const { fullName, email, legajo, initials } = getStudentDetails(req.studentUserId, req);
              const isBusy = processingId === req.studentUserId;
              const isDropdownOpen = openDropdownKey === rowKey;
              const categoryBadge = getCategoryBadgeClass(req.projectType);

              const requestDate = (req as any).createdAt
                ? new Date((req as any).createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : (req as any).date || 'Pendiente';

              return (
                <tr key={rowKey}>
                  {/* Columna Estudiante */}
                  <td>
                    <div className="approvals-user-cell">
                      <div className="approvals-user-avatar">
                        {initials}
                      </div>
                      <div>
                        <div className="approvals-user-name">{fullName}</div>
                        <div className="approvals-user-email">{email}</div>
                        <div className="approvals-user-sub">Legajo/DNI: {legajo}</div>
                      </div>
                    </div>
                  </td>

                  {/* Columna Proyecto solicitado */}
                  <td>
                    <div className="approvals-project-cell">
                      <span className="approvals-project-title">{req.projectTitle}</span>
                      <span className={categoryBadge}>{req.projectType}</span>
                    </div>
                  </td>

                  {/* Columna Estado */}
                  <td>
                    <span className="badge-status-mockup-pending">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '2px' }}>
                        <path d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13.5v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 0 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3.5v-1h-1a.5.5 0 0 1-.5-.5zm2.5.5v1a3.5 3.5 0 0 0 1.989 3.158c.533.256.886.772.886 1.342v.7c0 .57-.353 1.086-.886 1.342A3.5 3.5 0 0 0 4.5 13.5v1h7v-1a3.5 3.5 0 0 0-1.989-3.158C8.978 10.086 8.625 9.57 8.625 9v-.7c0-.57.353-1.086.886-1.342A3.5 3.5 0 0 0 11.5 3.5v-1h-7z"/>
                      </svg>
                      Pendiente
                    </span>
                  </td>

                  {/* Columna Fecha de solicitud */}
                  <td>
                    <span className="approvals-date-text">{requestDate}</span>
                  </td>

                  {/* Columna Acciones (Solo Aprobar, Rechazar y Menú 3 Puntos; Ver expediente va adentro de los 3 puntos) */}
                  <td>
                    <div className="approvals-actions-container justify-content-end" style={{ paddingRight: '8px' }}>
                      <button
                        type="button"
                        className="btn-mockup-approve"
                        disabled={isBusy}
                        onClick={() => handleApproveClick(req.projectId, req.studentUserId)}
                      >
                        {isBusy ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                            </svg>
                            Aprobar
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn-mockup-reject"
                        disabled={isBusy}
                        onClick={() => handleRejectClick(req.projectId, req.studentUserId)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                        </svg>
                        Rechazar
                      </button>

                      {/* Menú de 3 puntos */}
                      <div className="approvals-more-container" ref={isDropdownOpen ? dropdownRef : null}>
                        <button
                          type="button"
                          className="btn-mockup-more"
                          onClick={() => setOpenDropdownKey(isDropdownOpen ? null : rowKey)}
                          title="Más opciones"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                          </svg>
                        </button>

                        {isDropdownOpen && (
                          <div className="approvals-dropdown-menu">
                            {/* Ver expediente (oculto en el menú de 3 puntos como solicitó el usuario) */}
                            <button
                              type="button"
                              className="approvals-dropdown-item"
                              onClick={() => {
                                setOpenDropdownKey(null);
                                setViewingRequest(req);
                              }}
                            >
                              <div className="approvals-dropdown-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                </svg>
                              </div>
                              <div className="approvals-dropdown-text">
                                <span className="approvals-dropdown-title">Ver expediente</span>
                                <span className="approvals-dropdown-desc">Ver detalles del proyecto y alumno</span>
                              </div>
                            </button>
                            {/* NOTA: Se omitió la opción 'Descargar como PDF' por instrucción explícita del usuario */}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Expediente cuando se presiona 'Ver expediente' en el menú de 3 puntos */}
      {viewingRequest && (
        <div className="modal-expediente-overlay" onClick={() => setViewingRequest(null)}>
          <div className="modal-expediente-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-expediente-header">
              <h4 className="modal-expediente-title">Expediente de Postulación</h4>
              <button
                type="button"
                className="btn-close"
                onClick={() => setViewingRequest(null)}
                aria-label="Cerrar"
              />
            </div>

            <div className="modal-expediente-body">
              {/* Sección Alumno */}
              <div>
                <div className="modal-expediente-section-title">Datos del Estudiante</div>
                <div className="approvals-user-cell p-3 bg-light rounded">
                  <div className="approvals-user-avatar" style={{ width: 44, height: 44, fontSize: '1rem' }}>
                    {selectedStudent?.initials}
                  </div>
                  <div>
                    <div className="approvals-user-name" style={{ fontSize: '1rem' }}>{selectedStudent?.fullName}</div>
                    <div className="approvals-user-email">{selectedStudent?.email}</div>
                    <div className="approvals-user-sub">Legajo/DNI: {selectedStudent?.legajo}</div>
                  </div>
                </div>
              </div>

              {/* Sección Proyecto */}
              <div>
                <div className="modal-expediente-section-title">Datos del Proyecto</div>
                <div className="p-3 border rounded">
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>
                    {viewingRequest.projectTitle}
                  </div>
                  <div className="mt-1 mb-2">
                    <span className={getCategoryBadgeClass(viewingRequest.projectType)}>
                      {viewingRequest.projectType}
                    </span>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.5 }}>
                    {selectedProject?.descripcion || selectedProject?.description || 'Proyecto cargado en el sistema institucional de Trabajos Finales de Integración (TFI).'}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-expediente-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setViewingRequest(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn-mockup-approve"
                onClick={() => {
                  const req = viewingRequest;
                  setViewingRequest(null);
                  handleApproveClick(req.projectId, req.studentUserId);
                }}
              >
                ✓ Aprobar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectApprovalTable;

import React, { useState, useEffect, useRef } from 'react';
import { FaHourglassHalf, FaCheck, FaXmark, FaEllipsisVertical, FaEye } from 'react-icons/fa6';
import { UnifiedPendingRequest } from '../../../../../redux/slices/projectsSlice';
import { User } from '../../../../../redux/slices/usersSlice';

interface ProjectApprovalTableProps {
  requests: UnifiedPendingRequest[];
  users: User[];
  projects?: any[];
  onApprove: (projectId: string, applicantId: string, role?: 'student' | 'professor') => Promise<void>;
  onReject: (projectId: string, applicantId: string, role?: 'student' | 'professor') => Promise<void>;
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
  const [viewingRequest, setViewingRequest] = useState<UnifiedPendingRequest | null>(null);
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

  // Obtener datos detallados del postulante
  const getApplicantDetails = (req: UnifiedPendingRequest) => {
    const hasDirectName = Boolean(req.applicantName && req.applicantName !== 'Estudiante' && req.applicantName !== 'Docente');
    const found = users.find((u) => String(u.id) === String(req.applicantId || req.studentUserId));

    const fullName = hasDirectName
      ? req.applicantName
      : found
      ? [found.nombre, found.apellido].filter(Boolean).join(' ') || found.email
      : req.applicantName || `Usuario #${req.applicantId || req.studentUserId}`;

    const email = req.applicantEmail || found?.email || '—';

    let detail = '';
    if (req.applicantRole === 'professor') {
      detail = req.specialization ? `Especialidad: ${req.specialization}` : 'Docente postulado';
    } else {
      const legajoOrDni = found?.legajo || found?.dni;
      if (req.yearOfAdmission) {
        detail = `Ingreso: ${req.yearOfAdmission}${legajoOrDni ? ` | Legajo/DNI: ${legajoOrDni}` : ''}`;
      } else if (legajoOrDni) {
        detail = `Legajo/DNI: ${legajoOrDni}`;
      } else {
        detail = 'Estudiante postulado';
      }
    }

    const firstWord = req.rawApplicant?.firstName || found?.nombre || fullName.split(' ')[0] || '';
    const secondWord = req.rawApplicant?.lastName || found?.apellido || fullName.split(' ')[1] || '';
    const initials = getInitials(firstWord, secondWord);

    return {
      fullName,
      email,
      detail,
      initials,
      role: req.applicantRole || 'student',
      roleLabel: req.applicantRoleLabel || (req.applicantRole === 'professor' ? 'Docente' : 'Estudiante'),
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

  const handleApproveClick = async (projectId: string, applicantId: string, role: 'student' | 'professor' = 'student') => {
    setProcessingId(applicantId);
    setOpenDropdownKey(null);
    try {
      await onApprove(projectId, applicantId, role);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = async (projectId: string, applicantId: string, role: 'student' | 'professor' = 'student') => {
    setOpenDropdownKey(null);
    const targetText = role === 'professor' ? 'este docente' : 'este estudiante';
    if (window.confirm(`¿Estás seguro de que deseas rechazar la postulación de ${targetText}?`)) {
      setProcessingId(applicantId);
      try {
        await onReject(projectId, applicantId, role);
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
  const selectedApplicant = viewingRequest ? getApplicantDetails(viewingRequest) : null;
  const selectedProject = viewingRequest ? getProjectDetails(viewingRequest.projectId) : null;

  return (
    <>
      <div className="approvals-table-container">
        <table className="approvals-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Postulante</th>
              <th style={{ width: '27%' }}>Proyecto solicitado</th>
              <th style={{ width: '13%' }}>Estado</th>
              <th style={{ width: '16%' }}>Fecha de solicitud</th>
              <th style={{ width: '14%', textAlign: 'right', paddingRight: '24px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, idx) => {
              const applicantId = req.applicantId || req.studentUserId;
              const rowKey = `${req.projectId}-${applicantId}-${idx}`;
              const applicant = getApplicantDetails(req);
              const isBusy = processingId === applicantId;
              const isDropdownOpen = openDropdownKey === rowKey;
              const categoryBadge = getCategoryBadgeClass(req.projectType);

              const requestDate = req.createdAt
                ? new Date(req.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : (req as any).date || 'Pendiente';

              return (
                <tr key={rowKey}>
                  {/* Columna Postulante */}
                  <td>
                    <div className="approvals-user-cell">
                      <div className="approvals-user-avatar">
                        {applicant.initials}
                      </div>
                      <div>
                        <div className="d-flex align-items-center flex-wrap">
                          <span className="approvals-user-name">{applicant.fullName}</span>
                          <span className={`approvals-role-badge ${applicant.role === 'professor' ? 'teacher' : 'student'}`}>
                            {applicant.roleLabel}
                          </span>
                        </div>
                        <div className="approvals-user-email">{applicant.email}</div>
                        <div className="approvals-user-sub">{applicant.detail}</div>
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
                      <FaHourglassHalf size={12} style={{ marginRight: '4px' }} />
                      Pendiente
                    </span>
                  </td>

                  {/* Columna Fecha de solicitud */}
                  <td>
                    <span className="approvals-date-text">{requestDate}</span>
                  </td>

                  {/* Columna Acciones */}
                  <td>
                    <div className="approvals-actions-container justify-content-end" style={{ paddingRight: '8px' }}>
                      <button
                        type="button"
                        className="btn-mockup-approve"
                        disabled={isBusy}
                        onClick={() => handleApproveClick(req.projectId, applicantId, req.applicantRole)}
                      >
                        {isBusy ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        ) : (
                          <>
                            <FaCheck size={13} />
                            Aprobar
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn-mockup-reject"
                        disabled={isBusy}
                        onClick={() => handleRejectClick(req.projectId, applicantId, req.applicantRole)}
                      >
                        <FaXmark size={12} />
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
                          <FaEllipsisVertical size={16} />
                        </button>

                        {isDropdownOpen && (
                          <div className="approvals-dropdown-menu">
                            <button
                              type="button"
                              className="approvals-dropdown-item"
                              onClick={() => {
                                setOpenDropdownKey(null);
                                setViewingRequest(req);
                              }}
                            >
                              <div className="approvals-dropdown-icon">
                                <FaEye size={16} />
                              </div>
                              <div className="approvals-dropdown-text">
                                <span className="approvals-dropdown-title">Ver expediente</span>
                                <span className="approvals-dropdown-desc">Ver detalles del proyecto y postulante</span>
                              </div>
                            </button>
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
              {/* Sección Postulante */}
              <div>
                <div className="modal-expediente-section-title">Datos del Postulante</div>
                <div className="approvals-user-cell p-3 bg-light rounded">
                  <div className="approvals-user-avatar" style={{ width: 44, height: 44, fontSize: '1rem' }}>
                    {selectedApplicant?.initials}
                  </div>
                  <div>
                    <div className="d-flex align-items-center flex-wrap gap-1">
                      <span className="approvals-user-name" style={{ fontSize: '1rem' }}>{selectedApplicant?.fullName}</span>
                      <span className={`approvals-role-badge ${selectedApplicant?.role === 'professor' ? 'teacher' : 'student'}`}>
                        {selectedApplicant?.roleLabel}
                      </span>
                    </div>
                    <div className="approvals-user-email">{selectedApplicant?.email}</div>
                    <div className="approvals-user-sub">{selectedApplicant?.detail}</div>
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
                    {selectedProject?.descripcion || selectedProject?.description || 'Proyecto registrado en el sistema institucional de Trabajos Finales de Integración (TFI).'}
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
                  handleApproveClick(req.projectId, req.applicantId || req.studentUserId, req.applicantRole);
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

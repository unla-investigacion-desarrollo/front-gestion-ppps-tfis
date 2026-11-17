import React, { useState } from 'react';
import { FaEllipsisVertical, FaFolderOpen, FaLock, FaUsers } from 'react-icons/fa6';
import { PPPProposal } from '../../../services/pppService';
import '../../Teacher/TeacherProjectsList.css';

export interface PPPProposalsTableProps {
  proposals: PPPProposal[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isStudent: boolean;
  appliedProposalIds?: Set<string>;
  canManageApplicants?: boolean;
  isTutor?: boolean;
  actionLoading: boolean;
  onToggleOpenStatus: (proposalItem: PPPProposal) => void;
  onOpenApplyModal: (proposalItem: PPPProposal) => void;
  onOpenApplicantsModal: (proposalItem: PPPProposal) => void;
  onNavigateToApplicantsPage?: (proposalItem: PPPProposal) => void;
  onViewProject?: (proposalItem: PPPProposal) => void;
  onEditProposal?: (proposalItem: PPPProposal) => void;
  onDeleteProposal?: (proposalItem: PPPProposal) => void;
}

/**
 * Tabla de convocatorias de PPP con diseño idéntico a la tabla de expedientes (/ppp/expedientes).
 */
export const PPPProposalsTable: React.FC<PPPProposalsTableProps> = ({
  proposals,
  totalItems,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isStudent,
  appliedProposalIds,
  canManageApplicants = true,
  isTutor = false,
  actionLoading,
  onToggleOpenStatus,
  onOpenApplyModal,
  onOpenApplicantsModal,
  onNavigateToApplicantsPage,
  onViewProject,
  onEditProposal,
  onDeleteProposal,
}) => {
  const [activeDropdownId, setActiveDropdownId] = useState<string | number | null>(null);
  const showActionsColumn = !isStudent && Boolean(onViewProject || onEditProposal || onDeleteProposal);

  if (totalItems === 0) {
    return (
      <div className="ppp-table-card">
        <div className="text-center py-5 text-muted">
          No hay convocatorias de PPP registradas que coincidan con los filtros seleccionados.
        </div>
      </div>
    );
  }

  return (
    <div className="ppp-table-card">
      <table className="ppp-table">
        <thead>
          <tr>
            <th style={{ width: '8%' }}>Ref</th>
            <th style={{ width: showActionsColumn ? '24%' : '28%' }}>Convocatoria</th>
            <th style={{ width: showActionsColumn ? '26%' : '30%' }}>Descripción</th>
            <th style={{ width: '14%' }}>Estado</th>
            <th style={{ width: '10%' }}>Recursos</th>
            <th style={{ width: '10%', textAlign: 'center' }}>
              {isStudent ? 'Acción' : 'Postulantes'}
            </th>
            {showActionsColumn && (
              <th style={{ width: '8%', textAlign: 'center' }}>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposalItem) => {
            const rawApplicants = Array.isArray(proposalItem.applicants)
              ? proposalItem.applicants
              : Array.isArray((proposalItem as any).applications)
                ? (proposalItem as any).applications
                : null;
            const pendingApplicantsCount = rawApplicants
              ? rawApplicants.filter(
                  (app: any) =>
                    !app?.status ||
                    app.status === 'pending_application' ||
                    app.status === 'pending'
                ).length
              : (proposalItem as any).pendingApplicantsCount ??
                (proposalItem as any).applicantsCount ??
                (proposalItem as any).applicationsCount ??
                (proposalItem as any)._count?.applications ??
                (proposalItem as any)._count?.applicants ??
                0;

            return (
              <tr key={proposalItem.id}>
                {/* Columna: Ref / ID */}
                <td className="fw-semibold text-secondary">
                  #{proposalItem.id}
                </td>

                {/* Columna: Convocatoria */}
                <td>
                  <div className="fw-semibold text-dark">
                    {proposalItem.title}
                  </div>
                  {!isStudent && proposalItem.internalNotes && (
                    <div className="text-muted small mt-1 d-inline-flex align-items-center gap-1">
                      <FaLock size={11} className="text-warning" />
                      <span className="text-truncate" style={{ maxWidth: '240px' }} title={proposalItem.internalNotes}>
                        {proposalItem.internalNotes}
                      </span>
                    </div>
                  )}
                </td>

                {/* Columna: Descripción */}
                <td>
                  <div
                    className="text-secondary small"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.45',
                    }}
                    title={proposalItem.description}
                  >
                    {proposalItem.description || 'Sin descripción detallada.'}
                  </div>
                </td>

                {/* Columna: Estado de Convocatoria */}
                <td>
                  {isStudent ? (
                    <span
                      className={`badge ${
                        proposalItem.isOpen
                          ? 'bg-success-subtle text-success'
                          : 'bg-secondary-subtle text-secondary'
                      } px-2.5 py-1 rounded-pill`}
                    >
                      {proposalItem.isOpen ? 'Abierta' : 'Cerrada'}
                    </span>
                  ) : (
                    <div className="ppp-switch-wrapper">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={proposalItem.isOpen}
                        className={`ppp-toggle-switch ${proposalItem.isOpen ? 'is-on' : 'is-off'}`}
                        onClick={() => onToggleOpenStatus(proposalItem)}
                        disabled={actionLoading}
                        title={
                          proposalItem.isOpen
                            ? 'Cerrar convocatoria'
                            : 'Abrir convocatoria'
                        }
                      >
                        <span className="ppp-toggle-thumb" />
                        <span className="ppp-toggle-label">
                          {proposalItem.isOpen ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>
                  )}
                </td>

                {/* Columna: Recursos (Drive) */}
                <td>
                  {proposalItem.driveFolderUrl ? (
                    <a
                      href={proposalItem.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ppp-proposal-drive-link m-0"
                      title="Abrir recursos en Google Drive"
                    >
                      <FaFolderOpen size={13} />
                      Drive ↗
                    </a>
                  ) : (
                    <span className="text-muted small">Sin Drive</span>
                  )}
                </td>

                {/* Columna: Acción (Estudiante) o Postulantes (Docente/Admin) */}
                <td style={{ textAlign: 'center' }}>
                  {isStudent ? (
                    appliedProposalIds?.has(String(proposalItem.id)) ? (
                      <span className="badge bg-success-subtle text-success px-3 py-1.5 rounded-pill fw-semibold">
                        Postulado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-unla-primary"
                        onClick={() => onOpenApplyModal(proposalItem)}
                        disabled={actionLoading}
                      >
                        Postular
                      </button>
                    )
                  ) : isTutor && !canManageApplicants ? (
                    <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill small">
                      Solo evaluadores
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-unla-outline d-inline-flex align-items-center gap-1"
                      onClick={() => {
                        if (onNavigateToApplicantsPage) {
                          onNavigateToApplicantsPage(proposalItem);
                        } else {
                          onOpenApplicantsModal(proposalItem);
                        }
                      }}
                      title="Ver postulaciones recibidas para esta convocatoria"
                    >
                      <FaUsers size={13} />
                      Postulantes ({pendingApplicantsCount})
                    </button>
                  )}
                </td>

                {showActionsColumn && (
                  <td style={{ textAlign: 'center' }}>
                    <div className="d-inline-flex align-items-center justify-content-center">
                      <div className="actions-dropdown-wrapper">
                        <button
                          type="button"
                          className={`btn-actions-trigger d-flex align-items-center justify-content-center ${
                            activeDropdownId === proposalItem.id ? 'active' : ''
                          }`}
                          onClick={() =>
                            setActiveDropdownId(
                              activeDropdownId === proposalItem.id ? null : proposalItem.id
                            )
                          }
                          title="Acciones"
                        >
                          <FaEllipsisVertical size={15} />
                        </button>

                        {activeDropdownId === proposalItem.id && (
                          <>
                            <div
                              className="dropdown-click-outside-backdrop"
                              onClick={() => setActiveDropdownId(null)}
                            />
                            <ul className="custom-dropdown-menu dropdown-menu-end">
                              {onViewProject && (
                                <button
                                  type="button"
                                  className="custom-dropdown-item fw-semibold"
                                  style={{ color: 'var(--unla-primary, #64001d)' }}
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    onViewProject(proposalItem);
                                  }}
                                >
                                  Ver proyecto
                                </button>
                              )}
                              {onEditProposal && (
                                <>
                                  <li className="dropdown-divider" style={{ margin: '4px 0' }} />
                                  <button
                                    type="button"
                                    className="custom-dropdown-item"
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      onEditProposal(proposalItem);
                                    }}
                                  >
                                    Editar
                                  </button>
                                </>
                              )}
                              {onDeleteProposal && (
                                <>
                                  <li className="dropdown-divider" style={{ margin: '4px 0' }} />
                                  <button
                                    type="button"
                                    className="custom-dropdown-item text-danger"
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      onDeleteProposal(proposalItem);
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer de Paginación */}
      <div className="ppp-pagination-footer">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <span>
            Mostrando {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
            {Math.min(currentPage * pageSize, totalItems)} de {totalItems} convocatorias
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Filas por página:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: '72px' }}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div className="ppp-pagination-nav">
          <button
            type="button"
            className="ppp-page-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`ppp-page-btn ${currentPage === pageNumber ? 'active' : ''}`}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            className="ppp-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default PPPProposalsTable;

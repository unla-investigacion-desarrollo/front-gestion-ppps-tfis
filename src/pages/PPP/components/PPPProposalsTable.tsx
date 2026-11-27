import React, { useEffect, useRef, useState } from 'react';
import { FaEye, FaFolderOpen, FaLock, FaPencil, FaPowerOff, FaTrashCan, FaUsers } from 'react-icons/fa6';
import { PPPProposal } from '../../../services/pppService';
import Pagination from '../../../components/Pagination';
import '../../Teacher/TeacherProjectsList.css';

const PPPProposalDescription: React.FC<{ description: string }> = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element || expanded) return;

    const measureOverflow = () => {
      setHasMore(element.scrollHeight > element.clientHeight + 1);
    };

    measureOverflow();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureOverflow);
      return () => window.removeEventListener('resize', measureOverflow);
    }

    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [description, expanded]);

  return (
    <>
      <p
        ref={descriptionRef}
        className={`ppp-description-text${expanded ? ' expanded' : ''}`}
      >
        {description}
      </p>
      {(hasMore || expanded) && (
        <button
          type="button"
          className="ppp-description-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((isExpanded) => !isExpanded)}
        >
          Ver {expanded ? 'menos' : 'más'}
        </button>
      )}
    </>
  );
};

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
            <th style={{ width: '14%' }}>Convocatoria</th>
            <th style={{ width: '10%' }}>Recursos</th>
            <th style={{ width: '10%', textAlign: 'center' }}>
              {isStudent ? 'Acción' : 'Postulantes'}
            </th>
            {showActionsColumn && (
              <th style={{ width: '12%', textAlign: 'center' }}>Acciones</th>
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
                  <PPPProposalDescription
                    description={proposalItem.description || 'Sin descripción detallada.'}
                  />
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
                        <span className="ppp-toggle-thumb">
                          <FaPowerOff size={11} />
                        </span>
                        <span className="ppp-toggle-label">
                          {proposalItem.isOpen ? 'Abierta' : 'Cerrada'}
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
                      className={`btn btn-sm d-inline-flex align-items-center gap-2 ${
                        pendingApplicantsCount > 0 ? '' : 'btn-unla-outline'
                      }`}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        ...(pendingApplicantsCount > 0
                          ? {
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #86efac',
                              color: '#047857',
                            }
                          : {}),
                      }}
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
                      <span>
                        {pendingApplicantsCount}{' '}
                        {pendingApplicantsCount === 1 ? 'postulante' : 'postulantes'}
                      </span>
                    </button>
                  )}
                </td>

                {showActionsColumn && (
                  <td style={{ textAlign: 'center' }}>
                    <div className="tutor-actions-group">
                      {onViewProject && (
                        <button
                          type="button"
                          className="btn-tutor-icon-action btn-tutor-view"
                          onClick={() => onViewProject(proposalItem)}
                          title="Ver proyecto"
                          aria-label="Ver proyecto"
                        >
                          <FaEye size={15} />
                        </button>
                      )}
                      {onEditProposal && (
                        <button
                          type="button"
                          className="btn-tutor-icon-action btn-tutor-view"
                          onClick={() => onEditProposal(proposalItem)}
                          title="Editar"
                          aria-label="Editar"
                        >
                          <FaPencil size={14} />
                        </button>
                      )}
                      {onDeleteProposal && (
                        <button
                          type="button"
                          className="btn-tutor-icon-action btn-ppp-delete"
                          onClick={() => onDeleteProposal(proposalItem)}
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <FaTrashCan size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Paginación consolidada */}
      <Pagination
        variant="ppp"
        itemLabel="convocatorias"
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        pageSizeOptions={[5, 10, 20]}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

export default PPPProposalsTable;

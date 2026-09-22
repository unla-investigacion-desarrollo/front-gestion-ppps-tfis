import React from 'react';
import { FaFolderOpen, FaLock, FaUsers } from 'react-icons/fa6';
import { PPPProposal } from '../../../services/pppService';

export interface PPPProposalsCardsProps {
  proposals: PPPProposal[];
  isStudent: boolean;
  canManageApplicants?: boolean;
  isTutor?: boolean;
  actionLoading: boolean;
  onToggleOpenStatus: (proposalItem: PPPProposal) => void;
  onOpenApplyModal: (proposalItem: PPPProposal) => void;
  onOpenApplicantsModal: (proposalItem: PPPProposal) => void;
  onNavigateToApplicantsPage?: (proposalItem: PPPProposal) => void;
}

/**
 * Cuadrícula de tarjetas para convocatorias de PPP.
 */
export const PPPProposalsCards: React.FC<PPPProposalsCardsProps> = ({
  proposals,
  isStudent,
  canManageApplicants = true,
  isTutor = false,
  actionLoading,
  onToggleOpenStatus,
  onOpenApplyModal,
  onOpenApplicantsModal,
  onNavigateToApplicantsPage,
}) => {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-5 bg-white rounded-3 border p-4">
        <h5 className="fw-semibold text-secondary">
          No se encontraron convocatorias de PPP
        </h5>
        <p className="text-muted small">
          No coinciden convocatorias con el criterio de búsqueda seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="ppp-proposals-grid">
      {proposals.map((proposalItem) => {
        const applicantsCount =
          (proposalItem as any).applicantsCount ??
          (proposalItem as any).applicationsCount ??
          (proposalItem as any)._count?.applications ??
          (proposalItem as any)._count?.applicants ??
          proposalItem.applicants?.length ??
          (proposalItem as any).applications?.length ??
          0;

        return (
          <div key={proposalItem.id} className="ppp-proposal-card">
            <div className="ppp-proposal-header">
              <h3 className="ppp-proposal-title">{proposalItem.title}</h3>
              <span
                className={`badge ${
                  proposalItem.isOpen
                    ? 'bg-success-subtle text-success'
                    : 'bg-secondary-subtle text-secondary'
                } px-2.5 py-1 rounded-pill`}
              >
                {proposalItem.isOpen ? 'Convocatoria Abierta' : 'Cerrada'}
              </span>
            </div>

            <p className="ppp-proposal-desc">{proposalItem.description}</p>

            {proposalItem.driveFolderUrl && (
              <a
                href={proposalItem.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ppp-proposal-drive-link d-inline-flex align-items-center gap-1"
              >
                <FaFolderOpen size={14} />
                Recursos de la propuesta (Drive) ↗
              </a>
            )}

            {!isStudent && proposalItem.internalNotes && (
              <div className="ppp-internal-notes-box">
                <div className="ppp-internal-notes-title d-inline-flex align-items-center gap-1">
                  <FaLock size={13} />
                  Notas internas de la cátedra:
                </div>
                <div>{proposalItem.internalNotes}</div>
              </div>
            )}

            {/* Pie de Tarjeta */}
            <div className="ppp-proposal-footer">
              {isStudent ? (
                <button
                  type="button"
                  className="btn btn-sm btn-unla-primary w-100"
                  onClick={() => onOpenApplyModal(proposalItem)}
                  disabled={actionLoading}
                >
                  Postularme a esta convocatoria
                </button>
              ) : (
                <>
                  <div className="ppp-switch-wrapper">
                    <input
                      className="form-check-input ppp-switch"
                      type="checkbox"
                      checked={proposalItem.isOpen}
                      onChange={() => onToggleOpenStatus(proposalItem)}
                      disabled={actionLoading}
                      title={
                        proposalItem.isOpen
                          ? 'Cerrar convocatoria'
                          : 'Abrir convocatoria'
                      }
                    />
                    <span className="small text-muted">
                      {proposalItem.isOpen ? 'Abierta' : 'Cerrada'}
                    </span>
                  </div>

                  {isTutor && !canManageApplicants ? (
                    <span className="badge bg-secondary-subtle text-secondary px-2.5 py-1 rounded-pill small">
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
                      title="Ver postulaciones de esta convocatoria"
                    >
                      <FaUsers size={14} />
                      Postulantes ({applicantsCount})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PPPProposalsCards;

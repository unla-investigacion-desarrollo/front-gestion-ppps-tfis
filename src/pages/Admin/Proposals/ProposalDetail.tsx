import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createProject } from '../../../../redux/slices/projectsSlice';
import BackButton from '../../../components/BackButton';
import './ProposalDetail.css';

// Safe localStorage helper
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { }
}

interface Proposal {
  id: string;
  userId: string;
  titulo: string;
  descripcion: string;
  responsable: string;
  categoria: string;
  estado: 'enviado' | 'en_estudio' | 'aprobado' | 'rechazado';
  filename: string;
  filesize: number;
  uploadedAt: string;
  reason?: string;
  note?: string;
  history?: Array<{
    at: string;
    action: 'enviado' | 'en_estudio' | 'aprobado' | 'rechazado';
    by?: { id?: string; email?: string };
    from?: string;
    to?: string;
    note?: string;
    reason?: string;
  }>;
  projectId?: string;
}

interface UserRef {
  id: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
}

const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<any>();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [users, setUsers] = useState<UserRef[]>([]);

  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  useEffect(() => {
    setProposals(readJSON<Proposal[]>('proposals', []));
    setUsers(readJSON<UserRef[]>('users', []));
  }, []);

  const proposal = useMemo(() => {
    return proposals.find(p => p.id === id);
  }, [proposals, id]);

  const usersById = useMemo(() => {
    const map = new Map<string, UserRef>();
    users.forEach(user => map.set(String(user.id), user));
    return map;
  }, [users]);

  const joinEmail = (userId: string) => {
    const user = usersById.get(String(userId));
    return user?.email || '-';
  };

  const updateProposal = (proposalId: string, patch: Partial<Proposal>) => {
    setProposals(prevProposals => {
      const updatedProposals = prevProposals.map(p => (p.id === proposalId ? { ...p, ...patch } : p));
      writeJSON('proposals', updatedProposals);
      try {
        const evt = new CustomEvent('toast', { detail: { message: 'Estado actualizado', type: 'success' } });
        window.dispatchEvent(evt);
      } catch { }
      return updatedProposals;
    });
  };

  const handleAction = (proposalItem: Proposal, action: 'en_estudio' | 'aprobado' | 'rechazado') => {
    const by = { id: String(currentUser?.id || ''), email: currentUser?.email };
    if (action === 'rechazado') {
      const reason = prompt('Motivo del rechazo:');
      if (!reason) return;
      const nextHistory: NonNullable<Proposal['history']> = [
        ...(proposalItem.history || []),
        { at: new Date().toISOString(), action: 'rechazado' as const, by, from: proposalItem.estado, to: 'rechazado', reason }
      ];
      updateProposal(proposalItem.id, { estado: 'rechazado', reason, history: nextHistory });
      return;
    }
    const nextHistory: NonNullable<Proposal['history']> = [
      ...(proposalItem.history || []),
      { at: new Date().toISOString(), action: action as Proposal['estado'], by, from: proposalItem.estado, to: action }
    ];
    updateProposal(proposalItem.id, { estado: action, history: nextHistory });

    // Si se aprueba, crear proyecto (si no existe) y linkear
    if (action === 'aprobado') {
      if (!proposalItem.projectId && currentUser?.id) {
        (async () => {
          const res = await dispatch(createProject({
            teacherId: String(currentUser.id),
            titulo: proposalItem.titulo,
            descripcion: proposalItem.descripcion,
            categoria: proposalItem.categoria,
          }));
          if (!(res as any).error) {
            const projId = (res as any).payload?.id as string;
            updateProposal(proposalItem.id, { projectId: projId });
          }
        })();
      }
    }
  };

  const fmtSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  const renderCategoryBadge = (category?: string) => {
    if (!category) return null;
    const cleanCategory = category.toLowerCase().trim();
    let badgeStyleClass = 'badge-generic';

    if (cleanCategory === 'desarrollo') {
      badgeStyleClass = 'badge-desarrollo';
    } else if (cleanCategory === 'investigacion') {
      badgeStyleClass = 'badge-investigacion';
    } else if (cleanCategory === 'extension') {
      badgeStyleClass = 'badge-extension';
    }

    return (
      <span className={`project-category-badge ${badgeStyleClass}`}>
        {category}
      </span>
    );
  };

  if (!proposal) {
    return (
      <div className="proposal-detail-container">
        <div className="proposal-detail-card text-center py-5">
          <h3 className="text-muted">Cargando propuesta...</h3>
          <div className="mt-4">
            <BackButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="proposal-detail-container">
      <div className="d-flex align-items-center gap-3 mb-4">
        <h1 className="m-0 proposals-title">Detalle de Propuesta</h1>
      </div>

      <div className="row g-4">
        {/* Columna Principal - Detalles (70%) */}
        <div className="col-lg-8">
          <div className="proposal-detail-card">
            <h2 className="proposal-detail-section-title">Información de la Propuesta</h2>

            <div className="mb-4">
              <span className="detail-label">Título</span>
              <div className="proposal-detail-title">{proposal.titulo}</div>
            </div>

            <div className="mb-4">
              <span className="detail-label">Descripción</span>
              <div className="detail-value text-secondary proposals-modal-description">
                {proposal.descripcion}
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <span className="detail-label">Tipo</span>
                <div className="detail-value">{(proposal as any).tipo || '-'}</div>
              </div>
              <div className="col-md-6">
                <span className="detail-label">Categoría</span>
                <div className="mt-1">{renderCategoryBadge(proposal.categoria)}</div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <span className="detail-label">Responsable</span>
                <div className="detail-value">{proposal.responsable}</div>
              </div>
              <div className="col-md-6">
                <span className="detail-label">Usuario Solicitante</span>
                <div className="detail-value">{joinEmail(proposal.userId)}</div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <span className="detail-label">Archivo Adjunto</span>
                <div className="detail-value">
                  {proposal.filename ? (
                    <span className="text-primary fw-medium proposal-row-file-link">
                      📎 {proposal.filename} <span className="text-muted small">({fmtSize(proposal.filesize)})</span>
                    </span>
                  ) : '-'}
                </div>
              </div>
              <div className="col-md-6">
                <span className="detail-label">Fecha de Carga</span>
                <div className="detail-value">
                  {new Date(proposal.uploadedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="border-top pt-4 mt-4">
              <span className="detail-label">Estado Actual</span>
              <span className={`proposal-badge-estado proposal-badge-${proposal.estado}`}>
                {proposal.estado}
              </span>
              {proposal.reason && (
                <div className="text-danger small mt-2 fw-semibold">
                  Motivo de Rechazo: {proposal.reason}
                </div>
              )}
              {proposal.note && (
                <div className="text-muted small mt-2 font-italic">
                  Observación: {proposal.note}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Lateral - Historial y Acciones (30%) */}
        <div className="col-lg-4">
          {/* Card de Acciones */}
          <div className="proposal-detail-card">
            <h2 className="proposal-detail-section-title">Evaluar Propuesta</h2>
            <div className="proposal-action-btn-group">
              {proposal.estado !== 'en_estudio' && (
                <button
                  type="button"
                  className="btn btn-info text-white"
                  onClick={() => handleAction(proposal, 'en_estudio')}
                >
                  Poner en estudio
                </button>
              )}
              {proposal.estado !== 'aprobado' && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleAction(proposal, 'aprobado')}
                >
                  Aprobar propuesta
                </button>
              )}
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleAction(proposal, 'rechazado')}
              >
                Rechazar propuesta
              </button>
              <button
                type="button"
                className="btn"
              >
                Enviar a Proyectos
              </button>
            </div>
          </div>

          {/* Card de Historial */}
          <div className="proposal-detail-card">
            <h2 className="proposal-detail-section-title">Historial de Cambios</h2>
            <div className="proposal-timeline-container">
              {Array.isArray(proposal.history) && proposal.history.length > 0 ? (
                <ul className="activity-timeline proposals-timeline">
                  {[...proposal.history]
                    .sort((entryA, entryB) => (entryB.at || '').localeCompare(entryA.at || ''))
                    .map((historyEntry, index) => (
                      <li key={`${historyEntry.at}-${index}`} className="activity-item">
                        <div className="proposals-timeline-item-text">
                          <strong className="text-dark">
                            {new Date(historyEntry.at).toLocaleString()}
                          </strong>
                          <span className={`proposal-badge-estado proposal-badge-${historyEntry.action} proposals-timeline-badge`}>
                            {historyEntry.action}
                          </span>
                          {historyEntry.from && historyEntry.to && (
                            <span className="text-muted"> (de {historyEntry.from} a {historyEntry.to})</span>
                          )}
                          <span className="text-muted"> por {historyEntry.by?.email || joinEmail(proposal.userId)}</span>
                        </div>
                        {historyEntry.note && <div className="text-muted small mt-1 font-italic">Obs.: {historyEntry.note}</div>}
                        {historyEntry.reason && <div className="text-danger small mt-1 fw-medium">Motivo: {historyEntry.reason}</div>}
                      </li>
                    ))}
                </ul>
              ) : (
                <span className="text-muted small">Sin historial registrado</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;

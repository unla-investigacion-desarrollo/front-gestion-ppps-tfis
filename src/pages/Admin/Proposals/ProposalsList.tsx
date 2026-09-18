import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMagnifyingGlass, FaPencil, FaTrashCan } from 'react-icons/fa6';
import './ProposalsList.css';
import { useDispatch } from 'react-redux';
import { createProject } from '../../../../redux/slices/projectsSlice';

// Helpers to interact with localStorage safely
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

const ProposalsList: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [users, setUsers] = useState<UserRef[]>([]);
  const [filters, setFilters] = useState({ searchQuery: '', estado: 'ALL', categoria: 'ALL', tipo: 'ALL' });
  const [sort, setSort] = useState<{ key: 'uploadedAt' | 'titulo'; dir: 'asc' | 'desc' }>({ key: 'uploadedAt', dir: 'desc' });
  const [activeDropdownProposalId, setActiveDropdownProposalId] = useState<string | null>(null);
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  useEffect(() => {
    const loaded = readJSON<Proposal[]>('proposals', []);
    // Backfill: ensure each proposal has an initial 'enviado' history entry
    const usersMap: Record<string, UserRef> = {};
    readJSON<UserRef[]>('users', []).forEach(user => { usersMap[String(user.id)] = user; });
    const migrated = loaded.map(proposal => {
      if (Array.isArray(proposal.history) && proposal.history.length > 0) return proposal;
      const owner = usersMap[String(proposal.userId)];
      const base = {
        at: proposal.uploadedAt || new Date().toISOString(),
        action: 'enviado' as const,
        by: { id: String(proposal.userId || ''), email: owner?.email },
        from: '',
        to: 'enviado',
      };
      return { ...proposal, history: [base] };
    });
    if (JSON.stringify(loaded) !== JSON.stringify(migrated)) {
      writeJSON('proposals', migrated);
    }
    setProposals(migrated);
    setUsers(readJSON<UserRef[]>('users', []));
  }, []);

  const usersById = useMemo(() => {
    const map = new Map<string, UserRef>();
    users.forEach(user => map.set(String(user.id), user));
    return map;
  }, [users]);

  const joinEmail = (userId: string) => {
    const user = usersById.get(String(userId));
    return user?.email || '-';
  };

  const filtered = useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();
    return proposals
      .filter(proposal => {
        const matchesQ = !q || [proposal.titulo, proposal.descripcion, joinEmail(proposal.userId)].join(' ').toLowerCase().includes(q);
        const matchesEstado = filters.estado === 'ALL' || proposal.estado === filters.estado;
        const matchesCat = filters.categoria === 'ALL' || proposal.categoria === filters.categoria;
        const matchesTipo = filters.tipo === 'ALL' || (proposal as any).tipo === filters.tipo;
        return matchesQ && matchesEstado && matchesCat && matchesTipo;
      })
      .sort((proposalA, proposalB) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        if (sort.key === 'uploadedAt') {
          return dir * (proposalA.uploadedAt || '').localeCompare(proposalB.uploadedAt || '');
        }
        return dir * proposalA.titulo.localeCompare(proposalB.titulo);
      });
  }, [proposals, filters, sort, usersById]);

  type DeletedLog = { id: string; by: { id: string; email?: string | null }; at: string; snapshot?: Partial<Proposal> };
  const pushDeletedLog = (logs: DeletedLog[]) => {
    try {
      const raw = localStorage.getItem('proposalsDeletedLog');
      const logArray = raw ? JSON.parse(raw) as DeletedLog[] : [];
      const updatedLogs = [...logArray, ...logs];
      localStorage.setItem('proposalsDeletedLog', JSON.stringify(updatedLogs));
    } catch { }
  };

  const deleteOne = (id: string) => {
    const ok = window.confirm('¿Eliminar esta propuesta? Esta acción no se puede deshacer.');
    if (!ok) return;
    setProposals((prevProposals) => {
      const by = { id: String(currentUser?.id || ''), email: currentUser?.email };
      const deletedLogs: DeletedLog[] = prevProposals
        .filter((proposal) => proposal.id === id)
        .map((proposal) => ({
          id: proposal.id,
          by,
          at: new Date().toISOString(),
          snapshot: {
            titulo: proposal.titulo,
            userId: proposal.userId,
            uploadedAt: proposal.uploadedAt,
            estado: proposal.estado,
            categoria: proposal.categoria
          }
        }));
      const remainingProposals = prevProposals.filter((proposal) => proposal.id !== id);
      writeJSON('proposals', remainingProposals);
      pushDeletedLog(deletedLogs);
      try {
        const evt = new CustomEvent('toast', { detail: { message: 'Propuesta eliminada', type: 'success' } });
        window.dispatchEvent(evt);
      } catch { }
      return remainingProposals;
    });
  };

  const updateProposal = (proposalId: string, patch: Partial<Proposal>) => {
    setProposals(prevProposals => {
      const updatedProposals = prevProposals.map(proposal => (proposal.id === proposalId ? { ...proposal, ...patch } : proposal));
      writeJSON('proposals', updatedProposals);
      try {
        const evt = new CustomEvent('toast', { detail: { message: 'Estado actualizado', type: 'success' } });
        window.dispatchEvent(evt);
      } catch { }
      return updatedProposals;
    });
  };

  const handleAction = (proposal: Proposal, action: 'en_estudio' | 'aprobado' | 'rechazado') => {
    const by = { id: String(currentUser?.id || ''), email: currentUser?.email };
    if (action === 'rechazado') {
      const reason = prompt('Motivo del rechazo:');
      if (!reason) return;
      const nextHistory: NonNullable<Proposal['history']> = [
        ...(proposal.history || []),
        { at: new Date().toISOString(), action: 'rechazado' as const, by, from: proposal.estado, to: 'rechazado', reason }
      ];
      updateProposal(proposal.id, { estado: 'rechazado', reason, history: nextHistory });
      return;
    }
    const nextHistory: NonNullable<Proposal['history']> = [
      ...(proposal.history || []),
      { at: new Date().toISOString(), action: action as Proposal['estado'], by, from: proposal.estado, to: action }
    ];
    updateProposal(proposal.id, { estado: action, history: nextHistory });

    // Si se aprueba, crear proyecto (si no existe) y linkear
    if (action === 'aprobado') {
      // Evitar duplicar proyectos si ya fue creado
      if (!proposal.projectId && currentUser?.id) {
        (async () => {
          const res = await dispatch(createProject({
            teacherId: String(currentUser.id),
            titulo: proposal.titulo,
            descripcion: proposal.descripcion,
            categoria: proposal.categoria,
          }));
          if (!(res as any).error) {
            const projId = (res as any).payload?.id as string;
            updateProposal(proposal.id, { projectId: projId });
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

  return (
    <div className="proposals-page-container">
      <div className="proposals-card-main">
        {/* Cabecera principal */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="m-0 proposals-title">Propuestas</h1>
            <p className="m-0 text-muted proposals-subtitle">Gestioná y evaluá las propuestas enviadas.</p>
          </div>
        </div>

        {/* Sección de Filtros de Búsqueda */}
        <div className="unla-card filters-card">
          <div className="row g-3 align-items-center">
            {/* Input buscador principal con icono de lupa */}
            <div className="col-md-5">
              <div className="search-input-wrapper">
                <span className="search-icon-wrapper">
                  <FaMagnifyingGlass size={16} color="#9ca3af" />
                </span>
                <input
                  type="text"
                  className="form-control search-input-field"
                  placeholder="Buscar por título, descripción o email..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                />
              </div>
            </div>

            {/* Selects de filtros */}
            <div className="col-md-7">
              <div className="row g-2">
                <div className="col-sm-4">
                  <select
                    className="form-select filter-select-field"
                    value={filters.estado}
                    onChange={(e) => setFilters(f => ({ ...f, estado: e.target.value }))}
                  >
                    <option value="ALL">Estado: todos</option>
                    <option value="enviado">Enviado</option>
                    <option value="en_estudio">En estudio</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
                <div className="col-sm-4">
                  <select
                    className="form-select filter-select-field"
                    value={filters.categoria}
                    onChange={(e) => setFilters(f => ({ ...f, categoria: e.target.value }))}
                  >
                    <option value="ALL">Categoría: todas</option>
                    <option value="desarrollo">Desarrollo</option>
                    <option value="investigacion">Investigación</option>
                    <option value="extension">Extensión</option>
                  </select>
                </div>
                <div className="col-sm-4">
                  <select
                    className="form-select filter-select-field"
                    value={filters.tipo}
                    onChange={(e) => setFilters(f => ({ ...f, tipo: e.target.value }))}
                  >
                    <option value="ALL">Tipo: todos</option>
                    <option value="PRACTICAS PRE PROFESIONALES">PRACTICAS PRE PROFESIONALES</option>
                    <option value="TRABAJO FINAL INTEGRADOR">TRABAJO FINAL INTEGRADOR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Ordenamiento */}
          <div className="d-flex align-items-center gap-2 mt-3 pt-3 border-top">
            <span className="text-muted small fw-medium">Orden:</span>
            <button
              className={`btn btn-sm btn-sort ${sort.key === 'uploadedAt' ? 'btn-secondary' : 'btn-outline-secondary'}`}
              type="button"
              onClick={() => setSort(s => ({ key: 'uploadedAt', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
            >
              Fecha {sort.key === 'uploadedAt' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
            </button>
            <button
              className={`btn btn-sm btn-sort ${sort.key === 'titulo' ? 'btn-secondary' : 'btn-outline-secondary'}`}
              type="button"
              onClick={() => setSort(s => ({ key: 'titulo', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
            >
              Título {sort.key === 'titulo' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
            </button>
          </div>
        </div>

        {/* Listado principal */}
        <div className="projects-table-wrapper mt-4">
          <table className="table table-striped table-hover m-0 align-middle proposals-table">
            <thead className="table-dark">
              <tr>
                <th>Propuesta</th>
                <th>Email</th>
                <th>Archivo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="text-center proposals-actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proposal) => (
                <tr key={proposal.id}>
                  <td>
                    <span className="fw-bold d-block text-dark proposal-row-title">{proposal.titulo}</span>
                    <span className="text-muted d-block small mt-1">
                      {(proposal as any).tipo || '-'}
                    </span>
                    <span className="mt-1 d-inline-block">
                      {renderCategoryBadge(proposal.categoria)}
                    </span>
                  </td>
                  <td className="proposal-row-email">{joinEmail(proposal.userId)}</td>
                  <td>
                    {proposal.filename ? (
                      <span className="text-primary fw-medium proposal-row-file-link">
                        📎 {proposal.filename} <span className="text-muted small">({fmtSize(proposal.filesize)})</span>
                      </span>
                    ) : '-'}
                  </td>
                  <td className="proposal-row-date">
                    {new Date(proposal.uploadedAt).toLocaleString()}
                  </td>
                  <td>
                    <span className={`proposal-badge-estado proposal-badge-${proposal.estado}`}>
                      {proposal.estado}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-inline-flex align-items-center justify-content-center gap-2">
                      <div className="actions-dropdown-wrapper">
                        <button
                          type="button"
                          className={`btn-actions-trigger d-flex align-items-center justify-content-center ${activeDropdownProposalId === proposal.id ? 'active' : ''}`}
                          onClick={() => setActiveDropdownProposalId(activeDropdownProposalId === proposal.id ? null : proposal.id)}
                          title="Acciones"
                        >
                          <FaPencil size={14} />
                        </button>

                        {activeDropdownProposalId === proposal.id && (
                          <>
                            <div
                              className="dropdown-click-outside-backdrop"
                              onClick={() => setActiveDropdownProposalId(null)}
                            />
                            <ul className="custom-dropdown-menu dropdown-menu-end proposals-actions-dropdown">
                              <button
                                type="button"
                                className="custom-dropdown-item"
                                onClick={() => {
                                  setActiveDropdownProposalId(null);
                                  navigate(`/admin/proposals/${proposal.id}`);
                                }}
                              >
                                Ver detalle
                              </button>
                              {proposal.estado !== 'en_estudio' && (
                                <button
                                  type="button"
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setActiveDropdownProposalId(null);
                                    handleAction(proposal, 'en_estudio');
                                  }}
                                >
                                  En estudio
                                </button>
                              )}
                              {proposal.estado !== 'aprobado' && (
                                <button
                                  type="button"
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setActiveDropdownProposalId(null);
                                    handleAction(proposal, 'aprobado');
                                  }}
                                >
                                  Aprobar
                                </button>
                              )}
                              <button
                                type="button"
                                className="custom-dropdown-item"
                                onClick={() => {
                                  setActiveDropdownProposalId(null);
                                  handleAction(proposal, 'rechazado');
                                }}
                              >
                                Rechazar
                              </button>
                            </ul>
                          </>
                        )}
                      </div>

                      {/* Trash can button next to the pencil */}
                      <button
                        type="button"
                        className="btn-actions-delete d-flex align-items-center justify-content-center"
                        onClick={() => deleteOne(proposal.id)}
                        title="Eliminar propuesta"
                      >
                        <FaTrashCan size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No hay propuestas con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProposalsList;

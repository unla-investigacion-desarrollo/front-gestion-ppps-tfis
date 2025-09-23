import React, { useEffect, useMemo, useState } from 'react';
import '../../../styles/unla.css';

// Simple helpers to interact with localStorage safely
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
  } catch {}
}

interface Proposal {
  id: string;
  userId: string;
  titulo: string;
  descripcion: string;
  responsable: string;
  categoria: string;
  estado: 'enviado' | 'en_estudio' | 'aprobado' | 'rechazado' | 'observado';
  filename: string;
  filesize: number;
  uploadedAt: string;
  reason?: string;
  note?: string;
  history?: Array<{
    at: string;
    action: 'enviado' | 'en_estudio' | 'aprobado' | 'rechazado' | 'observado';
    by?: { id?: string; email?: string };
    from?: string;
    to?: string;
    note?: string;
    reason?: string;
  }>;
}

interface UserRef {
  id: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
}

const ProposalsList: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [users, setUsers] = useState<UserRef[]>([]);
  const [filters, setFilters] = useState({ q: '', estado: 'ALL', categoria: 'ALL', tipo: 'ALL' });
  const [sort, setSort] = useState<{ key: 'uploadedAt' | 'titulo'; dir: 'asc' | 'desc' }>({ key: 'uploadedAt', dir: 'desc' });
  const [detail, setDetail] = useState<Proposal | null>(null);
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  useEffect(() => {
    const loaded = readJSON<Proposal[]>('proposals', []);
    // Backfill: ensure each proposal has an initial 'enviado' history entry
    const usersMap: Record<string, UserRef> = {};
    readJSON<UserRef[]>('users', []).forEach(u => { usersMap[String(u.id)] = u; });
    const migrated = loaded.map(p => {
      if (Array.isArray(p.history) && p.history.length > 0) return p;
      const owner = usersMap[String(p.userId)];
      const base = {
        at: p.uploadedAt || new Date().toISOString(),
        action: 'enviado' as const,
        by: { id: String(p.userId || ''), email: owner?.email },
        from: '',
        to: 'enviado',
      };
      return { ...p, history: [base] };
    });
    if (JSON.stringify(loaded) !== JSON.stringify(migrated)) {
      writeJSON('proposals', migrated);
    }
    setProposals(migrated);
    setUsers(readJSON<UserRef[]>('users', []));
  }, []);

  const usersById = useMemo(() => {
    const map = new Map<string, UserRef>();
    users.forEach(u => map.set(String(u.id), u));
    return map;
  }, [users]);

  const joinEmail = (uid: string) => {
    const u = usersById.get(String(uid));
    return u?.email || '-';
  };

  const actionBadgeStyle = (action: Proposal['estado']) => {
    switch (action) {
      case 'aprobado': return { background: '#e8f5e9', border: '1px solid #2e7d32', color: '#1b5e20' };
      case 'en_estudio': return { background: '#e3f2fd', border: '1px solid #1976d2', color: '#0d47a1' };
      case 'observado': return { background: '#fff8e1', border: '1px solid #f9a825', color: '#f57f17' };
      case 'rechazado': return { background: '#ffebee', border: '1px solid #c62828', color: '#b71c1c' };
      default: return { background: '#f3f3f3', border: '1px solid #bdbdbd', color: '#424242' };
    }
  };

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return proposals
      .filter(p => {
        const matchesQ = !q || [p.titulo, p.descripcion, joinEmail(p.userId)].join(' ').toLowerCase().includes(q);
        const matchesEstado = filters.estado === 'ALL' || p.estado === filters.estado;
        const matchesCat = filters.categoria === 'ALL' || p.categoria === filters.categoria;
        const matchesTipo = filters.tipo === 'ALL' || (p as any).tipo === filters.tipo;
        return matchesQ && matchesEstado && matchesCat && matchesTipo;
      })
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        if (sort.key === 'uploadedAt') {
          return dir * (a.uploadedAt || '').localeCompare(b.uploadedAt || '');
        }
        return dir * a.titulo.localeCompare(b.titulo);
      });
  }, [proposals, filters, sort, usersById]);

  const updateProposal = (id: string, patch: Partial<Proposal>) => {
    setProposals(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...patch } : p));
      writeJSON('proposals', next);
      try {
        const evt = new CustomEvent('toast', { detail: { message: 'Estado actualizado', type: 'success' } });
        window.dispatchEvent(evt);
      } catch {}
      return next;
    });
  };

  const handleAction = (p: Proposal, action: 'en_estudio' | 'aprobado' | 'rechazado' | 'observado') => {
    const by = { id: String(currentUser?.id || ''), email: currentUser?.email };
    if (action === 'rechazado') {
      const reason = prompt('Motivo del rechazo:');
      if (!reason) return;
      const nextHistory: NonNullable<Proposal['history']> = [
        ...(p.history || []),
        { at: new Date().toISOString(), action: 'rechazado' as const, by, from: p.estado, to: 'rechazado', reason }
      ];
      updateProposal(p.id, { estado: 'rechazado', reason, history: nextHistory });
      return;
    }
    if (action === 'observado') {
      const note = prompt('Observación para el estudiante:');
      if (!note) return;
      const nextHistory: NonNullable<Proposal['history']> = [
        ...(p.history || []),
        { at: new Date().toISOString(), action: 'observado' as const, by, from: p.estado, to: 'observado', note }
      ];
      updateProposal(p.id, { estado: 'observado', note, history: nextHistory });
      return;
    }
    const nextHistory: NonNullable<Proposal['history']> = [
      ...(p.history || []),
      { at: new Date().toISOString(), action: action as Proposal['estado'], by, from: p.estado, to: action }
    ];
    updateProposal(p.id, { estado: action, history: nextHistory });
  };

  const fmtSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  const badgeStyle = (estado: Proposal['estado']) => {
    switch (estado) {
      case 'aprobado': return { background: '#e8f5e9', border: '1px solid #2e7d32', color: '#1b5e20' };
      case 'en_estudio': return { background: '#e3f2fd', border: '1px solid #1976d2', color: '#0d47a1' };
      case 'observado': return { background: '#fff8e1', border: '1px solid #f9a825', color: '#f57f17' };
      case 'rechazado': return { background: '#ffebee', border: '1px solid #c62828', color: '#b71c1c' };
      default: return { background: '#f3f3f3', border: '1px solid #bdbdbd', color: '#424242' };
    }
  };

  return (
    <div className="unla-page">
      <div className="unla-card" style={{ width: '100%', margin: '0 auto' }}>
        <h1>Propuestas</h1>

        <h2 className="unla-section-title">Filtros</h2>
        <div className="unla-form" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <input
            className="unla-input"
            placeholder="Buscar por título, descripción o email"
            value={filters.q}
            onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
          />
          <select className="unla-input" value={filters.estado} onChange={(e) => setFilters(f => ({ ...f, estado: e.target.value }))}>
            <option value="ALL">Estado: todos</option>
            <option value="enviado">Enviado</option>
            <option value="en_estudio">En estudio</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
            <option value="observado">Observado</option>
          </select>
          <select className="unla-input" value={filters.categoria} onChange={(e) => setFilters(f => ({ ...f, categoria: e.target.value }))}>
            <option value="ALL">Categoría: todas</option>
            <option value="desarrollo">Desarrollo</option>
            <option value="investigacion">Investigación</option>
            <option value="extension">Extensión</option>
          </select>
          <select className="unla-input" value={filters.tipo} onChange={(e) => setFilters(f => ({ ...f, tipo: e.target.value }))}>
            <option value="ALL">Tipo: todos</option>
            <option value="PRACTICAS PRE PROFESIONALES">PRACTICAS PRE PROFESIONALES</option>
            <option value="TRABAJO FINAL INTEGRADOR">TRABAJO FINAL INTEGRADOR</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 10px' }}>
          <span style={{ color: 'var(--unla-muted)' }}>Orden:</span>
          <button className="unla-btn" type="button" onClick={() => setSort(s => ({ key: 'uploadedAt', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}>
            Fecha {sort.key === 'uploadedAt' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button className="unla-btn" type="button" onClick={() => setSort(s => ({ key: 'titulo', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}>
            Título {sort.key === 'titulo' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
          </button>
        </div>

        <div className="unla-table-container">
          <table className="unla-table wide">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Email</th>
                <th>Categoría</th>
                <th>Archivo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.titulo}</td>
                  <td>{(p as any).tipo || '-'}</td>
                  <td>{joinEmail(p.userId)}</td>
                  <td>{p.categoria}</td>
                  <td>{p.filename ? `${p.filename} (${fmtSize(p.filesize)})` : '-'}</td>
                  <td>{new Date(p.uploadedAt).toLocaleString()}</td>
                  <td>
                    <span className="unla-badge" style={{ ...badgeStyle(p.estado) }}>{p.estado}</span>
                    {p.reason && <div className="unla-hint error">Rechazo: {p.reason}</div>}
                    {p.note && <div className="unla-hint">Obs.: {p.note}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button className="unla-btn" type="button" onClick={() => setDetail(p)}>Ver detalle</button>
                      {p.estado !== 'en_estudio' && (
                        <button className="unla-btn" type="button" onClick={() => handleAction(p, 'en_estudio')}>En estudio</button>
                      )}
                      {p.estado !== 'aprobado' && (
                        <button className="unla-btn" type="button" onClick={() => handleAction(p, 'aprobado')}>Aprobar</button>
                      )}
                      <button className="unla-btn" type="button" onClick={() => handleAction(p, 'observado')}>Observar</button>
                      <button className="unla-btn" type="button" onClick={() => handleAction(p, 'rechazado')}>Rechazar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="unla-hint">No hay propuestas con los filtros actuales.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {detail && (
        <div className="session-reminder-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, maxWidth: 700, width: '92%', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <h3>Detalle de propuesta</h3>
            <div className="unla-list" style={{ maxHeight: 420, overflow: 'auto' }}>
              <div><strong>Título:</strong> {detail.titulo}</div>
              <div><strong>Descripción:</strong><br />{detail.descripcion}</div>
              <div><strong>Tipo:</strong> {(detail as any).tipo || '-'}</div>
              <div><strong>Responsable:</strong> {detail.responsable}</div>
              <div><strong>Categoría:</strong> {detail.categoria}</div>
              <div><strong>Archivo:</strong> {detail.filename} ({(detail.filesize/1024/1024).toFixed(2)} MB)</div>
              <div><strong>Fecha:</strong> {new Date(detail.uploadedAt).toLocaleString()}</div>
              <div><strong>Estado:</strong> <span className="unla-badge" style={{ ...badgeStyle(detail.estado) }}>{detail.estado}</span></div>
              {detail.reason && <div className="unla-hint error"><strong>Motivo rechazo:</strong> {detail.reason}</div>}
              {detail.note && <div className="unla-hint"><strong>Observación:</strong> {detail.note}</div>}
              <div><strong>Usuario:</strong> {joinEmail(detail.userId)}</div>
              {Array.isArray(detail.history) && detail.history.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4>Historial de acciones</h4>
                  <ul className="unla-list" style={{ paddingLeft: 18 }}>
                    {[...detail.history].sort((a,b) => (b.at||'').localeCompare(a.at||'')).map((h, idx) => (
                      <li key={`${h.at}-${idx}`}>
                        <strong>{new Date(h.at).toLocaleString()}:</strong> <span className="unla-badge" style={{ ...actionBadgeStyle(h.action) }}>{h.action}</span>
                        {h.from && h.to && <span> (de {h.from} a {h.to})</span>}
                        <span> • por {h.by?.email || joinEmail(detail.userId)}</span>
                        {h.note && <div className="unla-hint">Obs.: {h.note}</div>}
                        {h.reason && <div className="unla-hint error">Motivo: {h.reason}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="unla-btn" type="button" onClick={() => setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalsList;

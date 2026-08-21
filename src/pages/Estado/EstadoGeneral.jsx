import React, { useMemo } from 'react';
import '../../styles/unla.css';
import bgImage from '../../assets/fondo-rojo.jpg';
import BackButton from '../../components/BackButton';

const badgeStyle = (estado) => {
  switch (estado) {
    case 'aprobado': return { background: '#e8f5e9', border: '1px solid #2e7d32', color: '#1b5e20' };
    case 'en_estudio': return { background: '#e3f2fd', border: '1px solid #1976d2', color: '#0d47a1' };
    case 'observado': return { background: '#fff8e1', border: '1px solid #f9a825', color: '#f57f17' };
    case 'rechazado': return { background: '#ffebee', border: '1px solid #c62828', color: '#b71c1c' };
    default: return { background: '#f3f3f3', border: '1px solid #bdbdbd', color: '#424242' };
  }
};

const EstadoGeneral = () => {
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  const { myLast, queue, stats } = useMemo(() => {
    try {
      const raw = localStorage.getItem('proposals');
      const arr = raw ? JSON.parse(raw) : [];
      const mine = user ? arr.filter(p => p.userId === user.id) : [];
      const myLast = mine.sort((a,b) => (b.uploadedAt||'').localeCompare(a.uploadedAt||''))[0] || null;

      const isPending = (p) => p && !['aprobado','rechazado'].includes(p.estado);
      const queue = arr
        .filter(isPending)
        .sort((a,b) => (a.uploadedAt||'').localeCompare(b.uploadedAt||'')); // más antiguos primero

      const stats = arr.reduce((acc, p) => {
        acc.total++;
        acc.byEstado[p.estado] = (acc.byEstado[p.estado] || 0) + 1;
        return acc;
      }, { total: 0, byEstado: {} });

      return { myLast, queue, stats };
    } catch {
      return { myLast: null, queue: [], stats: { total: 0, byEstado: {} } };
    }
  }, [user]);

  const myPosition = useMemo(() => {
    if (!myLast) return null;
    const idx = queue.findIndex(p => p.id === myLast.id);
    return idx >= 0 ? idx + 1 : null;
  }, [queue, myLast]);

  return (
    <div
      className="unla-page"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '16px'
      }}
    >
      <div className="unla-card" style={{ width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <h1 style={{ margin: 0 }}>Estado general</h1>
        </div>

        <h2 className="unla-section-title">Resumen</h2>
        <div className="unla-list">
          <div><strong>Total de propuestas:</strong> {stats.total}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(stats.byEstado).map(([k, v]) => (
              <span key={k} className="unla-badge" style={{ ...badgeStyle(k) }}>{k}: {v}</span>
            ))}
          </div>
        </div>

        <h2 className="unla-section-title">Tu posición en la cola</h2>
        {myLast ? (
          <div className="unla-list">
            <div><strong>Última propuesta:</strong> {myLast.titulo}</div>
            <div><strong>Estado:</strong> <span className="unla-badge" style={{ ...badgeStyle(myLast.estado) }}>{myLast.estado}</span></div>
            <div><strong>Fecha envío:</strong> {new Date(myLast.uploadedAt).toLocaleString()}</div>
            <div><strong>Posición en cola (pendientes):</strong> {myPosition ? `${myPosition} de ${queue.length}` : 'No aplica (estado finalizado o no está en cola)'}</div>
          </div>
        ) : (
          <div className="unla-hint">No tenés propuestas cargadas aún.</div>
        )}

        <h2 className="unla-section-title">Cola de propuestas (pendientes)</h2>
        <div className="unla-table-container">
          <table className="table table-striped table-hover table-bordered">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Categoría</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((p, i) => (
                <tr key={p.id} style={myLast && p.id === myLast.id ? { background: '#f0f9ff' } : undefined}>
                  <td>{i + 1}</td>
                  <td>{new Date(p.uploadedAt).toLocaleString()}</td>
                  <td><span className="unla-badge" style={{ ...badgeStyle(p.estado) }}>{p.estado}</span></td>
                  <td>{p.categoria || '-'}</td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan={4}><div className="unla-hint">No hay propuestas pendientes en la cola.</div></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="unla-section-title">Proyectos (cola)</h2>
        <div className="unla-hint">Aún no implementado. Cuando se habilite "Carga de Proyecto", se mostrará aquí la cola y tu posición.</div>
      </div>
    </div>
  );
};

export default EstadoGeneral;

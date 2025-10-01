import React, { useMemo } from 'react';
import '../../../styles/unla.css';
import bgImage from '../../../assets/fondo-rojo.jpg';

type OutboxEmail = {
  to: string; // Typically userId or email
  subject: string;
  body: string;
  at: string; // ISO date
};

function readOutbox(): OutboxEmail[] {
  try {
    const raw = localStorage.getItem('outboxEmails');
    return raw ? JSON.parse(raw) as OutboxEmail[] : [];
  } catch {
    return [];
  }
}

const Outbox: React.FC = () => {
  const emails = useMemo(() => {
    return readOutbox().sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  }, []);

  const exportCsv = () => {
    const header = ['to', 'subject', 'body', 'at'];
    const rows = emails.map(e => [e.to, e.subject, e.body.replace(/\n/g, ' '), e.at]);
    const csv = [header.join(','), ...rows.map(r => r.map(v => '"' + (String(v || '').replace(/"/g, '""')) + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outbox_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Bandeja de salida</h1>
          <div className="spacer" />
          <button className="btn btn-outline-secondary" type="button" onClick={exportCsv} disabled={emails.length === 0}>Exportar CSV</button>
        </div>
        {emails.length === 0 ? (
          <div className="unla-hint" style={{ marginTop: 10 }}>No hay emails simulados en la bandeja de salida.</div>
        ) : (
          <div className="unla-table-container" style={{ marginTop: 12 }}>
            <table className="table table-striped table-hover table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>Fecha</th>
                  <th>Para</th>
                  <th>Asunto</th>
                  <th>Contenido</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((e, i) => (
                  <tr key={`${e.at}-${i}`}>
                    <td>{new Date(e.at).toLocaleString()}</td>
                    <td>{e.to}</td>
                    <td>{e.subject}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{e.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Outbox;

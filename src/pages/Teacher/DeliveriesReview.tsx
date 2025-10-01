import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/unla.css';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { selectProjectsByTeacher } from '../../../redux/slices/projectsSlice';
import { selectUsers } from '../../../redux/slices/usersSlice';
import { useLocation } from 'react-router-dom';
import bgImage from '../../assets/fondo-rojo.jpg';

// Local storage helpers compartidos con alumnos
const KEY = 'deliveries';
const ACTIVITY_KEY = 'projectActivity';

type Delivery = {
  id: string;
  projectId: string;
  studentId: string;
  note?: string;
  link?: string;
  filename?: string;
  filesize?: number;
  uploadedAt: string;
  teacherNote?: string;
  reviewedAt?: string;
  reviewerId?: string;
};

function readDeliveries(): Delivery[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as Delivery[] : [];
  } catch {
    return [];
  }
}
function writeDeliveries(list: Delivery[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

// Activity timeline types/helpers
type Activity = {
  id: string;
  projectId: string;
  type: 'message' | 'delivery' | 'teacher_note';
  by: string; // userId
  at: string; // ISO
  data?: any;
};
function readActivity(): Record<string, Activity[]> {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) as Record<string, Activity[]> : {};
  } catch {
    return {};
  }
}
function writeActivity(map: Record<string, Activity[]>) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(map));
}
function appendActivity(entry: Activity) {
  const map = readActivity();
  const list = Array.isArray(map[entry.projectId]) ? map[entry.projectId] : [];
  map[entry.projectId] = [...list, entry];
  writeActivity(map);
}

const DeliveriesReview: React.FC = () => {
  const me = useSelector(selectCurrentUser) as any;
  const projects = useSelector(selectProjectsByTeacher(me?.id || ''));
  const users = useSelector(selectUsers);

  const [projectId, setProjectId] = useState<string>(() => (projects[0]?.id || ''));
  const currentProject = useMemo(() => projects.find(p => p.id === projectId) || projects[0], [projects, projectId]);
  const location = useLocation();

  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search);
      const qid = q.get('projectId');
      if (qid && projects.some(p => p.id === qid)) setProjectId(qid);
    } catch {}
  }, [location.search, projects]);

  const deliveries = useMemo(() => {
    const all = readDeliveries();
    const pid = currentProject?.id || '';
    return all.filter(d => d.projectId === pid).sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
  }, [currentProject]);

  const userNameOrEmail = (id: string) => {
    const u = users.find(u => String(u.id) === String(id));
    return u ? ([u.nombre, u.apellido].filter(Boolean).join(' ') || u.email || id) : id;
  };

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filterStudent, setFilterStudent] = useState<string>('ALL');
  const [filterText, setFilterText] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [detail, setDetail] = useState<Delivery | null>(null);
  const [msg, setMsg] = useState('');

  const filtered = useMemo(() => {
    return deliveries.filter(d => {
      const byStudent = filterStudent === 'ALL' || String(d.studentId) === String(filterStudent);
      const byText = !filterText.trim() || `${d.note || ''} ${d.filename || ''} ${d.link || ''}`.toLowerCase().includes(filterText.trim().toLowerCase());
      const date = (d.uploadedAt || '').slice(0,10);
      const byFrom = !fromDate || date >= fromDate;
      const byTo = !toDate || date <= toDate;
      return byStudent && byText && byFrom && byTo;
    });
  }, [deliveries, filterStudent, filterText, fromDate, toDate]);

  const saveNote = (deliveryId: string) => {
    const all = readDeliveries();
    const idx = all.findIndex(d => d.id === deliveryId);
    if (idx === -1) return;
    const text = (notes[deliveryId] || '').trim();
    all[idx] = {
      ...all[idx],
      teacherNote: text || undefined,
      reviewedAt: new Date().toISOString(),
      reviewerId: String(me?.id || ''),
    };
    writeDeliveries(all);
    // Append to activity as teacher_note
    try {
      if (currentProject?.id) {
        appendActivity({
          id: `act-${Date.now()}`,
          projectId: currentProject.id,
          type: 'teacher_note',
          by: String(me?.id || ''),
          at: new Date().toISOString(),
          data: { text },
        });
      }
    } catch {}
    // Notificar al alumno (cola persistente)
    try {
      const notifRaw = localStorage.getItem('userNotifications');
      const notifMap: Record<string, string[]> = notifRaw ? JSON.parse(notifRaw) : {};
      const msg = `Tu entrega del ${new Date(all[idx].uploadedAt).toLocaleString()} recibió una observación`;
      const list = Array.isArray(notifMap[all[idx].studentId]) ? notifMap[all[idx].studentId] : [];
      notifMap[all[idx].studentId] = [...list, msg];
      localStorage.setItem('userNotifications', JSON.stringify(notifMap));
    } catch {}
    // Email simulado a outbox
    try {
      const outboxRaw = localStorage.getItem('outboxEmails');
      const outbox: Array<{ to: string; subject: string; body: string; at: string }> = outboxRaw ? JSON.parse(outboxRaw) : [];
      outbox.push({
        to: String(all[idx].studentId),
        subject: 'Nueva observación en tu entrega',
        body: `Se agregó una observación a tu entrega del ${new Date(all[idx].uploadedAt).toLocaleString()}${text ? `: \n\n"${text}"` : ''}`,
        at: new Date().toISOString(),
      });
      localStorage.setItem('outboxEmails', JSON.stringify(outbox));
    } catch {}
    try {
      const evt = new CustomEvent('toast', { detail: { message: 'Observación guardada', type: 'success' } });
      window.dispatchEvent(evt);
    } catch {}
  };

  if (!me) return null;

  return (
    <>
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
        <h1>Entregas de mis Proyectos</h1>
        {projects.length === 0 ? (
          <div className="unla-hint" style={{ marginTop: 8 }}>Aún no tenés proyectos. Creá uno desde Proyectos.</div>
        ) : (
          <>
            {projects.length > 1 && (
              <div className="unla-form" style={{ marginTop: 6 }}>
                <label htmlFor="projSel" className="unla-label">Proyecto</label>
                <select id="projSel" className="unla-input" value={currentProject?.id || ''} onChange={(e) => setProjectId(e.target.value)}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))}
                </select>
              </div>
            )}

            <h2 className="unla-section-title" style={{ marginTop: 10 }}>Filtros</h2>
            <div className="unla-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, alignItems: 'end' }}>
              <div>
                <label className="unla-label" htmlFor="fstu">Estudiante</label>
                <select id="fstu" className="unla-input" value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}>
                  <option value="ALL">Todos</option>
                  {Array.from(new Set(deliveries.map(d => d.studentId))).map(sid => (
                    <option key={String(sid)} value={String(sid)}>{userNameOrEmail(String(sid))}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="unla-label" htmlFor="ftext">Texto</label>
                <input id="ftext" className="unla-input" placeholder="Buscar por descripción/archivo/link" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
              </div>
              <div>
                <label className="unla-label" htmlFor="ffrom">Desde</label>
                <input id="ffrom" type="date" className="unla-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <label className="unla-label" htmlFor="fto">Hasta</label>
                <input id="fto" type="date" className="unla-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>

            <div className="unla-table-container" style={{ marginTop: 12 }}>
              <table className="unla-table wide">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estudiante</th>
                    <th>Descripción</th>
                    <th>Archivo</th>
                    <th>Link</th>
                    <th>Observación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id}>
                      <td>{new Date(d.uploadedAt).toLocaleString()}</td>
                      <td>{userNameOrEmail(d.studentId)}</td>
                      <td>
                        {d.note || '-'}
                        {d.teacherNote && (
                          <span className="unla-badge" style={{ marginLeft: 6, background: '#e8f5e9', border: '1px solid #2e7d32', color: '#1b5e20' }}>Revisado</span>
                        )}
                      </td>
                      <td>{d.filename ? `${d.filename} (${((d.filesize || 0)/1024/1024).toFixed(2)} MB)` : '-'}</td>
                      <td>{d.link ? <a href={d.link} target="_blank" rel="noreferrer">Abrir</a> : '-'}</td>
                      <td>
                        <div style={{ display: 'grid', gap: 6 }}>
                          <input
                            className="unla-input"
                            placeholder="Escribí una observación (opcional)"
                            value={notes[d.id] ?? (d.teacherNote || '')}
                            onChange={(e) => setNotes(m => ({ ...m, [d.id]: e.target.value }))}
                          />
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button className="btn btn-primary btn-sm" type="button" onClick={() => saveNote(d.id)}>Guardar</button>
                            {d.teacherNote && (
                              <span className="unla-hint">Últ. rev.: {d.reviewedAt ? new Date(d.reviewedAt).toLocaleString() : ''}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-info btn-sm" type="button" onClick={() => setDetail(d)}>Ver detalle</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="unla-hint">Aún no hay entregas para este proyecto.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Modal Detalle */}
    {detail && (
      <div className="session-reminder-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, maxWidth: 800, width: '95%', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <h3>Detalle de entrega</h3>
          <div className="unla-list" style={{ maxHeight: 420, overflow: 'auto' }}>
            <div><strong>Fecha:</strong> {new Date(detail!.uploadedAt).toLocaleString()}</div>
            <div><strong>Estudiante:</strong> {userNameOrEmail(detail!.studentId)}</div>
            <div><strong>Descripción:</strong><br />{detail!.note || '—'}</div>
            <div><strong>Archivo:</strong> {detail!.filename ? `${detail!.filename} (${(((detail!.filesize || 0) as number)/1024/1024).toFixed(2)} MB)` : '—'}</div>
            <div><strong>Link:</strong> {detail!.link ? <a href={detail!.link} target="_blank" rel="noreferrer">Abrir</a> : '—'}</div>
            <div><strong>Observación actual:</strong><br />{detail!.teacherNote || '—'}</div>
            {detail!.reviewedAt && <div><strong>Últ. revisión:</strong> {new Date(detail!.reviewedAt).toLocaleString()}</div>}
            {/* Visor PDF automático */}
            {(() => {
              // Si hay link de Drive
              if (detail?.link && detail.link.includes('drive.google.com')) {
                // Extraer ID de Drive
                const match = detail.link.match(/\/file\/d\/([\w-]+)/);
                const driveId = match ? match[1] : null;
                if (driveId) {
                  return (
                    <div style={{ margin: '16px 0' }}>
                      <iframe
                        src={`https://drive.google.com/file/d/${driveId}/preview`}
                        title="Drive PDF"
                        width="100%"
                        height="80vh"
                        style={{ border: '1px solid #ccc', borderRadius: 6, minHeight: '400px', maxHeight: '80vh' }}
                        allow="autoplay"
                      />
                    </div>
                  );
                }
              }
              // Si es PDF local (simulado por filename)
              if (detail?.filename && detail.filename.toLowerCase().endsWith('.pdf') && detail.link) {
                return (
                  <div style={{ margin: '16px 0' }}>
                    <iframe
                      src={detail.link}
                      title="PDF Entrega"
                      width="100%"
                      height="80vh"
                      style={{ border: '1px solid #ccc', borderRadius: 6, minHeight: '400px', maxHeight: '80vh' }}
                      allow="autoplay"
                    />
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => setDetail(null)}>Cerrar</button>
        </div>
      </div>
    )}
    {/* Mensajería y actividad */}
    {projects.length > 0 && (
      <div className="unla-card" style={{ width: '100%', margin: '12px auto 0' }}>
        <h2>Actividad del proyecto</h2>
        <form
          className="unla-form"
          onSubmit={(e) => {
            e.preventDefault();
            const text = msg.trim();
            if (!text || !currentProject?.id) return;
            appendActivity({ id: `act-${Date.now()}`, projectId: currentProject.id, type: 'message', by: String(me?.id || ''), at: new Date().toISOString(), data: { text } });
            setMsg('');
          }}
        >
          <label className="unla-label" htmlFor="msgBox">Nuevo mensaje al equipo/estudiantes</label>
          <textarea id="msgBox" className="unla-input" rows={3} placeholder="Escribí un mensaje para el equipo" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={!currentProject?.id || !msg.trim()}>Enviar</button>
          </div>
        </form>

        {(() => {
          const map = readActivity();
          const list: Activity[] = Array.isArray(map[currentProject?.id || '']) ? map[currentProject?.id || ''] : [];
          if (list.length === 0) return <div className="unla-hint" style={{ marginTop: 8 }}>Aún no hay actividad.</div>;
          const sorted = [...list].sort((a, b) => (b.at || '').localeCompare(a.at || ''));
          return (
            <ul className="unla-list" style={{ marginTop: 12 }}>
              {sorted.map(ev => (
                <li key={ev.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(ev.at).toLocaleString()} • {userNameOrEmail(ev.by)}</div>
                  {ev.type === 'message' && (
                    <div>
                      {(() => {
                        // Detectar links en el texto
                        const text = ev.data?.text || '';
                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                        const parts = text.split(urlRegex);
                        return parts.map((part: string, idx: number) => {
                          if (urlRegex.test(part)) {
                            return (
                              <a
                                key={idx}
                                href="#"
                                style={{ color: '#64001D', textDecoration: 'underline', marginRight: 4 }}
                                onClick={e => {
                                  e.preventDefault();
                                  // Abrir visor PDF/Drive en modal
                                  let showDetail = null;
                                  if (part.includes('drive.google.com')) {
                                    const match = part.match(/\/file\/d\/([\w-]+)/);
                                    const driveId = match ? match[1] : null;
                                    if (driveId) {
                                      showDetail = {
                                        id: `msg-drive-${Date.now()}`,
                                        projectId: currentProject?.id || '',
                                        studentId: ev.by,
                                        uploadedAt: ev.at,
                                        filename: '',
                                        link: `https://drive.google.com/file/d/${driveId}/preview`,
                                      };
                                    }
                                  } else if (part.toLowerCase().endsWith('.pdf')) {
                                    showDetail = {
                                      id: `msg-pdf-${Date.now()}`,
                                      projectId: currentProject?.id || '',
                                      studentId: ev.by,
                                      uploadedAt: ev.at,
                                      filename: part.split('/').pop() || '',
                                      link: part,
                                    };
                                  }
                                  if (showDetail) setDetail(showDetail as Delivery);
                                  else window.open(part, '_blank');
                                }}
                              >
                                {part}
                              </a>
                            );
                          }
                          return part;
                        });
                      })()}
                    </div>
                  )}
                  {ev.type === 'delivery' && (
                    <div>
                      <strong>Entrega:</strong> {ev.data?.filename ? `${ev.data.filename} (${((ev.data.filesize || 0)/1024/1024).toFixed(2)} MB)` : (ev.data?.link || 'sin archivo')}
                      {ev.data?.note && <div>Nota: {ev.data.note}</div>}
                    </div>
                  )}
                  {ev.type === 'teacher_note' && (
                    <div>
                      <strong>Observación del docente:</strong> {ev.data?.text || '—'}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          );
        })()}
      </div>
    )}
    </>
  );
};

export default DeliveriesReview;

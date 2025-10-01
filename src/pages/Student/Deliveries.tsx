import React, { useMemo, useState } from 'react';
import '../../styles/unla.css';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { selectProjects } from '../../../redux/slices/projectsSlice';
import { selectUsers } from '../../../redux/slices/usersSlice';
import bgImage from '../../assets/fondo-rojo.jpg';

// Local storage helpers
const KEY = 'deliveries';
const ACTIVITY_KEY = 'projectActivity';

type Delivery = {
  id: string;
  projectId: string;
  studentId: string;
  note?: string;
  link?: string; // Optional external link (Drive, etc.)
  filename?: string; // File metadata only
  filesize?: number;
  uploadedAt: string; // ISO
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

const StudentDeliveries: React.FC = () => {
  const me = useSelector(selectCurrentUser) as any;
  const allProjects = useSelector(selectProjects);
  const allUsers = useSelector(selectUsers);

  const myProjects = useMemo(() => {
    if (!me?.id) return [] as any[];
    return allProjects.filter(p => Array.isArray(p.students) && p.students.includes(me.id));
  }, [allProjects, me]);

  const [projectId, setProjectId] = useState<string>(() => (myProjects[0]?.id || ''));
  const currentProject = useMemo(() => myProjects.find(p => p.id === projectId) || myProjects[0], [myProjects, projectId]);

  const deliveries = useMemo(() => {
    const all = readDeliveries();
    const pid = currentProject?.id || '';
    return all.filter(d => d.projectId === pid).sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
  }, [currentProject]);

  const [form, setForm] = useState<{ note: string; link: string; file: File | null }>({ note: '', link: '', file: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Delivery | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [msg, setMsg] = useState('');

  const userNameOrEmail = (id: string) => {
    const u = allUsers.find(u => String(u.id) === String(id));
    return u ? ([u.nombre, u.apellido].filter(Boolean).join(' ') || u.email || id) : id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentProject?.id) {
      setError('No tenés un proyecto asignado.');
      return;
    }
    if (!form.file && !form.link.trim()) {
      setError('Subí un PDF o ingresá un link.');
      return;
    }
    if (form.file) {
      const isPdf = form.file.type === 'application/pdf' || /\.pdf$/i.test(form.file.name);
      if (!isPdf) {
        setError('El archivo debe ser un PDF.');
        return;
      }
      const max = 10 * 1024 * 1024;
      if (form.file.size > max) {
        setError('El archivo no puede superar 10MB.');
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload: Delivery = {
        id: `del-${Date.now()}`,
        projectId: currentProject.id,
        studentId: String(me?.id || ''),
        note: form.note.trim() || undefined,
        link: form.link.trim() || undefined,
        filename: form.file?.name,
        filesize: form.file?.size,
        uploadedAt: new Date().toISOString(),
      };
      const all = readDeliveries();
      all.push(payload);
      writeDeliveries(all);
      // Append to project activity timeline
      appendActivity({
        id: `act-${Date.now()}`,
        projectId: currentProject.id,
        type: 'delivery',
        by: String(me?.id || ''),
        at: new Date().toISOString(),
        data: { note: payload.note, link: payload.link, filename: payload.filename, filesize: payload.filesize },
      });
      try {
        const evt = new CustomEvent('toast', { detail: { message: 'Entrega subida correctamente', type: 'success' } });
        window.dispatchEvent(evt);
      } catch { /* ignore */ }
      setForm({ note: '', link: '', file: null });
    } finally {
      setSubmitting(false);
    }
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
        <h1>Subir Entregas</h1>
        {myProjects.length === 0 ? (
          <div className="unla-hint" style={{ marginTop: 8 }}>No tenés proyectos asignados aún.</div>
        ) : (
          <>
            {/* Selector de proyecto en caso de tener varios */}
            {myProjects.length > 1 && (
              <div className="unla-form" style={{ marginTop: 6 }}>
                <label htmlFor="projSel" className="unla-label">Proyecto</label>
                <select id="projSel" className="unla-input" value={currentProject?.id || ''} onChange={(e) => setProjectId(e.target.value)}>
                  {myProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Descripción del proyecto y equipo */}
            {currentProject && (
              <div className="unla-list" style={{ marginTop: 12 }}>
                <div><strong>Título:</strong> {currentProject.titulo}</div>
                <div><strong>Descripción:</strong> {currentProject.descripcion}</div>
                <div><strong>Categoría:</strong> {currentProject.categoria || '-'}</div>
                <div><strong>Docente:</strong> {userNameOrEmail(currentProject.teacherId)}</div>
                <div><strong>Compañeros:</strong> {currentProject.students.filter((sid: string) => String(sid) !== String(me.id)).length === 0 ? '—' : ''}</div>
                {currentProject.students.filter((sid: string) => String(sid) !== String(me.id)).length > 0 && (
                  <ul className="unla-list" style={{ paddingLeft: 18 }}>
                    {currentProject.students.filter((sid: string) => String(sid) !== String(me.id)).map((sid: string) => (
                      <li key={sid}>{userNameOrEmail(sid)}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Form de carga */}
            <form className="unla-form" onSubmit={handleSubmit} style={{ marginTop: 12 }}>
              {error && <div className="unla-hint error" style={{ marginBottom: 8 }}>{error}</div>}
              <label className="unla-label" htmlFor="note">Descripción breve (opcional)</label>
              <input id="note" className="unla-input" placeholder="Descripción o comentario" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} />

              <label className="unla-label" htmlFor="file">Archivo PDF (opcional)</label>
              <input id="file" type="file" accept="application/pdf" onChange={(e) => setForm(f => ({ ...f, file: e.target.files && e.target.files[0] ? e.target.files![0] : null }))} />

              <label className="unla-label" htmlFor="link">Link externo (opcional)</label>
              <input id="link" className="unla-input" placeholder="https://drive.google.com/..." value={form.link} onChange={(e) => setForm(f => ({ ...f, link: e.target.value }))} />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={submitting || !currentProject?.id}>{submitting ? 'Subiendo...' : 'Subir entrega'}</button>
              </div>
            </form>

            {/* Listado compartido de entregas del proyecto */}
            <div className="unla-card" style={{ marginTop: 16 }}>
              <h2>Entregas del proyecto</h2>
              {deliveries.length === 0 ? (
                <div className="unla-hint">Aún no hay entregas.</div>
              ) : (
                <div className="unla-table-container">
                  <table className="unla-table wide">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Estudiante</th>
                        <th>Descripción</th>
                        <th>Archivo</th>
                        <th>Link</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.slice(0, visibleCount).map(d => (
                        <tr key={d.id}>
                          <td>{new Date(d.uploadedAt).toLocaleString()}</td>
                          <td>{userNameOrEmail(d.studentId)}</td>
                          <td>
                            {d.note || '-'}
                            {d.teacherNote && (
                              <span className="unla-badge" style={{ marginLeft: 6, background: '#e8f5e9', border: '1px solid #2e7d32', color: '#1b5e20' }}>Con observación</span>
                            )}
                          </td>
                          <td>{d.filename ? `${d.filename} (${((d.filesize || 0)/1024/1024).toFixed(2)} MB)` : '-'}</td>
                          <td>{d.link ? <a href={d.link} target="_blank" rel="noreferrer">Abrir</a> : '-'}</td>
                          <td>
                            <button className="btn btn-info btn-sm" type="button" onClick={() => setDetail(d)}>Ver detalle</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {visibleCount < deliveries.length && (
                    <div className="d-flex justify-content-center mt-3">
                      <button className="btn btn-outline-secondary" type="button" onClick={() => setVisibleCount(c => c + 10)}>Cargar más</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Mensajería y actividad */}
            <div className="unla-card" style={{ marginTop: 16 }}>
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
                <label className="unla-label" htmlFor="msgBox">Nuevo mensaje al equipo/docente</label>
                <textarea id="msgBox" className="unla-input" rows={3} placeholder="Escribí un mensaje para el equipo o el docente" value={msg} onChange={(e) => setMsg(e.target.value)} />
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" type="submit" disabled={!currentProject?.id || !msg.trim()}>Enviar</button>
                </div>
              </form>

              {/* Timeline */}
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
                        {ev.type === 'message' && <div>{ev.data?.text}</div>}
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
          </>
        )}
      </div>
    </div>
    {/* Modal Detalle */}
      <div className="session-reminder-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, maxWidth: 700, width: '92%', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <h3>Detalle de entrega</h3>
          <div className="unla-list" style={{ maxHeight: 420, overflow: 'auto' }}>
            <div><strong>Fecha:</strong> {new Date(detail!.uploadedAt).toLocaleString()}</div>
            <div><strong>Descripción:</strong><br />{detail!.note || '—'}</div>
            <div><strong>Archivo:</strong> {detail!.filename ? `${detail!.filename} (${(((detail!.filesize || 0) as number)/1024/1024).toFixed(2)} MB)` : '—'}</div>
            <div><strong>Link:</strong> {detail!.link ? <a href={detail!.link} target="_blank" rel="noreferrer">Abrir</a> : '—'}</div>
            <div><strong>Observación del docente:</strong><br />{detail!.teacherNote || '—'}</div>
            {detail!.reviewedAt && <div><strong>Revisado:</strong> {new Date(detail!.reviewedAt).toLocaleString()}</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="btn btn-secondary" type="button" onClick={() => setDetail(null)}>Cerrar</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default StudentDeliveries;

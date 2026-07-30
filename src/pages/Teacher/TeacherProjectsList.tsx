import React, { useMemo, useState } from 'react';
import '../../styles/unla.css';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { assignStudentToProject, removeStudentFromProject, deleteProject, addCoTeacher, removeCoTeacher } from '../../../redux/slices/projectsSlice';
import { selectProjectsByTeacher } from '../../../redux/slices/projectsSlice';
import { selectUsers } from '../../../redux/slices/usersSlice';
import { Link } from 'react-router-dom';
import bgImage from '../../assets/fondo-rojo.jpg';

const TeacherProjectsList: React.FC = () => {
  const dispatch = useDispatch<any>();
  const me = useSelector(selectCurrentUser);
  const projects = useSelector(selectProjectsByTeacher(me?.id || ''));
  const users = useSelector(selectUsers);
  const students = useMemo(() => users.filter(u => u.rol === 'ESTUDIANTE' && u.estado === 'active'), [users]);
  const teachers = useMemo(() => {
    return users.filter(u => {
      const roles = Array.isArray((u as any).roles) ? (u as any).roles : (u as any).rol ? [(u as any).rol] : [];
      const normalized = roles.map((r: any) => String(r).toUpperCase().trim());
      return normalized.some((r: string) => ['DOCENTE', 'TEACHER', 'PROFESSOR', 'ADMIN', 'SUPER_ADMIN', 'ADMINISTRADOR'].includes(r));
    });
  }, [users]);
  // Activity storage helpers
  const ACTIVITY_KEY = 'projectActivity';
  type Activity = { id: string; projectId: string; type: 'message' | 'delivery' | 'teacher_note'; by: string; at: string; data?: any };
  const readActivity = (): Record<string, Activity[]> => {
    try { const raw = localStorage.getItem(ACTIVITY_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  };
  const writeActivity = (map: Record<string, Activity[]>) => { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(map)); };
  const appendActivity = (entry: Activity) => {
    const map = readActivity();
    const list = Array.isArray(map[entry.projectId]) ? map[entry.projectId] : [];
    map[entry.projectId] = [...list, entry];
    writeActivity(map);
  };
  const [activityProjectId, setActivityProjectId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [assignMap, setAssignMap] = useState<Record<string, string>>({}); // projectId -> studentId
  const [coMap, setCoMap] = useState<Record<string, string>>({}); // projectId -> teacherId

  const getStudentName = (id: string) => {
    const s = users.find(u => u.id === id);
    return s ? ([s.nombre, s.apellido].filter(Boolean).join(' ') || s.email) : id;
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
          <h1 style={{ margin: 0 }}>Mis Proyectos</h1>
          <div className="spacer" />
          <Link className="btn btn-success btn-sm" to="/docente/proyectos/nuevo">+ Nuevo Proyecto</Link>
          <Link className="btn btn-secondary btn-sm" to="/docente/proyectos/papelera" style={{ marginLeft: 8 }}>Papelera</Link>
        </div>
    {/* Modal Actividad del proyecto */}
    {activityProjectId && (
      <div className="session-reminder-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, maxWidth: 800, width: '94%', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <h3>Actividad del proyecto</h3>
          <form
            className="unla-form"
            onSubmit={(e) => {
              e.preventDefault();
              const text = msg.trim();
              if (!text || !activityProjectId || !me?.id) return;
              appendActivity({ id: `act-${Date.now()}`, projectId: activityProjectId, type: 'message', by: String(me.id), at: new Date().toISOString(), data: { text } });
              setMsg('');
            }}
          >
            <label className="unla-label" htmlFor="msgBox">Nuevo mensaje al equipo/estudiantes</label>
            <textarea id="msgBox" className="unla-input" rows={3} placeholder="Escribí un mensaje para el equipo" value={msg} onChange={(e) => setMsg(e.target.value)} />
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" type="submit" disabled={!msg.trim()}>Enviar</button>
            </div>
          </form>

          {(() => {
            const map = readActivity();
            const list: Activity[] = Array.isArray(map[activityProjectId]) ? map[activityProjectId] : [];
            if (list.length === 0) return <div className="unla-hint" style={{ marginTop: 8 }}>Aún no hay actividad.</div>;
            const sorted = [...list].sort((a, b) => (b.at || '').localeCompare(a.at || ''));
            return (
              <ul className="unla-list" style={{ marginTop: 12, maxHeight: 420, overflow: 'auto' }}>
                {sorted.map(ev => (
                  <li key={ev.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(ev.at).toLocaleString()} • {String(ev.by) === String(me?.id) ? 'Yo' : String(ev.by)}</div>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="btn btn-secondary" type="button" onClick={() => setActivityProjectId(null)}>Cerrar</button>
          </div>
        </div>
      </div>
    )}

        {projects.length === 0 ? (
          <div className="unla-hint" style={{ marginTop: 12 }}>Aún no creaste proyectos. Usá el botón "Nuevo Proyecto".</div>
        ) : (
          <div className="unla-table-container" style={{ marginTop: 12 }}>
            <table className="unla-table wide">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Alumnos asignados (máx. 5)</th>
                  <th>Asignar Alumno</th>
                  <th>Co-docentes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/docente/entregas?projectId=${encodeURIComponent(p.id)}`}>{p.titulo}</Link>
                    </td>
                    <td style={{ maxWidth: 400, whiteSpace: 'pre-wrap' }}>{p.descripcion}</td>
                    <td>{p.categoria || '-'}</td>
                    <td>
                      {p.students.length === 0 && <div className="unla-hint">Sin alumnos asignados</div>}
                      {p.students.length > 0 && (
                        <ul className="unla-list">
                          {p.students.map(sid => (
                            <li key={sid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>{getStudentName(sid)}</span>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                title="Quitar alumno"
                                onClick={() => dispatch(removeStudentFromProject({ projectId: p.id, studentId: sid }))}
                              >
                                Quitar
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select
                          className="unla-input"
                          value={assignMap[p.id] || ''}
                          onChange={(e) => setAssignMap(m => ({ ...m, [p.id]: e.target.value }))}
                          disabled={p.students.length >= 5}
                        >
                          <option value="">Seleccioná estudiante…</option>
                          {students
                            .filter(s => !p.students.includes(s.id))
                            .map(s => (
                              <option key={s.id} value={s.id}>
                                {[s.nombre, s.apellido].filter(Boolean).join(' ') || s.email}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={p.students.length >= 5 || !(assignMap[p.id] || '').trim()}
                          onClick={async () => {
                            const sid = (assignMap[p.id] || '').trim();
                            if (!sid) return;
                            const res = await dispatch(assignStudentToProject({ projectId: p.id, studentId: sid }));
                            if (!(res as any).error) setAssignMap(m => ({ ...m, [p.id]: '' }));
                          }}
                        >
                          Asignar
                        </button>
                      </div>
                      {p.students.length >= 5 && <div className="unla-hint error" style={{ marginTop: 6 }}>Se alcanzó el máximo de 5 alumnos.</div>}
                    </td>
                    <td>
                      {(!p.coTeachers || p.coTeachers.length === 0) && <div className="unla-hint">Sin co-docentes</div>}
                      {Array.isArray(p.coTeachers) && p.coTeachers.length > 0 && (
                        <ul className="unla-list">
                          {p.coTeachers.map(tid => (
                            <li key={tid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>{getStudentName(tid)}</span>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                title="Quitar co-docente"
                                onClick={() => dispatch(removeCoTeacher({ projectId: p.id, teacherId: tid }))}
                              >
                                Quitar
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                        <select
                          className="unla-input"
                          value={coMap[p.id] || ''}
                          onChange={(e) => setCoMap(m => ({ ...m, [p.id]: e.target.value }))}
                        >
                          <option value="">Agregar co-docente…</option>
                          {teachers
                            .filter(t => t.id !== me?.id)
                            .filter(t => !(p.coTeachers || []).includes(t.id))
                            .map(t => (
                              <option key={t.id} value={t.id}>
                                {[t.nombre, t.apellido].filter(Boolean).join(' ') || t.email}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={!(coMap[p.id] || '').trim()}
                          onClick={async () => {
                            const tid = (coMap[p.id] || '').trim();
                            if (!tid) return;
                            const res = await dispatch(addCoTeacher({ projectId: p.id, teacherId: tid }));
                            if (!(res as any).error) setCoMap(m => ({ ...m, [p.id]: '' }));
                          }}
                        >
                          Agregar
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-info btn-sm" type="button" onClick={() => { setActivityProjectId(p.id); setMsg(''); }}>Actividad</button>
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          onClick={async () => {
                            const ok = window.confirm('¿Seguro que querés eliminar este proyecto? Se moverá a la Papelera.');
                            if (!ok) return;
                            const res = await dispatch(deleteProject({ projectId: p.id }));
                            if (!(res as any).error) {
                              try {
                                const evt = new CustomEvent('toast', { detail: { message: 'Proyecto enviado a Papelera', type: 'success' } });
                                window.dispatchEvent(evt);
                              } catch {}
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
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

export default TeacherProjectsList;

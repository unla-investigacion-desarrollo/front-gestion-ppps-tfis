import React, { useEffect, useMemo, useState } from 'react';
import './CargaProyecto.css';
import BackButton from '../components/BackButton';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/slices/authSlice';

const CargaPropuesta = () => {
  const user = useSelector(selectCurrentUser);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    responsable: '',
    categoria: '',
    archivo: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [detail, setDetail] = useState(null);

  const lastSubmission = useMemo(() => {
    try {
      const raw = localStorage.getItem('proposals');
      const arr = raw ? JSON.parse(raw) : [];
      const mine = user ? arr.filter((p) => p.userId === user.id) : arr;
      return mine.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))[0] || null;
    } catch { return null; }
  }, [user]);

  const allSubmissions = useMemo(() => {
    try {
      const raw = localStorage.getItem('proposals');
      const arr = raw ? JSON.parse(raw) : [];
      const mine = user ? arr.filter((p) => p.userId === user.id) : arr;
      return mine.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
    } catch { return []; }
  }, [user, submitting]);

  // Notificación cuando cambia el estado de la última propuesta
  useEffect(() => {
    try {
      const raw = localStorage.getItem('proposals');
      const arr = raw ? JSON.parse(raw) : [];
      const mine = user ? arr.filter((p) => p.userId === user.id) : arr;
      const latest = mine.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))[0];
      const key = user ? `lastProposalStatus:${user.id}` : 'lastProposalStatus:anon';
      const prev = localStorage.getItem(key);
      const current = latest ? `${latest.id}:${latest.estado}` : '';
      if (current && prev && prev !== current) {
        try {
          const evt = new CustomEvent('toast', { detail: { message: `Estado de propuesta actualizado: ${latest.estado}`, type: latest.estado === 'aprobado' ? 'success' : latest.estado === 'rechazado' ? 'error' : 'info' } });
          window.dispatchEvent(evt);
        } catch { void 0; }
      }
      if (current) localStorage.setItem(key, current);
    } catch { void 0; }
  }, [user, submitting]);

  const validate = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'El título es obligatorio';
    if (!form.descripcion.trim() || form.descripcion.trim().length < 20) e.descripcion = 'La descripción debe tener al menos 20 caracteres';
    if (!form.responsable.trim()) e.responsable = 'El responsable es obligatorio';
    if (!form.categoria) e.categoria = 'Seleccioná una categoría';
    const f = form.archivo;
    if (!f) {
      e.archivo = 'Debés adjuntar el PDF de la propuesta';
    } else {
      const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      if (!isPdf) e.archivo = 'El archivo debe ser un PDF';
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (f.size > maxSize) e.archivo = 'El archivo no puede superar 10MB';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const badgeStyle = (estado) => {
    switch (estado) {
      case 'aprobado': return { background: '#e8f5e9', border: '1px solid #2e7d32', color: '#1b5e20' };
      case 'en_estudio': return { background: '#e3f2fd', border: '1px solid #1976d2', color: '#0d47a1' };
      case 'observado': return { background: '#fff8e1', border: '1px solid #f9a825', color: '#f57f17' };
      case 'rechazado': return { background: '#ffebee', border: '1px solid #c62828', color: '#b71c1c' };
      default: return { background: '#f3f3f3', border: '1px solid #bdbdbd', color: '#424242' };
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'archivo') {
      setForm((prev) => ({ ...prev, archivo: files && files[0] ? files[0] : null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Persistimos solo metadatos del archivo (no el contenido) para evitar límites de localStorage
      const payload = {
        id: `prop-${Date.now()}`,
        userId: user?.id || 'anon',
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        responsable: form.responsable.trim(),
        categoria: form.categoria,
        estado: 'enviado',
        filename: form.archivo?.name || '',
        filesize: form.archivo?.size || 0,
        uploadedAt: new Date().toISOString(),
        history: [
          {
            at: new Date().toISOString(),
            action: 'enviado',
            by: { id: String(user?.id || ''), email: user?.email },
            from: '',
            to: 'enviado',
          }
        ]
      };
      const raw = localStorage.getItem('proposals');
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(payload);
      localStorage.setItem('proposals', JSON.stringify(arr));

      // Toast
      try {
        const evt = new CustomEvent('toast', { detail: { message: 'Propuesta enviada correctamente', type: 'success' } });
        window.dispatchEvent(evt);
      } catch { void 0; }

      // Reset form
      setForm({ titulo: '', descripcion: '', responsable: '', categoria: '', archivo: null });
    } catch {
      alert('Ocurrió un error al enviar la propuesta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="carga-proyecto-page">
      <header className="carga-proyecto-header">
        <h1>Cargar Propuesta de Trabajo Final Integrador</h1>
        <div style={{ textAlign: 'left' }}>
          <BackButton />
        </div>
      </header>

      <form className="carga-proyecto-form" onSubmit={handleSubmit}>
        <label htmlFor="titulo">Título del Proyecto</label>
        <input
          type="text"
          id="titulo"
          name="titulo"
          placeholder="Ingrese el título del proyecto"
          value={form.titulo}
          onChange={handleChange}
        />
        {errors.titulo && <div className="unla-hint error">{errors.titulo}</div>}

        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows="5"
          placeholder="Descripción del proyecto (mínimo 20 caracteres)"
          value={form.descripcion}
          onChange={handleChange}
        />
        {errors.descripcion && <div className="unla-hint error">{errors.descripcion}</div>}

        <label htmlFor="responsable">Responsable</label>
        <input
          type="text"
          id="responsable"
          name="responsable"
          placeholder="Nombre del responsable"
          value={form.responsable}
          onChange={handleChange}
        />
        {errors.responsable && <div className="unla-hint error">{errors.responsable}</div>}

        <label htmlFor="categoria">Categoría</label>
        <select id="categoria" name="categoria" value={form.categoria} onChange={handleChange}>
          <option value="">Seleccione una categoría</option>
          <option value="desarrollo">Desarrollo</option>
          <option value="investigacion">Investigación</option>
          <option value="extension">Extensión</option>
        </select>
        {errors.categoria && <div className="unla-hint error">{errors.categoria}</div>}

        <label htmlFor="archivo">Adjuntar Propuesta (PDF)</label>
        <input type="file" id="archivo" name="archivo" accept="application/pdf" onChange={handleChange} />
        {form.archivo && (
          <div className="unla-hint">Archivo: {form.archivo.name} • {(form.archivo.size / 1024 / 1024).toFixed(2)} MB</div>
        )}
        {errors.archivo && <div className="unla-hint error">{errors.archivo}</div>}

        <button type="submit" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar Propuesta'}</button>
      </form>

      {lastSubmission && (
        <div className="unla-card" style={{ marginTop: 16 }}>
          <h2>Último envío</h2>
          <div className="unla-list">
            <div><strong>Título:</strong> {lastSubmission.titulo}</div>
            <div><strong>Categoría:</strong> {lastSubmission.categoria}</div>
            <div><strong>Archivo:</strong> {lastSubmission.filename} ({(lastSubmission.filesize / 1024 / 1024).toFixed(2)} MB)</div>
            <div><strong>Fecha:</strong> {new Date(lastSubmission.uploadedAt).toLocaleString()}</div>
            <div><strong>Estado:</strong> <span className="unla-badge" style={{ ...badgeStyle(lastSubmission.estado) }}>{lastSubmission.estado}</span></div>
            {lastSubmission.reason && <div className="unla-hint error"><strong>Motivo rechazo:</strong> {lastSubmission.reason}</div>}
            {lastSubmission.note && <div className="unla-hint"><strong>Observación:</strong> {lastSubmission.note}</div>}
          </div>
        </div>
      )}

      {allSubmissions.length > 0 && (
        <div className="unla-card" style={{ marginTop: 16 }}>
          <h2>Historial de envíos</h2>
          <div className="unla-table-container">
            <table className="unla-table wide">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Archivo</th>
                  <th>Estado</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allSubmissions.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.uploadedAt).toLocaleString()}</td>
                    <td>{p.titulo}</td>
                    <td>{p.categoria}</td>
                    <td>{p.filename ? `${p.filename} (${(p.filesize / 1024 / 1024).toFixed(2)} MB)` : '-'}</td>
                    <td><span className="unla-badge" style={{ ...badgeStyle(p.estado) }}>{p.estado}</span></td>
                    <td>
                      {p.reason && <div className="unla-hint error">Rechazo: {p.reason}</div>}
                      {p.note && <div className="unla-hint">Obs.: {p.note}</div>}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="unla-btn"
                        title="Prefill con este envío"
                        onClick={() => setForm({ titulo: p.titulo, descripcion: p.descripcion, responsable: p.responsable, categoria: p.categoria, archivo: null })}
                      >
                        Rellenar datos
                      </button>
                      <button
                        type="button"
                        className="unla-btn"
                        style={{ marginLeft: 8 }}
                        onClick={() => setDetail(p)}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {detail && (
        <div className="session-reminder-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, maxWidth: 640, width: '90%', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <h3>Detalle de propuesta</h3>
            <div className="unla-list" style={{ maxHeight: 360, overflow: 'auto' }}>
              <div><strong>Título:</strong> {detail.titulo}</div>
              <div><strong>Descripción:</strong><br />{detail.descripcion}</div>
              <div><strong>Responsable:</strong> {detail.responsable}</div>
              <div><strong>Categoría:</strong> {detail.categoria}</div>
              <div><strong>Archivo:</strong> {detail.filename} ({(detail.filesize/1024/1024).toFixed(2)} MB)</div>
              <div><strong>Fecha:</strong> {new Date(detail.uploadedAt).toLocaleString()}</div>
              <div><strong>Estado:</strong> <span className="unla-badge" style={{ ...badgeStyle(detail.estado) }}>{detail.estado}</span></div>
              {detail.reason && <div className="unla-hint error"><strong>Motivo rechazo:</strong> {detail.reason}</div>}
              {detail.note && <div className="unla-hint"><strong>Observación:</strong> {detail.note}</div>}
              {Array.isArray(detail.history) && detail.history.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4>Historial de acciones</h4>
                  <ul className="unla-list" style={{ paddingLeft: 18 }}>
                    {[...detail.history].sort((a,b) => (a.at||'').localeCompare(b.at||'')).map((h, idx) => (
                      <li key={`${h.at}-${idx}`}>
                        <strong>{new Date(h.at).toLocaleString()}:</strong> {h.action}
                        {h.from && h.to && <span> (de {h.from || '—'} a {h.to})</span>}
                        {h.by?.email && <span> • por {h.by.email}</span>}
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

export default CargaPropuesta;

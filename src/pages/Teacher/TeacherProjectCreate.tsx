import React, { useState } from 'react';
import '../../styles/unla.css';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { createProject } from '../../../redux/slices/projectsSlice';
import { useNavigate } from 'react-router-dom';

const TeacherProjectCreate: React.FC = () => {
  const dispatch = useDispatch<any>();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const [form, setForm] = useState({ titulo: '', descripcion: '', categoria: '' });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!form.titulo.trim()) e.titulo = 'El título es obligatorio';
    if (!form.descripcion.trim() || form.descripcion.trim().length < 20) e.descripcion = 'La descripción debe tener al menos 20 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!user?.id) { alert('Usuario no autenticado'); return; }
    setSubmitting(true);
    try {
      await dispatch(createProject({ teacherId: user.id, titulo: form.titulo, descripcion: form.descripcion, categoria: form.categoria })).unwrap();
      setForm({ titulo: '', descripcion: '', categoria: '' });
      navigate('/docente/proyectos');
    } catch (err: any) {
      alert(err?.message || 'Error al crear el proyecto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="unla-page">
      <div className="unla-card" style={{ maxWidth: 840, margin: '0 auto' }}>
        <h1>Crear Proyecto (Docente)</h1>
        <form className="unla-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <input className="unla-input" placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <select className="unla-input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            <option value="">Categoría (opcional)</option>
            <option value="desarrollo">Desarrollo</option>
            <option value="investigacion">Investigación</option>
            <option value="extension">Extensión</option>
          </select>
          {errors.titulo && <div className="unla-hint error" style={{ gridColumn: '1 / -1' }}>{errors.titulo}</div>}
          <textarea className="unla-input" placeholder="Descripción (mínimo 20 caracteres)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} style={{ gridColumn: '1 / -1', minHeight: 140 }} />
          {errors.descripcion && <div className="unla-hint error" style={{ gridColumn: '1 / -1' }}>{errors.descripcion}</div>}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="unla-btn" onClick={() => navigate('/docente/proyectos')}>Cancelar</button>
            <button type="submit" className="unla-btn" disabled={submitting}>{submitting ? 'Creando…' : 'Crear Proyecto'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherProjectCreate;

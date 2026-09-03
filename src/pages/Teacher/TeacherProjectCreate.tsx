import React, { useState, useEffect } from 'react';
import './TeacherProjectCreate.css';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { createProject, fetchProjectTypes, selectProjectTypes, ProjectType } from '../../../redux/slices/projectsSlice';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/toast';

const TeacherProjectCreate: React.FC = () => {
  const dispatch = useDispatch<any>();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const reduxTypes = useSelector(selectProjectTypes);
  const projectTypes: ProjectType[] = (reduxTypes && reduxTypes.length > 0) ? reduxTypes : [
    { id: 1, name: 'Development' },
    { id: 2, name: 'Research' },
    { id: 3, name: 'Extension' },
    { id: 4, name: 'Other' },
  ];

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    projectTypeId: '' as string | number,
    categoria: '',
    estado: 'activo'
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchProjectTypes());
  }, [dispatch]);

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!form.titulo.trim()) {
      e.titulo = 'El título es obligatorio';
    }
    if (!form.projectTypeId && !form.categoria) {
      e.categoria = 'El tipo de proyecto es obligatorio';
    }
    if (!form.estado) {
      e.estado = 'El estado es obligatorio';
    }
    if (!form.descripcion.trim()) {
      e.descripcion = 'La descripción es obligatoria';
    } else if (form.descripcion.trim().length < 20) {
      e.descripcion = 'La descripción debe tener al menos 20 caracteres';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!user?.id) {
      showToast('Usuario no autenticado', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        createProject({
          teacherId: user.id,
          titulo: form.titulo,
          descripcion: form.descripcion,
          projectTypeId: form.projectTypeId ? Number(form.projectTypeId) : undefined,
          categoria: form.categoria,
          estado: form.estado
        })
      ).unwrap();
      showToast('Proyecto creado exitosamente', 'success');
      setForm({ titulo: '', descripcion: '', projectTypeId: '', categoria: '', estado: 'activo' });
      navigate('/docente/proyectos');
    } catch (err: any) {
      showToast(err?.message || 'Error al crear el proyecto', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="project-create-container">
      <div className="project-create-card">
        <div className="project-create-grid">
          {/* Left Column: Form Side */}
          <div className="project-create-form-side">
            <a
              href="#"
              className="project-create-back-link"
              onClick={(e) => {
                e.preventDefault();
                navigate('/docente/proyectos');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
              </svg>
              Volver a proyectos
            </a>

            <h1 className="project-create-title">Crear Proyecto</h1>
            <p className="project-create-subtitle">Completa la información para dar de alta un nuevo proyecto.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="titulo">
                  Título <span>*</span>
                </label>
                <input
                  id="titulo"
                  type="text"
                  className={`input-field ${errors.titulo ? 'error' : ''}`}
                  placeholder="Ej. Plataforma de gestión académica"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
                {errors.titulo && (
                  <span className="error-hint">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                      <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                    </svg>
                    {errors.titulo}
                  </span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="categoria">
                    Tipo de Proyecto <span>*</span>
                  </label>
                  <select
                    id="categoria"
                    className={`select-field ${errors.categoria ? 'error' : ''}`}
                    value={form.projectTypeId}
                    onChange={(e) => {
                      const selId = e.target.value ? Number(e.target.value) : '';
                      const found = projectTypes.find((t) => t.id === selId);
                      setForm({ ...form, projectTypeId: selId, categoria: found ? found.name : '' });
                    }}
                  >
                    <option value="">Selecciona un tipo de proyecto</option>
                    {projectTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoria && (
                    <span className="error-hint">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                      </svg>
                      {errors.categoria}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="estado">
                    Estado <span>*</span>
                  </label>
                  <select
                    id="estado"
                    className={`select-field ${errors.estado ? 'error' : ''}`}
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    <option value="">Selecciona un estado</option>
                    <option value="activo">Activo</option>
                    <option value="borrador">Borrador</option>
                    <option value="pausado">Pausado</option>
                    <option value="completado">Completado</option>
                  </select>
                  {errors.estado && (
                    <span className="error-hint">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                      </svg>
                      {errors.estado}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="descripcion">
                  Descripción <span>*</span>
                </label>
                <textarea
                  id="descripcion"
                  className={`textarea-field ${errors.descripcion ? 'error' : ''}`}
                  placeholder="Describí brevemente el proyecto, sus objetivos y alcance..."
                  value={form.descripcion}
                  maxLength={2000}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
                <div className="character-counter">{form.descripcion.length} / 2000</div>
                {errors.descripcion && (
                  <span className="error-hint">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                      <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                    </svg>
                    {errors.descripcion}
                  </span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => navigate('/docente/proyectos')}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? (
                    'Creando…'
                  ) : (
                    <>
                      Crear Proyecto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Info Side */}
          <div className="project-create-info-side">
            <div className="info-header">
              <div className="info-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM4 1a1 1 0 0 0-1 1v1h10V2a1 1 0 0 0-1-1H4zm9 3v10H3V4h10z" />
                  <path d="M5 10.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                </svg>
              </div>
              <h2 className="info-title">Creá un nuevo proyecto</h2>
              <p className="info-subtitle">
                Los proyectos te permiten organizar el trabajo, asociarlos a una categoría y dar seguimiento a su estado.
              </p>
            </div>

            <div className="info-list">
              <div className="info-item">
                <div className="info-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z" />
                    <path d="M6 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                  </svg>
                </div>
                <div className="info-item-content">
                  <span className="info-item-title">Título</span>
                  <span className="info-item-desc">Usá un nombre claro y descriptivo.</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1.5 9A1.5 1.5 0 0 1 3 7.5h3A1.5 1.5 0 0 1 7 9v3A1.5 1.5 0 0 1 5.5 13.5h-3A1.5 1.5 0 0 1 1 12V9zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V9a.5.5 0 0 0-.5-.5H3zm6.5.5A1.5 1.5 0 0 1 10.5 7.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 12V9zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V9a.5.5 0 0 0-.5-.5h-3z" />
                  </svg>
                </div>
                <div className="info-item-content">
                  <span className="info-item-title">Categoría</span>
                  <span className="info-item-desc">Elegí la categoría que corresponda.</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                  </svg>
                </div>
                <div className="info-item-content">
                  <span className="info-item-title">Estado</span>
                  <span className="info-item-desc">Definí el estado inicial del proyecto.</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z" />
                    <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
                  </svg>
                </div>
                <div className="info-item-content">
                  <span className="info-item-title">Descripción</span>
                  <span className="info-item-desc">Incluí los objetivos, alcance y detalles relevantes.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProjectCreate;


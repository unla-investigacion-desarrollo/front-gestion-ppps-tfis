import React, { useState, useEffect } from 'react';
import './TeacherProjectCreate.css';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { createProject, fetchProjectTypes, selectProjectTypes, ProjectType } from '../../../redux/slices/projectsSlice';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/toast';
import {
  FaArrowLeft,
  FaCircleExclamation,
  FaFileLines,
  FaTag,
  FaTableCellsLarge,
  FaAlignLeft,
} from 'react-icons/fa6';

const TeacherProjectCreate: React.FC = () => {
  const dispatch = useDispatch<any>();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const reduxTypes = useSelector(selectProjectTypes);
  const baseTypes: ProjectType[] = (reduxTypes && reduxTypes.length > 0) ? reduxTypes : [
    { id: 1, name: 'Development' },
    { id: 2, name: 'Research' },
    { id: 3, name: 'Extension' },
    { id: 4, name: 'Other' },
  ];
  const projectTypes: ProjectType[] = baseTypes.some((t) => t.name.toUpperCase() === 'PPP')
    ? baseTypes
    : [...baseTypes, { id: 99, name: 'PPP' }];

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    projectTypeId: '' as string | number,
    categoria: '',
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
        })
      ).unwrap();
      showToast('Proyecto creado exitosamente', 'success');
      setForm({ titulo: '', descripcion: '', projectTypeId: '', categoria: '' });
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
              className="project-create-back-link d-inline-flex align-items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                navigate('/docente/proyectos');
              }}
            >
              <FaArrowLeft size={16} />
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
                  <span className="error-hint d-inline-flex align-items-center gap-1">
                    <FaCircleExclamation size={14} />
                    {errors.titulo}
                  </span>
                )}
              </div>

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
                      {type.name.toUpperCase() === 'PPP' ? 'PPP (Práctica Profesional Supervisada)' : `TFI - ${type.name}`}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <span className="error-hint d-inline-flex align-items-center gap-1">
                    <FaCircleExclamation size={14} />
                    {errors.categoria}
                  </span>
                )}
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
                  <span className="error-hint d-inline-flex align-items-center gap-1">
                    <FaCircleExclamation size={14} />
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
                <FaFileLines size={24} />
              </div>
              <h2 className="info-title">Creá un nuevo proyecto</h2>
              <p className="info-subtitle">
                Los proyectos te permiten organizar el trabajo, asociarlos a una categoría y dar seguimiento a su estado.
              </p>
            </div>

            <div className="info-list">
              <div className="info-item">
                <div className="info-item-icon">
                  <FaTag size={16} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-title">Título</span>
                  <span className="info-item-desc">Usá un nombre claro y descriptivo.</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-item-icon">
                  <FaTableCellsLarge size={16} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-title">Categoría</span>
                  <span className="info-item-desc">Elegí la categoría que corresponda.</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-item-icon">
                  <FaAlignLeft size={16} />
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


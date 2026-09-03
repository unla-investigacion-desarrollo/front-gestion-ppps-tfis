import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectProjectTypes, ProjectType } from '../../../../redux/slices/projectsSlice';

// Interfaz que define la estructura del estado de los filtros de proyectos
export interface ProjectFiltersState {
  q: string;
  categoria: string;
  alumnos: string;
}

// Propiedades recibidas por el componente ProjectFilters
interface ProjectFiltersProps {
  filters: ProjectFiltersState;
  onFiltersChange: (newFilters: ProjectFiltersState) => void;
  onClearFilters: () => void;
  projectTypes?: ProjectType[];
}

/**
 * Componente que renderiza la barra de búsqueda y el panel colapsable de filtros avanzados.
 * Permite buscar proyectos por texto y filtrar por tipo de proyecto o estado de asignación de alumnos.
 */
const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  projectTypes: propTypes,
}) => {
  // Estado local para abrir o cerrar el panel colapsable de filtros avanzados
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Tipos de proyectos desde Redux o props, con respaldo por defecto
  const reduxTypes = useSelector(selectProjectTypes);
  const availableTypes = (propTypes && propTypes.length > 0) ? propTypes : (reduxTypes && reduxTypes.length > 0) ? reduxTypes : [
    { id: 1, name: 'Desarrollo' },
    { id: 2, name: 'Investigación' },
    { id: 3, name: 'Extensión' },
    { id: 4, name: 'Otro' },
  ];

  // Manejador genérico de cambios en los inputs y selectores de filtros
  const handleFilterChange = (key: keyof ProjectFiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="unla-card filters-card">
      <div className="row g-3 align-items-center">
        {/* Input buscador principal con icono de lupa */}
        <div className="col-md-9 col-sm-8">
          <div className="search-input-wrapper">
            <span className="search-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#9ca3af" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </span>
            <input
              type="text"
              className="form-control search-input-field"
              placeholder="Buscar proyecto..."
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
            />
          </div>
        </div>

        {/* Botón de alternancia de filtros avanzados */}
        <div className="col-md-3 col-sm-4 text-end">
          <button
            type="button"
            className={`btn filter-btn-toggle w-100 ${isPanelOpen ? 'active' : ''}`}
            onClick={() => setIsPanelOpen(!isPanelOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.868V12.5a.5.5 0 0 1-.276.447l-2 1A.5.5 0 0 1 7 13.5v-4.632L2.628 3.834A.5.5 0 0 1 2.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v4.162l1-.5V8.5a.5.5 0 0 1 .128-.334L12.5 3.308V2h-10z"/>
            </svg>
            Filtrar
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ marginLeft: 'auto', transform: isPanelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Panel colapsable de filtros detallados */}
      {isPanelOpen && (
        <div className="advanced-filters-panel">
          <div className="row g-3">
            {/* Selector por Categoría / Tipo de Proyecto */}
            <div className="col-md-5">
              <label className="form-label text-muted small mb-1" style={{ fontWeight: 500 }}>Tipo de Proyecto</label>
              <select
                className="form-select filter-select-field"
                value={filters.categoria}
                onChange={(e) => handleFilterChange('categoria', e.target.value)}
              >
                <option value="ALL">Todos los tipos</option>
                {availableTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector por Estado de Alumnos */}
            <div className="col-md-5">
              <label className="form-label text-muted small mb-1" style={{ fontWeight: 500 }}>Alumnos Asignados</label>
              <select
                className="form-select filter-select-field"
                value={filters.alumnos}
                onChange={(e) => handleFilterChange('alumnos', e.target.value)}
              >
                <option value="ALL">Cualquier cantidad de alumnos</option>
                <option value="NONE">Sin alumnos asignados</option>
                <option value="SOME">Con alumnos asignados (1 - 4)</option>
                <option value="FULL">Límite alcanzado (5 alumnos)</option>
              </select>
            </div>

            {/* Botón para restablecer y limpiar todos los filtros */}
            <div className="col-md-2 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary btn-clear-filters w-100 d-inline-flex align-items-center justify-content-center gap-2"
                onClick={onClearFilters}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFilters;

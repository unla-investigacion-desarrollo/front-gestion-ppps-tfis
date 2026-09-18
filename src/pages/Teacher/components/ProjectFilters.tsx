import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FaMagnifyingGlass, FaFilter, FaChevronDown, FaArrowRotateLeft } from 'react-icons/fa6';
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
  const baseTypes = (propTypes && propTypes.length > 0) ? propTypes : (reduxTypes && reduxTypes.length > 0) ? reduxTypes : [
    { id: 1, name: 'Desarrollo' },
    { id: 2, name: 'Investigación' },
    { id: 3, name: 'Extensión' },
    { id: 4, name: 'Otro' },
  ];
  const availableTypes = baseTypes.some((t) => t.name.toUpperCase() === 'PPP')
    ? baseTypes
    : [...baseTypes, { id: 99, name: 'PPP' }];

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
              <FaMagnifyingGlass size={15} color="#9ca3af" />
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
            <FaFilter size={14} />
            Filtrar
            <FaChevronDown
              size={11}
              style={{
                marginLeft: 'auto',
                transform: isPanelOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
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
                <FaArrowRotateLeft size={13} />
                <span>Limpiar filtros</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFilters;

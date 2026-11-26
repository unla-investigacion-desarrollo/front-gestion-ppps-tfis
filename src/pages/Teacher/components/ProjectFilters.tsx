import React from 'react';
import { useSelector } from 'react-redux';
import { FaMagnifyingGlass, FaArrowRotateLeft } from 'react-icons/fa6';
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
 * Componente que renderiza la barra de búsqueda y filtros en línea.
 * Permite buscar proyectos por texto y filtrar por tipo de proyecto o estado de asignación de alumnos.
 */
const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  projectTypes: propTypes,
}) => {
  // Tipos de proyectos desde Redux o props, con respaldo por defecto
  const reduxTypes = useSelector(selectProjectTypes);
  const baseTypes = (propTypes && propTypes.length > 0) ? propTypes : (reduxTypes && reduxTypes.length > 0) ? reduxTypes : [
    { id: 1, name: 'Desarrollo' },
    { id: 2, name: 'Investigación' },
    { id: 3, name: 'Extensión' },
    { id: 4, name: 'Otro' },
  ];
  const availableTypes = baseTypes.filter(
    (type) => type.name.trim().toUpperCase() !== 'PPP'
  );

  // Manejador genérico de cambios en los inputs y selectores de filtros
  const handleFilterChange = (key: keyof ProjectFiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="projects-filters-bar">
      {/* Input buscador principal con icono de lupa */}
      <div className="projects-search-box">
        <span className="projects-search-icon">
          <FaMagnifyingGlass size={15} />
        </span>
        <input
          type="text"
          className="projects-search-input"
          placeholder="Buscar proyecto..."
          value={filters.q}
          onChange={(e) => handleFilterChange('q', e.target.value)}
        />
      </div>

      {/* Selector por Categoría / Tipo de Proyecto */}
      <select
        className="projects-select"
        value={filters.categoria}
        onChange={(e) => handleFilterChange('categoria', e.target.value)}
        aria-label="Filtrar por tipo de proyecto"
      >
        <option value="ALL">Tipo: todos</option>
        {availableTypes.map((type) => (
          <option key={type.id} value={type.name}>
            {type.name}
          </option>
        ))}
      </select>

      {/* Selector por Estado de Alumnos */}
      <select
        className="projects-select"
        value={filters.alumnos}
        onChange={(e) => handleFilterChange('alumnos', e.target.value)}
        aria-label="Filtrar por alumnos asignados"
      >
        <option value="ALL">Alumnos: todos</option>
        <option value="NONE">Sin alumnos asignados</option>
        <option value="SOME">Con alumnos (1 - 4)</option>
        <option value="FULL">Límite alcanzado (5)</option>
      </select>

      {/* Botón para restablecer y limpiar todos los filtros */}
      <button
        type="button"
        className="projects-clear-btn"
        onClick={onClearFilters}
      >
        <FaArrowRotateLeft size={13} />
        Limpiar filtros
      </button>
    </div>
  );
};

export default ProjectFilters;

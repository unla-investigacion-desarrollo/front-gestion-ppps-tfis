import React from 'react';
import { FaMagnifyingGlass, FaArrowRotateLeft } from 'react-icons/fa6';

export interface TutorProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterEstado: string;
  onEstadoChange: (value: string) => void;
  onClearFilters: () => void;
  placeholder?: string;
}

/**
 * Componente reutilizable y responsive de barra de filtros para proyectos de tutor.
 * Emplea el sistema de grid de Bootstrap (row/col), FontAwesome vía react-icons y estilos UNLa.
 */
export const TutorProjectFilters: React.FC<TutorProjectFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filterEstado,
  onEstadoChange,
  onClearFilters,
  placeholder = 'Buscar proyecto o estudiante...',
}) => {
  return (
    <div className="projects-filters-bar">
      {/* Campo buscador principal con icono */}
      <div className="projects-search-box">
        <span className="projects-search-icon">
          <FaMagnifyingGlass size={15} />
        </span>
        <input
          type="text"
          className="projects-search-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Selector de filtro por estado */}
      <select
        className="projects-select"
        value={filterEstado}
        onChange={(e) => onEstadoChange(e.target.value)}
        aria-label="Filtrar por estado"
      >
        <option value="todos">Estado: Todos</option>
        <option value="en curso">Estado: En curso</option>
        <option value="pendiente">Estado: Pendiente</option>
        <option value="finalizado">Estado: Finalizado</option>
        <option value="tutoria">Estado: Tutoría solicitada</option>
      </select>

      {/* Botón para restablecer y limpiar filtros */}
      <button
        type="button"
        className="projects-clear-btn"
        onClick={onClearFilters}
        title="Limpiar filtros de búsqueda"
      >
        <FaArrowRotateLeft size={13} />
        <span>Limpiar filtros</span>
      </button>
    </div>
  );
};

export default TutorProjectFilters;

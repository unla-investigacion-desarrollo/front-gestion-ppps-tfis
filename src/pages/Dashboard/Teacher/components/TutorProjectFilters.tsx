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
    <div className="unla-card filters-card mb-4">
      <div className="row g-3 align-items-center">
        {/* Campo buscador principal con icono */}
        <div className="col-12 col-md-6 col-lg-7">
          <div className="search-input-wrapper">
            <span className="search-icon-wrapper">
              <FaMagnifyingGlass size={15} color="#9ca3af" />
            </span>
            <input
              type="text"
              className="form-control search-input-field"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Selector de filtro por estado */}
        <div className="col-12 col-sm-6 col-md-3 col-lg-3">
          <select
            className="form-select filter-select-field"
            value={filterEstado}
            onChange={(e) => onEstadoChange(e.target.value)}
          >
            <option value="todos">Estado: Todos</option>
            <option value="en curso">Estado: En curso</option>
            <option value="pendiente">Estado: Pendiente</option>
            <option value="finalizado">Estado: Finalizado</option>
          </select>
        </div>

        {/* Botón para restablecer y limpiar filtros */}
        <div className="col-12 col-sm-6 col-md-3 col-lg-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-clear-filters w-100 d-inline-flex align-items-center justify-content-center gap-2"
            onClick={onClearFilters}
            title="Limpiar filtros de búsqueda"
          >
            <FaArrowRotateLeft size={13} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorProjectFilters;

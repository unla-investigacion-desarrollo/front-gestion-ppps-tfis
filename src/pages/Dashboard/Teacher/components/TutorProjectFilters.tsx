import React from 'react';

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
 * Emplea el sistema de grid de Bootstrap (row/col) y los estilos compartidos de gestión de proyectos.
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="#9ca3af"
                viewBox="0 0 24 24"
              >
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
            </svg>
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorProjectFilters;

import React from 'react';

// Interfaz del estado de los filtros
interface FiltersState {
  q: string;
  rol: string;
  estado: string;
}

// Propiedades recibidas por el componente UserFilters
interface UserFiltersProps {
  filters: FiltersState;
  onFiltersChange: (newFilters: FiltersState) => void;
  onClearFilters: () => void;
}

/**
 * Componente que renderiza la barra de filtros en una tarjeta independiente.
 * Contiene buscador con icono de lupa, selectores de rol y estado, y botón para resetear filtros.
 */
const UserFilters: React.FC<UserFiltersProps> = ({ filters, onFiltersChange, onClearFilters }) => {
  // Manejador específico de cambios en los inputs/selects del filtro
  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="unla-card filters-card">
      <div className="row g-3 align-items-center">
        {/* Campo de búsqueda por texto con icono de lupa integrado */}
        <div className="col-md-5">
          <div className="search-input-wrapper">
            <span className="search-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--unla-muted)" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </span>
            <input
              type="text"
              className="form-control search-input-field"
              placeholder="Buscar por email, nombre o apellido"
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
            />
          </div>
        </div>

        {/* Selector de Rol */}
        <div className="col-md-3">
          <select
            className="form-select filter-select-field"
            value={filters.rol}
            onChange={(e) => handleFilterChange('rol', e.target.value)}
          >
            <option value="ALL">Rol: todos</option>
            <option value="ESTUDIANTE">Estudiante</option>
            <option value="DOCENTE">Docente</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>

        {/* Selector de Estado */}
        <div className="col-md-2">
          <select
            className="form-select filter-select-field"
            value={filters.estado}
            onChange={(e) => handleFilterChange('estado', e.target.value)}
          >
            <option value="ALL">Estado: todos</option>
            <option value="pending">Pendiente</option>
            <option value="active">Activo</option>
            <option value="invited">Invitado</option>
            <option value="rejected">Rechazado</option>
            <option value="disabled">Deshabilitado</option>
          </select>
        </div>

        {/* Botón para Limpiar Filtros */}
        <div className="col-md-2 text-end">
          <button
            type="button"
            className="btn btn-outline-secondary btn-clear-filters d-inline-flex align-items-center justify-content-center gap-2"
            onClick={onClearFilters}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.868V12.5a.5.5 0 0 1-.276.447l-2 1A.5.5 0 0 1 7 13.5v-4.632L2.628 3.834A.5.5 0 0 1 2.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v4.162l1-.5V8.5a.5.5 0 0 1 .128-.334L12.5 3.308V2h-10z"/>
            </svg>
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;

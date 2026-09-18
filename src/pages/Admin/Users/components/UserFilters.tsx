import React from 'react';
import { FaMagnifyingGlass, FaArrowRotateLeft } from 'react-icons/fa6';

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
              <FaMagnifyingGlass size={15} color="var(--unla-muted)" />
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
            <FaArrowRotateLeft size={14} />
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;

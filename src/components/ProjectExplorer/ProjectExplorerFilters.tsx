import React from 'react';
import {
  FaMagnifyingGlass,
  FaArrowRotateLeft,
  FaTableList,
  FaTableCellsLarge,
} from 'react-icons/fa6';
import { ViewMode } from './types';

export interface ProjectExplorerFiltersProps {
  searchQuery: string;
  onSearchChange: (newQuery: string) => void;
  selectedCategory: string;
  onCategoryChange: (newCategory: string) => void;
  availableCategories: string[];
  selectedStatus: string;
  onStatusChange: (newStatus: string) => void;
  onClearFilters: () => void;
  viewMode: ViewMode;
  onViewModeChange: (newMode: ViewMode) => void;
}

/**
 * Barra de filtros del explorador de proyectos: buscador, categorías, estado y alternador de vista.
 */
export const ProjectExplorerFilters: React.FC<ProjectExplorerFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  selectedStatus,
  onStatusChange,
  onClearFilters,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="project-join-filters-bar">
      {/* Buscador con lupa integrada */}
      <div className="project-join-search-box">
        <span className="project-join-search-icon">
          <FaMagnifyingGlass size={15} />
        </span>
        <input
          type="text"
          className="project-join-search-input"
          placeholder="Buscar por título, descripción, temática o docente..."
          value={searchQuery}
          onChange={(changeEvent) => onSearchChange(changeEvent.target.value)}
        />
      </div>

      {/* Selector desplegable de Categoría */}
      <select
        className="project-join-select"
        value={selectedCategory}
        onChange={(changeEvent) => onCategoryChange(changeEvent.target.value)}
      >
        <option value="ALL">Categoría: Todas</option>
        {availableCategories.map((categoryItem) => (
          <option key={categoryItem} value={categoryItem}>
            {categoryItem}
          </option>
        ))}
      </select>

      {/* Selector desplegable de Estado */}
      <select
        className="project-join-select"
        value={selectedStatus}
        onChange={(changeEvent) => onStatusChange(changeEvent.target.value)}
      >
        <option value="ALL">Estado: Todos</option>
        <option value="AVAILABLE">Disponibles para unirme</option>
        <option value="PENDING">Con solicitud enviada</option>
        <option value="ACTIVE">Ya soy miembro</option>
      </select>

      {/* Botón para Limpiar Filtros */}
      <button
        type="button"
        className="project-join-clear-btn"
        onClick={onClearFilters}
        title="Restablecer filtros"
      >
        <FaArrowRotateLeft size={13} />
        <span>Limpiar filtros</span>
      </button>

      {/* Alternador de Modo de Vista (Tabla vs Cuadrícula) */}
      <div className="project-join-view-toggle">
        <button
          type="button"
          className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => onViewModeChange('table')}
          title="Vista de tabla"
        >
          <FaTableList size={14} />
        </button>
        <button
          type="button"
          className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
          onClick={() => onViewModeChange('cards')}
          title="Vista de cuadrícula"
        >
          <FaTableCellsLarge size={14} />
        </button>
      </div>
    </div>
  );
};

export default ProjectExplorerFilters;

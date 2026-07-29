import React from 'react';

// Estructura del estado de filtros
interface FiltersState {
  q: string; // Texto de búsqueda para email, nombre o apellido.
  rol: string; // Filtro de rol seleccionado (p. ej. "ESTUDIANTE", "DOCENTE", "ALL", etc.).
  estado: string; // Filtro del estado de cuenta de usuario (p. ej. "active", "invited", etc.).
}

// Interfaz para definir las propiedades del componente de Filtros de Usuarios.
interface UserFiltersProps {
  filters: FiltersState; // El estado actual de los filtros.
  onFiltersChange: (newFilters: FiltersState) => void; // Callback para propagar los cambios en los filtros hacia el padre.
}

/**
 * Componente que muestra los campos para realizar búsquedas y filtrar el listado de usuarios por rol y estado.
 */
const UserFilters: React.FC<UserFiltersProps> = ({ filters, onFiltersChange }) => {
  // Manejador específico de cambios en los inputs/selects del filtro
  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <>
      <h2 className="unla-section-title">Filtros</h2>
      <div 
        className="unla-form" 
        style={{ gridTemplateColumns: '2fr 1fr 1fr', display: 'grid', marginBottom: 12, gap: '8px' }}
      >
        {/* Input para búsqueda por texto (email, nombre, apellido) */}
        <input
          className="form-control"
          placeholder="Buscar por email, nombre o apellido"
          value={filters.q}
          onChange={(e) => handleFilterChange('q', e.target.value)}
        />

        {/* Selector para filtrar por Rol de usuario */}
        <select
          className="form-select"
          value={filters.rol}
          onChange={(e) => handleFilterChange('rol', e.target.value)}
        >
          <option value="ALL">Rol: todos</option>
          <option value="ESTUDIANTE">Estudiante</option>
          <option value="DOCENTE">Docente</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>

        {/* Selector para filtrar por Estado del usuario */}
        <select
          className="form-select"
          value={filters.estado}
          onChange={(e) => handleFilterChange('estado', e.target.value)}
        >
          <option value="ALL">Estado: todos</option>
          <option value="pending">Pendiente</option>
          <option value="active">Activo</option>
          <option value="invited">Invitado</option>
          <option value="rejected">Rechazado</option>
          <option value="disabled">Deshabilitado</option>
          <option value="papelera">Papelera</option>
        </select>
      </div>
    </>
  );
};

export default UserFilters;

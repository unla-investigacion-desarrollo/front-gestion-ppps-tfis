import React from 'react';

// Interfaz para definir las propiedades del componente genérico de Paginación.
interface PaginationProps {
  currentPage: number; // Página actual seleccionada (1-indexed).
  totalItems: number; // Cantidad total de elementos filtrados.
  pageSize: number; // Cantidad de elementos mostrados por página.
  onPageChange: (page: number) => void; // Función callback para notificar el cambio de página.
}

/**
 * Componente genérico y reutilizable de paginación compatible con Bootstrap.
 * Muestra el rango actual de elementos visibles, el total de páginas y botones de navegación.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  // Cálculo de páginas totales
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
      {/* Texto informativo de rango de elementos */}
      <div style={{ color: 'var(--unla-muted)' }}>
        Mostrando {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} de {totalItems}
      </div>
      
      {/* Espaciador flexible para alinear los botones a la derecha */}
      <div className="spacer" style={{ flexGrow: 1 }} />
      
      {/* Botón de página anterior */}
      <button
        className="btn btn-outline-secondary"
        type="button"
        disabled={!canPrev}
        onClick={() => canPrev && onPageChange(currentPage - 1)}
      >
        Anterior
      </button>
      
      {/* Indicador de página actual */}
      <div>
        Página {currentPage} / {totalPages}
      </div>
      
      {/* Botón de página siguiente */}
      <button
        className="btn btn-outline-secondary"
        type="button"
        disabled={!canNext}
        onClick={() => canNext && onPageChange(currentPage + 1)}
      >
        Siguiente
      </button>
    </div>
  );
};

export default Pagination;

import React from 'react';

// Interfaz para definir las propiedades del componente genérico de Paginación.
export interface PaginationProps {
  currentPage: number; // Página actual seleccionada (1-indexed).
  totalItems: number; // Cantidad total de elementos filtrados.
  pageSize: number; // Cantidad de elementos mostrados por página.
  onPageChange: (page: number) => void; // Función callback para notificar el cambio de página.
  pageSizeOptions?: number[]; // Opciones de cantidad de elementos por página.
  onPageSizeChange?: (pageSize: number) => void; // Callback al cambiar el tamaño de página.
}

/**
 * Componente genérico y reutilizable de paginación compatible con Bootstrap y diseño UNLa.
 * Muestra el rango actual de elementos visibles, selector de tamaño por página,
 * botones numerados directos y navegación Anterior / Siguiente.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}) => {
  // Cálculo de páginas totales
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  // Generar lista inteligente de números de página
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (currentPage > 3) {
      pages.push('...');
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTop: '1px solid #f1f5f9',
      }}
    >
      {/* Información de rango y selector de tamaño por página */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.875rem', color: '#6b7280' }}>
        <span>
          Mostrando <strong>{startItem}</strong> - <strong>{endItem}</strong> de <strong>{totalItems}</strong>
        </span>

        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Mostrar:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto', display: 'inline-block', fontSize: '0.85rem', padding: '2px 24px 2px 8px' }}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} por pág.
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de navegación y páginas numeradas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Botón página anterior */}
        <button
          className="btn btn-sm btn-outline-secondary"
          type="button"
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(currentPage - 1)}
          style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6 }}
        >
          Anterior
        </button>

        {/* Botones de páginas numeradas */}
        {getPageNumbers().map((item, idx) =>
          typeof item === 'string' ? (
            <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#9ca3af' }}>
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className="btn btn-sm"
              style={{
                minWidth: 32,
                height: 32,
                padding: '0 6px',
                borderRadius: 6,
                fontWeight: currentPage === item ? 600 : 400,
                backgroundColor: currentPage === item ? 'var(--unla-primary, #64001d)' : '#ffffff',
                color: currentPage === item ? '#ffffff' : '#4b5563',
                border: currentPage === item ? '1px solid var(--unla-primary, #64001d)' : '1px solid #e5e7eb',
                cursor: 'pointer',
              }}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        )}

        {/* Botón página siguiente */}
        <button
          className="btn btn-sm btn-outline-secondary"
          type="button"
          disabled={!canNext}
          onClick={() => canNext && onPageChange(currentPage + 1)}
          style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6 }}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default Pagination;

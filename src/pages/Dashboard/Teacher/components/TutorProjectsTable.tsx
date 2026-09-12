import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface TutorProjectRecord {
  id: string;
  proyecto: string;
  subtitulo: string;
  tipo: 'TFI' | 'PPI';
  estudiantePrincipal: string;
  estudiantesExtras: string;
  estado: 'En curso' | 'Pendiente' | 'Finalizado';
  estadoClass: 'curso' | 'revision' | 'finalizado';
  entrega: 'Pendiente' | 'En revisión' | 'Sin entrega' | 'Aprobada';
  entregaClass: 'revision' | 'documentacion' | 'sin-entrega' | 'aprobada';
  ultimaTutoria: string;
}

const INITIAL_PROJECTS: TutorProjectRecord[] = [
  {
    id: '1',
    proyecto: 'Desarrollo TFI y PPP',
    subtitulo: 'Plataforma de gestión académica',
    tipo: 'TFI',
    estudiantePrincipal: 'Ana García',
    estudiantesExtras: '+2',
    estado: 'En curso',
    estadoClass: 'curso',
    entrega: 'Pendiente',
    entregaClass: 'revision',
    ultimaTutoria: '24 abr 2025',
  },
  {
    id: '2',
    proyecto: 'Worker YPF',
    subtitulo: 'Automatización de procesos',
    tipo: 'TFI',
    estudiantePrincipal: 'Lucas Fernández',
    estudiantesExtras: '+1',
    estado: 'En curso',
    estadoClass: 'curso',
    entrega: 'En revisión',
    entregaClass: 'documentacion',
    ultimaTutoria: '22 abr 2025',
  },
  {
    id: '3',
    proyecto: 'Proyecto Vaca Muerta',
    subtitulo: 'Análisis de datos',
    tipo: 'PPI',
    estudiantePrincipal: 'Mariana Pérez',
    estudiantesExtras: '+1',
    estado: 'Pendiente',
    estadoClass: 'revision',
    entrega: 'Sin entrega',
    entregaClass: 'sin-entrega',
    ultimaTutoria: '18 abr 2025',
  },
  {
    id: '4',
    proyecto: 'Plataforma STREAMS',
    subtitulo: 'Desarrollo de aplicación',
    tipo: 'TFI',
    estudiantePrincipal: 'Sofía Torres',
    estudiantesExtras: '+2',
    estado: 'Finalizado',
    estadoClass: 'finalizado',
    entrega: 'Aprobada',
    entregaClass: 'aprobada',
    ultimaTutoria: '15 abr 2025',
  },
];

interface TutorProjectsTableProps {
  onBackToInicio: () => void;
  onOpenRegisterTutoring: (project: { id: string | number; titulo: string }) => void;
}

export const TutorProjectsTable: React.FC<TutorProjectsTableProps> = ({
  onBackToInicio,
  onOpenRegisterTutoring,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterEntrega, setFilterEntrega] = useState<string>('todos');

  // Filtrado de proyectos
  const filteredList = useMemo(() => {
    return INITIAL_PROJECTS.filter((item) => {
      // Estado
      if (filterEstado !== 'todos' && item.estado.toLowerCase() !== filterEstado.toLowerCase()) {
        return false;
      }
      // Entrega
      if (filterEntrega !== 'todos' && item.entrega.toLowerCase() !== filterEntrega.toLowerCase()) {
        return false;
      }
      // Búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchProy = item.proyecto.toLowerCase().includes(q);
        const matchSub = item.subtitulo.toLowerCase().includes(q);
        const matchEst = item.estudiantePrincipal.toLowerCase().includes(q);
        if (!matchProy && !matchSub && !matchEst) return false;
      }
      return true;
    });
  }, [searchQuery, filterEstado, filterEntrega]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterEstado('todos');
    setFilterEntrega('todos');
  };

  return (
    <div>
      {/* Breadcrumb */}
      <button
        type="button"
        className="teacher-breadcrumb"
        onClick={onBackToInicio}
      >
        <span>← Inicio</span>
      </button>

      {/* Encabezado */}
      <h1 className="teacher-page-title">Mis proyectos</h1>
      <p className="teacher-page-subtitle">
        Seguimiento de los proyectos que tenés a cargo.
      </p>

      {/* Barra de Filtros y Búsqueda */}
      <div className="teacher-filters-bar">
        <div className="teacher-search-input-wrap">
          <svg
            className="teacher-search-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
          </svg>
          <input
            type="text"
            className="teacher-search-input"
            placeholder="Buscar proyecto o estudiante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="teacher-filter-select"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="todos">Estado: todos</option>
          <option value="en curso">Estado: En curso</option>
          <option value="pendiente">Estado: Pendiente</option>
          <option value="finalizado">Estado: Finalizado</option>
        </select>

        <select
          className="teacher-filter-select"
          value={filterEntrega}
          onChange={(e) => setFilterEntrega(e.target.value)}
        >
          <option value="todos">Entrega: todos</option>
          <option value="pendiente">Entrega: Pendiente</option>
          <option value="en revisión">Entrega: En revisión</option>
          <option value="sin entrega">Entrega: Sin entrega</option>
          <option value="aprobada">Entrega: Aprobada</option>
        </select>

        <button
          type="button"
          className="teacher-btn-clear-filters"
          onClick={handleClearFilters}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
          </svg>
          <span>Limpiar filtros</span>
        </button>
      </div>

      {/* Tabla Bootstrap */}
      <div className="teacher-table-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle teacher-bootstrap-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: '25%' }}>PROYECTO</th>
                <th scope="col" style={{ width: '10%' }}>TIPO</th>
                <th scope="col" style={{ width: '18%' }}>ESTUDIANTES</th>
                <th scope="col" style={{ width: '14%' }}>ESTADO</th>
                <th scope="col" style={{ width: '14%' }}>ENTREGA</th>
                <th scope="col" style={{ width: '14%' }}>ÚLTIMA TUTORÍA</th>
                <th scope="col" style={{ width: '15%', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row) => (
                <tr key={row.id}>
                  {/* Proyecto */}
                  <td>
                    <div className="fw-semibold text-dark">{row.proyecto}</div>
                    <div className="text-secondary small">{row.subtitulo}</div>
                  </td>

                  {/* Tipo */}
                  <td>
                    <span className={`teacher-badge-${row.tipo.toLowerCase()}`}>
                      {row.tipo}
                    </span>
                  </td>

                  {/* Estudiantes */}
                  <td>
                    <div className="fw-medium text-dark">{row.estudiantePrincipal}</div>
                    <div className="text-secondary small">{row.estudiantesExtras}</div>
                  </td>

                  {/* Estado */}
                  <td>
                    <span className={`teacher-status-pill ${row.estadoClass}`}>
                      <span className="status-dot" />
                      <span>{row.estado}</span>
                    </span>
                  </td>

                  {/* Entrega */}
                  <td>
                    <span className={`teacher-status-pill ${row.entregaClass}`}>
                      <span className="status-dot" />
                      <span>{row.entrega}</span>
                    </span>
                  </td>

                  {/* Última Tutoría */}
                  <td className="text-secondary">
                    {row.ultimaTutoria}
                  </td>

                  {/* Acciones */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="d-inline-flex align-items-center gap-2">
                      {row.estado !== 'Finalizado' ? (
                        <button
                          type="button"
                          className="btn btn-sm teacher-btn-register-tutoria"
                          onClick={() =>
                            onOpenRegisterTutoring({
                              id: row.id,
                              titulo: row.proyecto,
                            })
                          }
                        >
                          Registrar tutoría
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm teacher-btn-view-outline"
                          onClick={() => navigate(`/proyectos/${row.id}/trabajo`)}
                        >
                          Ver proyecto
                        </button>
                      )}

                      <button
                        type="button"
                        className="teacher-btn-more-actions"
                        title="Opciones"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('toast', {
                              detail: {
                                message: `Detalles del proyecto ${row.proyecto}`,
                                type: 'info',
                              },
                            })
                          );
                        }}
                      >
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer de Paginación */}
        <div className="teacher-table-pagination-footer">
          <span>Mostrando 1 - {filteredList.length} de {filteredList.length} proyectos</span>
        </div>
      </div>
    </div>
  );
};

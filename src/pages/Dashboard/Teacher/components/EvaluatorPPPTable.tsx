import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaMagnifyingGlass,
  FaArrowRotateLeft,
  FaClock,
  FaCheck,
  FaEllipsisVertical,
  FaEye,
  FaArrowUpRightFromSquare,
} from 'react-icons/fa6';
import { pppService } from '../../../../services/pppService';

export interface FormattedPPPRecord {
  id: string;
  tipo: 'Interna' | 'Externa';
  proyecto: string;
  empresa: string;
  estado: string;
  estadoClass: 'revision' | 'observaciones' | 'documentacion' | 'aprobada' | 'siu';
  tabKey: 'revision' | 'observaciones' | 'documentacion' | 'siu' | 'aprobadas' | 'otros';
  fechaCreacion: string;
  siu: 'Pendiente' | 'Cargado';
  rawRecord: any;
}

interface EvaluatorPPPTableProps {
  onBackToInicio: () => void;
}

function formatFechaCreacion(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const dateObject = new Date(dateString);
    if (isNaN(dateObject.getTime())) return dateString;
    return dateObject.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (formattingError) {
    return dateString;
  }
}

function mapTipo(typeRaw?: string): 'Interna' | 'Externa' {
  const normalized = (typeRaw || '').toLowerCase().trim();
  if (normalized === 'external' || normalized === 'externa') {
    return 'Externa';
  }
  return 'Interna';
}

function mapSiu(itemRecord: any): 'Cargado' | 'Pendiente' {
  const isLoaded = Boolean(
    itemRecord.loadedInSiu ?? itemRecord.isSiuLoaded ?? itemRecord.siuLoaded ?? itemRecord.siu
  );
  return isLoaded ? 'Cargado' : 'Pendiente';
}

interface StatusMapping {
  label: string;
  className: 'revision' | 'observaciones' | 'documentacion' | 'aprobada' | 'siu';
  tabKey: 'revision' | 'observaciones' | 'documentacion' | 'siu' | 'aprobadas' | 'otros';
}

function mapStatus(statusRaw?: string, isSiuLoaded?: boolean): StatusMapping {
  const normalized = (statusRaw || '').toLowerCase().trim();

  if (
    normalized === 'pending_siu' ||
    normalized === 'pending_siu_upload' ||
    normalized === 'pend. carga siu'
  ) {
    return { label: 'Pend. carga SIU', className: 'siu', tabKey: 'siu' };
  }

  if (
    normalized === 'approved' ||
    normalized === 'aprobada' ||
    normalized === 'aprobado'
  ) {
    if (isSiuLoaded === false) {
      return { label: 'Aprobada', className: 'aprobada', tabKey: 'aprobadas' };
    }
    return { label: 'Aprobada', className: 'aprobada', tabKey: 'aprobadas' };
  }

  if (
    normalized === 'observed' ||
    normalized === 'con observaciones' ||
    normalized === 'observado' ||
    normalized === 'observada'
  ) {
    return { label: 'Con observaciones', className: 'observaciones', tabKey: 'observaciones' };
  }

  if (
    normalized === 'pending_documentation' ||
    normalized === 'pend. documentación' ||
    normalized === 'pend. documentacion' ||
    normalized === 'documentacion_pendiente'
  ) {
    return { label: 'Pend. documentación', className: 'documentacion', tabKey: 'documentacion' };
  }

  if (
    normalized === 'in_review' ||
    normalized === 'en revisión' ||
    normalized === 'en revision' ||
    normalized === 'revision'
  ) {
    return { label: 'En revisión', className: 'revision', tabKey: 'revision' };
  }

  if (
    normalized === 'pending_application' ||
    normalized === 'postulacion' ||
    normalized === 'en evaluación' ||
    normalized === 'en evaluacion'
  ) {
    return { label: 'En evaluación', className: 'revision', tabKey: 'revision' };
  }

  if (normalized === 'disapproved' || normalized === 'desaprobada') {
    return { label: 'Desaprobada', className: 'observaciones', tabKey: 'otros' };
  }

  if (
    normalized === 'dropped_out' ||
    normalized === 'abandoned' ||
    normalized === 'baja' ||
    normalized === 'dada de baja'
  ) {
    return { label: 'Dada de baja', className: 'revision', tabKey: 'otros' };
  }

  return {
    label: statusRaw || 'En revisión',
    className: 'revision',
    tabKey: 'revision',
  };
}

function extractProjectInfo(
  itemRecord: any,
  tipo: 'Interna' | 'Externa'
): { proyecto: string; empresa: string } {
  const proposalObject =
    itemRecord.proposal ||
    itemRecord.convocatoria ||
    itemRecord.propuesta ||
    {};

  const proyecto =
    proposalObject.title ||
    proposalObject.titulo ||
    itemRecord.proposalTitle ||
    itemRecord.title ||
    itemRecord.titulo ||
    itemRecord.proyecto ||
    (tipo === 'Externa' ? 'Práctica Profesional Externa Autogestionada' : 'Convocatoria PPP');

  const empresa =
    proposalObject.company ||
    proposalObject.empresa ||
    itemRecord.company ||
    itemRecord.empresa ||
    (tipo === 'Interna' ? 'UNLa' : 'Empresa Externa');

  return { proyecto, empresa };
}

function transformBackendPPPTramites(rawList: any[]): FormattedPPPRecord[] {
  return rawList.map((itemRecord: any, itemIndex: number) => {
    const tipo = mapTipo(itemRecord.type || itemRecord.tipo);
    const projectInfo = extractProjectInfo(itemRecord, tipo);
    const siu = mapSiu(itemRecord);
    const statusMapping = mapStatus(
      itemRecord.status || itemRecord.estado,
      siu === 'Cargado'
    );
    const fechaCreacion = formatFechaCreacion(
      itemRecord.createdAt || itemRecord.fechaCreacion || itemRecord.updatedAt
    );

    return {
      id: String(itemRecord.id || itemRecord._id || itemIndex + 1),
      tipo,
      proyecto: projectInfo.proyecto,
      empresa: projectInfo.empresa,
      estado: statusMapping.label,
      estadoClass: statusMapping.className,
      tabKey: statusMapping.tabKey,
      fechaCreacion,
      siu,
      rawRecord: itemRecord,
    };
  });
}

export const EvaluatorPPPTable: React.FC<EvaluatorPPPTableProps> = ({ onBackToInicio }) => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<FormattedPPPRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  const loadPPPTramites = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const token = localStorage.getItem('token') || '';
      const responseData = await pppService.getPPPTramites(token);
      const formattedRecords = transformBackendPPPTramites(responseData);
      setRecords(formattedRecords);
    } catch (fetchError: any) {
      console.error('Error al cargar trámites PPP desde el backend:', fetchError);
      setErrorMessage(
        fetchError?.message || 'Error al conectar con el backend para obtener la lista de PPP.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPPPTramites();
  }, [loadPPPTramites]);

  // Contadores dinámicos calculados a partir de los datos reales del backend
  const tabCounts = useMemo(() => {
    let revisionCount = 0;
    let observacionesCount = 0;
    let documentacionCount = 0;
    let siuCount = 0;
    let aprobadasCount = 0;

    for (const recordItem of records) {
      if (recordItem.tabKey === 'revision') {
        revisionCount += 1;
      }
      if (recordItem.tabKey === 'observaciones') {
        observacionesCount += 1;
      }
      if (recordItem.tabKey === 'documentacion') {
        documentacionCount += 1;
      }
      if (
        recordItem.tabKey === 'siu' ||
        (recordItem.estado === 'Aprobada' && recordItem.siu === 'Pendiente')
      ) {
        siuCount += 1;
      }
      if (recordItem.tabKey === 'aprobadas') {
        aprobadasCount += 1;
      }
    }

    return {
      todos: records.length,
      revision: revisionCount,
      observaciones: observacionesCount,
      documentacion: documentacionCount,
      siu: siuCount,
      aprobadas: aprobadasCount,
    };
  }, [records]);

  // Filtrado de registros
  const filteredRecords = useMemo(() => {
    return records.filter((itemRecord) => {
      // Filtro por pestaña
      if (activeTab === 'revision' && itemRecord.tabKey !== 'revision') return false;
      if (activeTab === 'observaciones' && itemRecord.tabKey !== 'observaciones') return false;
      if (activeTab === 'documentacion' && itemRecord.tabKey !== 'documentacion') return false;
      if (
        activeTab === 'siu' &&
        itemRecord.tabKey !== 'siu' &&
        !(itemRecord.estado === 'Aprobada' && itemRecord.siu === 'Pendiente')
      ) {
        return false;
      }
      if (activeTab === 'aprobadas' && itemRecord.tabKey !== 'aprobadas') return false;

      // Filtro por Tipo select
      if (filterTipo !== 'todos' && itemRecord.tipo.toLowerCase() !== filterTipo.toLowerCase()) {
        return false;
      }

      // Filtro por Estado select
      if (filterEstado !== 'todos' && itemRecord.estado.toLowerCase() !== filterEstado.toLowerCase()) {
        return false;
      }

      // Buscador
      if (searchQuery.trim()) {
        const queryNormalized = searchQuery.toLowerCase().trim();
        const matchProyecto = itemRecord.proyecto.toLowerCase().includes(queryNormalized);
        const matchEmpresa = itemRecord.empresa.toLowerCase().includes(queryNormalized);
        const matchEstado = itemRecord.estado.toLowerCase().includes(queryNormalized);
        const matchTipo = itemRecord.tipo.toLowerCase().includes(queryNormalized);
        const matchId = String(itemRecord.id).toLowerCase().includes(queryNormalized);

        if (!matchProyecto && !matchEmpresa && !matchEstado && !matchTipo && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [records, activeTab, filterTipo, filterEstado, searchQuery]);

  // Paginación
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleClearFilters = () => {
    setActiveTab('todos');
    setSearchQuery('');
    setFilterTipo('todos');
    setFilterEstado('todos');
    setCurrentPage(1);
  };

  const handleNavigateToDetail = (recordId: string) => {
    navigate(`/ppp/${recordId}`);
  };

  return (
    <div>
      {/* Breadcrumb para regresar al Inicio */}
      <button
        type="button"
        className="teacher-breadcrumb d-inline-flex align-items-center gap-2"
        onClick={onBackToInicio}
      >
        <FaArrowLeft />
        <span>Inicio</span>
      </button>

      {/* Encabezado */}
      <h1 className="teacher-page-title">Gestión de PPP</h1>
      <p className="teacher-page-subtitle">
        Revisa, aprueba y gestiona los trámites de Prácticas Profesionales y Pasantías registrados en el sistema.
      </p>

      {/* Pestañas de Estado con contadores dinámicos */}
      <div className="teacher-filter-tabs">
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('todos');
            setCurrentPage(1);
          }}
        >
          Todos ({tabCounts.todos})
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'revision' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('revision');
            setCurrentPage(1);
          }}
        >
          En revisión ({tabCounts.revision})
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'observaciones' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('observaciones');
            setCurrentPage(1);
          }}
        >
          Con observaciones ({tabCounts.observaciones})
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'documentacion' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('documentacion');
            setCurrentPage(1);
          }}
        >
          Pend. documentación ({tabCounts.documentacion})
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'siu' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('siu');
            setCurrentPage(1);
          }}
        >
          Pend. carga SIU ({tabCounts.siu})
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'aprobadas' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('aprobadas');
            setCurrentPage(1);
          }}
        >
          Aprobadas ({tabCounts.aprobadas})
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="teacher-filters-bar">
        <div className="teacher-search-input-wrap">
          <FaMagnifyingGlass className="teacher-search-icon" />
          <input
            type="text"
            className="teacher-search-input"
            placeholder="Buscar por convocatoria, empresa, ID o estado..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="teacher-filter-select"
          value={filterTipo}
          onChange={(event) => {
            setFilterTipo(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="todos">Tipo: todos</option>
          <option value="interna">Tipo: Interna</option>
          <option value="externa">Tipo: Externa</option>
        </select>

        <select
          className="teacher-filter-select"
          value={filterEstado}
          onChange={(event) => {
            setFilterEstado(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="todos">Estado: todos</option>
          <option value="en revisión">Estado: En revisión</option>
          <option value="con observaciones">Estado: Con observaciones</option>
          <option value="pend. documentación">Estado: Pend. documentación</option>
          <option value="aprobada">Estado: Aprobada</option>
          <option value="pend. carga siu">Estado: Pend. carga SIU</option>
        </select>

        <button
          type="button"
          className="teacher-btn-clear-filters d-inline-flex align-items-center gap-1"
          onClick={handleClearFilters}
        >
          <FaArrowRotateLeft />
          <span>Limpiar filtros</span>
        </button>
      </div>

      {/* Alerta de error si falla la conexión */}
      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between my-3" role="alert">
          <div>
            <strong>Error al cargar trámites: </strong>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={loadPPPTramites}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla con Bootstrap */}
      <div className="teacher-table-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle teacher-bootstrap-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: '10%' }}>TRÁMITE</th>
                <th scope="col" style={{ width: '12%' }}>TIPO</th>
                <th scope="col" style={{ width: '34%' }}>CONVOCATORIA / PROPUESTA</th>
                <th scope="col" style={{ width: '18%' }}>ESTADO</th>
                <th scope="col" style={{ width: '14%' }}>FECHA DE CREACIÓN</th>
                <th scope="col" style={{ width: '8%' }}>SIU</th>
                <th scope="col" style={{ width: '4%', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border text-danger mb-3" role="status" />
                    <p className="text-muted mb-0">Cargando trámites de PPP desde el servidor...</p>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No se encontraron trámites de PPP registrados.
                  </td>
                </tr>
              ) : (
                paginatedList.map((rowRecord) => (
                  <tr key={rowRecord.id}>
                    {/* Trámite / ID */}
                    <td>
                      <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-semibold">
                        #{rowRecord.id}
                      </span>
                    </td>

                    {/* Tipo */}
                    <td>
                      <span className={`teacher-badge-${rowRecord.tipo.toLowerCase()}`}>
                        {rowRecord.tipo}
                      </span>
                    </td>

                    {/* Convocatoria / Propuesta / Empresa */}
                    <td>
                      <div
                        className="fw-semibold text-dark"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleNavigateToDetail(rowRecord.id)}
                        title="Ver detalle del expediente"
                      >
                        {rowRecord.proyecto}
                      </div>
                      {rowRecord.empresa && (
                        <div className="text-secondary small">{rowRecord.empresa}</div>
                      )}
                    </td>

                    {/* Estado */}
                    <td>
                      <span className={`teacher-status-pill ${rowRecord.estadoClass}`}>
                        <span className="status-dot" />
                        <span>{rowRecord.estado}</span>
                      </span>
                    </td>

                    {/* Fecha de Creación */}
                    <td className="text-secondary small">
                      {rowRecord.fechaCreacion}
                    </td>

                    {/* SIU */}
                    <td>
                      <span className={`teacher-siu-pill ${rowRecord.siu.toLowerCase()}`}>
                        {rowRecord.siu === 'Pendiente' ? (
                          <>
                            <FaClock size={12} className="me-1" />
                            <span>Pendiente</span>
                          </>
                        ) : (
                          <>
                            <FaCheck size={12} className="me-1" />
                            <span>Cargado</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'right', position: 'relative' }}>
                      <div className="d-inline-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                          title="Ver detalle del expediente"
                          style={{ fontSize: '12px', padding: '3px 8px' }}
                          onClick={() => handleNavigateToDetail(rowRecord.id)}
                        >
                          <FaEye size={12} />
                          <span>Ver</span>
                        </button>
                        <button
                          type="button"
                          className="teacher-btn-more-actions"
                          title="Más opciones"
                          onClick={() => {
                            setOpenDropdownId(openDropdownId === rowRecord.id ? null : rowRecord.id);
                          }}
                        >
                          <FaEllipsisVertical />
                        </button>
                      </div>

                      {openDropdownId === rowRecord.id && (
                        <div
                          className="position-absolute end-0 bg-white border rounded shadow-sm py-1 z-3"
                          style={{ minWidth: '160px', top: '100%', right: '10px' }}
                        >
                          <button
                            type="button"
                            className="dropdown-item px-3 py-2 small d-flex align-items-center gap-2 w-100 text-start border-0 bg-transparent"
                            onClick={() => {
                              setOpenDropdownId(null);
                              handleNavigateToDetail(rowRecord.id);
                            }}
                          >
                            <FaArrowUpRightFromSquare size={12} />
                            <span>Abrir expediente</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de Paginación */}
        <div className="teacher-table-pagination-footer">
          <span>
            Mostrando {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
            {Math.min(currentPage * pageSize, totalItems)} de {totalItems} registros
          </span>

          <div className="teacher-pagination-nav">
            <button
              type="button"
              className="teacher-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((previousPage) => Math.max(1, previousPage - 1))}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, pageIndex) => pageIndex + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`teacher-page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="teacher-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((previousPage) => Math.min(totalPages, previousPage + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

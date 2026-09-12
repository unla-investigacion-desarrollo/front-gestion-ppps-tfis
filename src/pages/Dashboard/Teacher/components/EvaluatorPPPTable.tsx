import React, { useState, useMemo } from 'react';

interface PPPRecord {
  id: string;
  avatar: string;
  avatarClass: string;
  estudiante: string;
  email: string;
  dni: string;
  tipo: 'Interna' | 'Externa';
  proyecto: string;
  empresa: string;
  estado: 'En revisión' | 'Con observaciones' | 'Pend. documentación' | 'Aprobada' | 'Pend. carga SIU';
  estadoClass: 'revision' | 'observaciones' | 'documentacion' | 'aprobada' | 'siu';
  ultimaActualizacion: string;
  siu: 'Pendiente' | 'Cargado';
}

const INITIAL_RECORDS: PPPRecord[] = [
  {
    id: '1',
    avatar: 'AG',
    avatarClass: 'ag',
    estudiante: 'Ana García',
    email: 'ana@gmail.com',
    dni: 'DNI: 37.865.432',
    tipo: 'Interna',
    proyecto: 'Desarrollo TFI y PPP',
    empresa: 'UNLa',
    estado: 'En revisión',
    estadoClass: 'revision',
    ultimaActualizacion: '24 abr 2025, 14:32',
    siu: 'Pendiente',
  },
  {
    id: '2',
    avatar: 'LV',
    avatarClass: 'lv',
    estudiante: 'Lucas Fernández',
    email: 'lucas@gmail.com',
    dni: 'DNI: 41.256.789',
    tipo: 'Externa',
    proyecto: 'Empresa TechCorp',
    empresa: 'Desarrollo Web',
    estado: 'Con observaciones',
    estadoClass: 'observaciones',
    ultimaActualizacion: '23 abr 2025, 11:20',
    siu: 'Pendiente',
  },
  {
    id: '3',
    avatar: 'MP',
    avatarClass: 'mp',
    estudiante: 'Mariana Pérez',
    email: 'maria@gmail.com',
    dni: 'DNI: 39.123.456',
    tipo: 'Interna',
    proyecto: 'Proyecto EcoApp',
    empresa: 'UNLa',
    estado: 'Pend. documentación',
    estadoClass: 'documentacion',
    ultimaActualizacion: '22 abr 2025, 16:05',
    siu: 'Pendiente',
  },
  {
    id: '4',
    avatar: 'FD',
    avatarClass: 'fd',
    estudiante: 'Facundo Diaz',
    email: 'facu@gmail.com',
    dni: 'DNI: 43.987.654',
    tipo: 'Externa',
    proyecto: 'Empresa SoftLab',
    empresa: 'Data Science',
    estado: 'Aprobada',
    estadoClass: 'aprobada',
    ultimaActualizacion: '21 abr 2025, 10:18',
    siu: 'Cargado',
  },
  {
    id: '5',
    avatar: 'CL',
    avatarClass: 'cl',
    estudiante: 'Camila López',
    email: 'camila@gmail.com',
    dni: 'DNI: 42.001.223',
    tipo: 'Interna',
    proyecto: 'Proyecto TFI',
    empresa: 'UNLa',
    estado: 'Pend. carga SIU',
    estadoClass: 'siu',
    ultimaActualizacion: '20 abr 2025, 12:45',
    siu: 'Pendiente',
  },
  {
    id: '6',
    avatar: 'MG',
    avatarClass: 'ag',
    estudiante: 'Martín Gómez',
    email: 'martin.gomez@gmail.com',
    dni: 'DNI: 38.412.900',
    tipo: 'Interna',
    proyecto: 'Plataforma STREAMS',
    empresa: 'UNLa',
    estado: 'En revisión',
    estadoClass: 'revision',
    ultimaActualizacion: '19 abr 2025, 09:15',
    siu: 'Pendiente',
  },
  {
    id: '7',
    avatar: 'SR',
    avatarClass: 'mp',
    estudiante: 'Sofía Rodríguez',
    email: 'sofia.r@gmail.com',
    dni: 'DNI: 40.112.334',
    tipo: 'Externa',
    proyecto: 'Fintech Ar',
    empresa: 'Servicios Financieros',
    estado: 'Aprobada',
    estadoClass: 'aprobada',
    ultimaActualizacion: '18 abr 2025, 14:00',
    siu: 'Cargado',
  },
  {
    id: '8',
    avatar: 'JV',
    avatarClass: 'lv',
    estudiante: 'Julián Vega',
    email: 'julian.vega@gmail.com',
    dni: 'DNI: 41.990.211',
    tipo: 'Externa',
    proyecto: 'Globant Corp',
    empresa: 'Desarrollo Cloud',
    estado: 'En revisión',
    estadoClass: 'revision',
    ultimaActualizacion: '17 abr 2025, 16:20',
    siu: 'Pendiente',
  },
  {
    id: '9',
    avatar: 'PB',
    avatarClass: 'fd',
    estudiante: 'Paula Benítez',
    email: 'paula.b@gmail.com',
    dni: 'DNI: 39.554.120',
    tipo: 'Interna',
    proyecto: 'Campus Virtual UNLa',
    empresa: 'UNLa',
    estado: 'Aprobada',
    estadoClass: 'aprobada',
    ultimaActualizacion: '16 abr 2025, 11:30',
    siu: 'Cargado',
  },
  {
    id: '10',
    avatar: 'RA',
    avatarClass: 'cl',
    estudiante: 'Rodrigo Alvarez',
    email: 'rodrigo.a@gmail.com',
    dni: 'DNI: 42.871.309',
    tipo: 'Externa',
    proyecto: 'Accenture Tech',
    empresa: 'Consultoría TI',
    estado: 'Con observaciones',
    estadoClass: 'observaciones',
    ultimaActualizacion: '15 abr 2025, 10:10',
    siu: 'Pendiente',
  },
  {
    id: '11',
    avatar: 'VT',
    avatarClass: 'mp',
    estudiante: 'Valeria Torres',
    email: 'vale.torres@gmail.com',
    dni: 'DNI: 40.890.111',
    tipo: 'Interna',
    proyecto: 'Investigación IoT',
    empresa: 'UNLa',
    estado: 'Aprobada',
    estadoClass: 'aprobada',
    ultimaActualizacion: '14 abr 2025, 17:40',
    siu: 'Cargado',
  },
  {
    id: '12',
    avatar: 'DM',
    avatarClass: 'ag',
    estudiante: 'Diego Morales',
    email: 'diego.m@gmail.com',
    dni: 'DNI: 39.771.652',
    tipo: 'Interna',
    proyecto: 'Sistema de Bibliotecas',
    empresa: 'UNLa',
    estado: 'En revisión',
    estadoClass: 'revision',
    ultimaActualizacion: '13 abr 2025, 13:00',
    siu: 'Pendiente',
  },
];

interface EvaluatorPPPTableProps {
  onBackToInicio: () => void;
}

export const EvaluatorPPPTable: React.FC<EvaluatorPPPTableProps> = ({ onBackToInicio }) => {
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Filtrado de registros
  const filteredRecords = useMemo(() => {
    return INITIAL_RECORDS.filter((item) => {
      // Filtro por pestaña
      if (activeTab === 'revision' && item.estado !== 'En revisión') return false;
      if (activeTab === 'observaciones' && item.estado !== 'Con observaciones') return false;
      if (activeTab === 'documentacion' && item.estado !== 'Pend. documentación') return false;
      if (activeTab === 'siu' && item.estado !== 'Pend. carga SIU') return false;
      if (activeTab === 'aprobadas' && item.estado !== 'Aprobada') return false;

      // Filtro por Tipo select
      if (filterTipo !== 'todos' && item.tipo.toLowerCase() !== filterTipo.toLowerCase()) return false;

      // Filtro por Estado select
      if (filterEstado !== 'todos' && item.estado.toLowerCase() !== filterEstado.toLowerCase()) return false;

      // Buscador
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEstudiante = item.estudiante.toLowerCase().includes(q);
        const matchEmail = item.email.toLowerCase().includes(q);
        const matchProyecto = item.proyecto.toLowerCase().includes(q);
        const matchEmpresa = item.empresa.toLowerCase().includes(q);
        const matchDni = item.dni.toLowerCase().includes(q);
        if (!matchEstudiante && !matchEmail && !matchProyecto && !matchEmpresa && !matchDni) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, filterTipo, filterEstado, searchQuery]);

  // Paginación
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleClearFilters = () => {
    setActiveTab('todos');
    setSearchQuery('');
    setFilterTipo('todos');
    setFilterEstado('todos');
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Breadcrumb para regresar al Inicio */}
      <button
        type="button"
        className="teacher-breadcrumb"
        onClick={onBackToInicio}
      >
        <span>← Inicio</span>
      </button>

      {/* Encabezado */}
      <h1 className="teacher-page-title">Gestión de PPP</h1>
      <p className="teacher-page-subtitle">
        Revisa, aprueba y gestiona las postulaciones a las Prácticas Profesionales y Pasantías.
      </p>

      {/* Pestañas de Estado (Mockup 2) */}
      <div className="teacher-filter-tabs">
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => { setActiveTab('todos'); setCurrentPage(1); }}
        >
          Todos (12)
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'revision' ? 'active' : ''}`}
          onClick={() => { setActiveTab('revision'); setCurrentPage(1); }}
        >
          En revisión (4)
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'observaciones' ? 'active' : ''}`}
          onClick={() => { setActiveTab('observaciones'); setCurrentPage(1); }}
        >
          Con observaciones (2)
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'documentacion' ? 'active' : ''}`}
          onClick={() => { setActiveTab('documentacion'); setCurrentPage(1); }}
        >
          Pend. documentación (1)
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'siu' ? 'active' : ''}`}
          onClick={() => { setActiveTab('siu'); setCurrentPage(1); }}
        >
          Pend. carga SIU (1)
        </button>
        <button
          type="button"
          className={`teacher-filter-tab ${activeTab === 'aprobadas' ? 'active' : ''}`}
          onClick={() => { setActiveTab('aprobadas'); setCurrentPage(1); }}
        >
          Aprobadas (4)
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
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
            placeholder="Buscar estudiante, proyecto o correo..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="teacher-filter-select"
          value={filterTipo}
          onChange={(e) => {
            setFilterTipo(e.target.value);
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
          onChange={(e) => {
            setFilterEstado(e.target.value);
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
          className="teacher-btn-clear-filters"
          onClick={handleClearFilters}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
          </svg>
          <span>Limpiar filtros</span>
        </button>
      </div>

      {/* Tabla con Bootstrap */}
      <div className="teacher-table-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle teacher-bootstrap-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: '22%' }}>ESTUDIANTE</th>
                <th scope="col" style={{ width: '10%' }}>TIPO</th>
                <th scope="col" style={{ width: '22%' }}>PROYECTO / EMPRESA</th>
                <th scope="col" style={{ width: '18%' }}>ESTADO</th>
                <th scope="col" style={{ width: '16%' }}>ÚLTIMA ACTUALIZACIÓN</th>
                <th scope="col" style={{ width: '10%' }}>SIU</th>
                <th scope="col" style={{ width: '2%', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((row) => (
                <tr key={row.id}>
                  {/* Estudiante */}
                  <td>
                    <div className="teacher-student-cell">
                      <div className={`teacher-student-avatar ${row.avatarClass}`}>
                        {row.avatar}
                      </div>
                      <div className="teacher-student-info">
                        <span className="teacher-student-name">{row.estudiante}</span>
                        <span className="teacher-student-email">{row.email}</span>
                        <span className="teacher-student-dni">{row.dni}</span>
                      </div>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td>
                    <span className={`teacher-badge-${row.tipo.toLowerCase()}`}>
                      {row.tipo}
                    </span>
                  </td>

                  {/* Proyecto / Empresa */}
                  <td>
                    <div className="fw-semibold text-dark">{row.proyecto}</div>
                    <div className="text-secondary small">{row.empresa}</div>
                  </td>

                  {/* Estado */}
                  <td>
                    <span className={`teacher-status-pill ${row.estadoClass}`}>
                      <span className="status-dot" />
                      <span>{row.estado}</span>
                    </span>
                  </td>

                  {/* Última Actualización */}
                  <td className="text-secondary">
                    {row.ultimaActualizacion}
                  </td>

                  {/* SIU */}
                  <td>
                    <span className={`teacher-siu-pill ${row.siu.toLowerCase()}`}>
                      {row.siu === 'Pendiente' ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                          </svg>
                          <span>Pendiente</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                          </svg>
                          <span>Cargado</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="teacher-btn-more-actions"
                      title="Más opciones"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('toast', {
                            detail: {
                              message: `Opciones de trámite para ${row.estudiante}`,
                              type: 'info',
                            },
                          })
                        );
                      }}
                    >
                      •••
                    </button>
                  </td>
                </tr>
              ))}
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                className={`teacher-page-btn ${currentPage === num ? 'active' : ''}`}
                onClick={() => setCurrentPage(num)}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="teacher-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

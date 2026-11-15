import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FaFileLines, FaMagnifyingGlass } from 'react-icons/fa6';
import {
  fetchPPPExpedientes,
  selectPPPExpedientes,
} from '../../../redux/slices/pppSlice';
import { fetchUsers, selectUsers } from '../../../redux/slices/usersSlice';
import {
  PPPEpidiente,
  getStudentDisplayName,
  getStudentEmail,
  normalizePPPType,
} from '../../services/pppService';
import './PPP.css';

export const PPPExpedientesList: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const expedientes = useSelector(selectPPPExpedientes) as PPPEpidiente[];
  const allUsers = useSelector(selectUsers);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'interna' | 'externa'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    dispatch(fetchPPPExpedientes());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Filtrado de expedientes
  const filteredExpedientes = useMemo(() => {
    let list = [...expedientes];

    if (filterType !== 'ALL') {
      list = list.filter((e) => normalizePPPType(e.type, e) === filterType);
    }

    if (filterStatus !== 'ALL') {
      list = list.filter((e) => e.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) => {
        const studentName = getStudentDisplayName(e, allUsers).toLowerCase();
        const studentEmail = getStudentEmail(e, allUsers).toLowerCase();
        const proposalTitle = (e.proposalTitle || '').toLowerCase();
        return (
          studentName.includes(q) ||
          studentEmail.includes(q) ||
          proposalTitle.includes(q) ||
          String(e.id).includes(q)
        );
      });
    }

    list.sort((a, b) => {
      const aAtEnd = a.isSiuLoaded || a.status === 'disapproved' ? 1 : 0;
      const bAtEnd = b.isSiuLoaded || b.status === 'disapproved' ? 1 : 0;
      return aAtEnd - bAtEnd;
    });

    return list;
  }, [expedientes, filterType, filterStatus, searchQuery, allUsers]);

  // Paginación
  const totalItems = filteredExpedientes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedExpedientes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredExpedientes.slice(startIndex, startIndex + pageSize);
  }, [filteredExpedientes, currentPage, pageSize]);

  // Helper para renderizar nombres de estado legibles
  const getStatusLabel = (statusKey: PPPStatus) => {
    switch (statusKey) {
      case 'pending_application':
        return 'Postulación en Evaluación';
      case 'application_rejected':
        return 'Postulación Desestimada';
      case 'pending_documentation':
        return 'Documentación Pendiente';
      case 'in_review':
        return 'En Revisión Académica';
      case 'observed':
        return 'Con Observaciones';
      case 'approved':
        return 'Aprobado';
      case 'disapproved':
        return 'Desaprobado';
      case 'dropped_out':
        return 'Trámite Dado de Baja';
      default:
        return statusKey;
    }
  };

  return (
    <div className="ppp-page-wrapper">
      <div className="ppp-container">
        {/* Cabecera */}
        <div className="ppp-header-card">
          <div className="ppp-header-info">
            <div className="ppp-header-icon">
              <FaFileLines size={28} />
            </div>
            <div>
              <h1 className="ppp-title">Bandeja General de Expedientes PPP</h1>
              <p className="ppp-subtitle">
                Seguimiento consolidado del ciclo de vida de prácticas profesionales internas y externas.
              </p>
            </div>
          </div>
        </div>

        {/* Filtros Consolidados */}
        <div className="ppp-filter-card">
          <div className="ppp-search-box">
            <span className="ppp-search-icon">
              <FaMagnifyingGlass size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por alumno, email o propuesta..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small fw-semibold">Tipo:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: '130px' }}
              value={filterType}
              onChange={(e: any) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Todos</option>
              <option value="interna">Interna</option>
              <option value="externa">Externa</option>
            </select>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small fw-semibold">Estado:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: '190px' }}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Todos los estados</option>
              <option value="pending_application">Postulación en Evaluación</option>
              <option value="pending_documentation">Documentación Pendiente</option>
              <option value="in_review">En Revisión Académica</option>
              <option value="observed">Con Observaciones</option>
              <option value="approved">Aprobado</option>
              <option value="disapproved">Desaprobado</option>
              <option value="application_rejected">Postulación Desestimada</option>
              <option value="dropped_out">Dado de Baja</option>
            </select>
          </div>
        </div>

        {/* Tabla de Expedientes */}
        <div className="ppp-table-card">
          {filteredExpedientes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No hay expedientes de PPP registrados que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <>
              <table className="ppp-table">
                <thead>
                  <tr>
                    <th>Expediente</th>
                    <th>Estudiante</th>
                    <th>Modalidad</th>
                    <th>Propuesta / Práctica</th>
                    <th>Estado del Trámite</th>
                    <th>SIU Guaraní</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpedientes.map((exp) => (
                    <tr key={exp.id}>
                      <td className="fw-semibold text-secondary">
                        #{exp.id}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {getStudentDisplayName(exp, allUsers)}
                        </div>
                        {getStudentEmail(exp, allUsers) ? (
                          <div className="text-muted small">
                            {getStudentEmail(exp, allUsers)}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <span className="text-secondary fw-medium">
                          {normalizePPPType(exp.type, exp) === 'interna' ? 'Interna (Catedra)' : 'Externa'}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/ppp/${exp.id}`}
                          className="project-title-link fw-semibold text-decoration-none d-inline-block"
                          style={{ maxWidth: '280px', color: 'var(--unla-primary, #64001d)' }}
                          title="Ver toda la información de la PPP"
                        >
                          {exp.proposalTitle || exp.proposal?.title || 'Práctica Profesional Supervisada'}
                        </Link>
                      </td>
                      <td>
                        <span className={`ppp-status-badge ppp-status-${exp.status}`}>
                          <span className="ppp-status-dot" />
                          {getStatusLabel(exp.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`ppp-siu-badge ${exp.isSiuLoaded ? 'loaded' : 'pending'}`}>
                          {exp.isSiuLoaded ? '✓ Asentado' : '○ Pendiente'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-unla-primary"
                          onClick={() => navigate(`/ppp/${exp.id}`)}
                        >
                          Ver expediente
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer de Paginación */}
              <div className="ppp-pagination-footer">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <span>
                    Mostrando {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
                    {Math.min(currentPage * pageSize, totalItems)} de {totalItems} registros
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">Filas por página:</span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: '72px' }}
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>

                <div className="ppp-pagination-nav">
                  <button
                    type="button"
                    className="ppp-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`ppp-page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="ppp-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PPPExpedientesList;

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FaFileLines, FaMagnifyingGlass, FaArrowRotateLeft } from 'react-icons/fa6';
import {
  fetchPPPExpedientes,
  selectPPPExpedientes,
  fetchPPPProposals,
  selectPPPProposals,
} from '../../../redux/slices/pppSlice';
import { fetchUsers, selectUsers } from '../../../redux/slices/usersSlice';
import {
  PPPEpidiente,
  getStudentDisplayName,
  getStudentEmail,
  normalizePPPType,
} from '../../services/pppService';
import './PPP.css';
import Pagination from '../../components/Pagination';
import { formatPPPStatus } from '../../utils/formatters';

export const PPPExpedientesList: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const expedientes = useSelector(selectPPPExpedientes) as PPPEpidiente[];
  const proposals = useSelector(selectPPPProposals) as any[];
  const allUsers = useSelector(selectUsers);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'interna' | 'externa'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    dispatch(fetchPPPExpedientes());
    dispatch(fetchPPPProposals());
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
              <h1 className="ppp-title">Trámites de Estudiantes (PPP)</h1>
              <p className="ppp-subtitle">
                Listado individual de trámites y postulaciones de cada <estudiante></estudiante>, con su estado de avance y carga en SIU Guaraní.
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
              <option value="pending_application">Pendiente de postulación</option>
              <option value="pending_documentation">Documentación pendiente</option>
              <option value="in_review">En revisión</option>
              <option value="observed">Observada</option>
              <option value="approved">Aprobada</option>
              <option value="disapproved">Desaprobada</option>
              <option value="application_rejected">Postulación rechazada</option>
              <option value="dropped_out">Abandonada</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              borderColor: '#e5e7eb',
              color: '#4b5563',
              backgroundColor: '#ffffff',
              fontWeight: 500,
              fontSize: '0.88rem',
            }}
            onClick={() => {
              setSearchQuery('');
              setFilterType('ALL');
              setFilterStatus('ALL');
              setCurrentPage(1);
            }}
          >
            <FaArrowRotateLeft size={13} />
            Limpiar filtros
          </button>
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
                        {(() => {
                          const titleToMatch = (exp.proposalTitle || exp.proposal?.title || '').trim().toLowerCase();
                          const matchedProposal = titleToMatch
                            ? proposals.find((p) => (p.title || '').trim().toLowerCase() === titleToMatch)
                            : undefined;
                          const proposalId = exp.proposalId || exp.proposal?.id || matchedProposal?.id;
                          const isPendingApproval = exp.status === 'pending_application';
                          const targetUrl =
                            isPendingApproval && proposalId
                              ? `/ppp/convocatorias/${proposalId}/postulaciones`
                              : `/ppp/${exp.id}`;
                          const linkTitle =
                            isPendingApproval && proposalId
                              ? 'Ver postulaciones de esta convocatoria'
                              : 'Ver toda la información de la PPP';

                          return (
                            <Link
                              to={targetUrl}
                              onClick={() => console.log('Navegando desde PPPExpedientesList:', { expId: exp.id, status: exp.status, proposalId, targetUrl, exp })}
                              className="project-title-link fw-semibold text-decoration-none d-inline-block"
                              style={{ maxWidth: '280px', color: 'var(--unla-primary, #64001d)' }}
                              title={linkTitle}
                            >
                              {exp.proposalTitle || exp.proposal?.title || 'Práctica Profesional Supervisada'}
                            </Link>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`ppp-status-badge ppp-status-${exp.status}`}>
                          <span className="ppp-status-dot" />
                          {formatPPPStatus(exp.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`ppp-siu-badge ${exp.isSiuLoaded ? 'loaded' : 'pending'}`}>
                          {exp.isSiuLoaded ? '✓ Asentado' : '○ Pendiente'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {exp.status === 'pending_application' ? (
                          <span className="badge bg-light text-secondary border fw-normal px-2 py-1">
                            Pendiente de aprobación
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-unla-primary"
                            onClick={() => navigate(`/ppp/${exp.id}`)}
                          >
                            Ver expediente
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación consolidada */}
              <Pagination
                variant="ppp"
                itemLabel="registros"
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                pageSizeOptions={[5, 10, 20]}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PPPExpedientesList;

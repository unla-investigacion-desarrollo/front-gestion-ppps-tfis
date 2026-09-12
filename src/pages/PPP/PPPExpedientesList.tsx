import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchPPPExpedientes,
  selectPPPExpedientes,
  selectPPPStatus,
} from '../../../redux/slices/pppSlice';
import { fetchUsers, selectUsers } from '../../../redux/slices/usersSlice';
import {
  PPPEpidiente,
  PPPStatus,
  getStudentDisplayName,
  getStudentEmail,
} from '../../services/pppService';
import './PPP.css';

export const PPPExpedientesList: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const expedientes = useSelector(selectPPPExpedientes) as PPPEpidiente[];
  const allUsers = useSelector(selectUsers);
  const status = useSelector(selectPPPStatus);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'interna' | 'externa'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    dispatch(fetchPPPExpedientes());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Filtrado de expedientes
  const filteredExpedientes = useMemo(() => {
    let list = [...expedientes];

    if (filterType !== 'ALL') {
      list = list.filter((e) => e.type === filterType);
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

    return list;
  }, [expedientes, filterType, filterStatus, searchQuery, allUsers]);

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
        return 'Práctica Aprobada';
      case 'disapproved':
        return 'Práctica No Aprobada';
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
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                <path d="M4.5 9a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
              </svg>
            </div>
            <div>
              <h1 className="ppp-title">Bandeja General de Expedientes PPP</h1>
              <p className="ppp-subtitle">
                Seguimiento consolidado del ciclo de vida de prácticas profesionales internas y externas.
              </p>
            </div>
          </div>
          <div className="ppp-header-actions">
            <Link to="/ppp/convocatorias" className="btn-unla-outline">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
              </svg>
              Ver convocatorias
            </Link>
          </div>
        </div>

        {/* Filtros Consolidados */}
        <div className="ppp-filter-card">
          <div className="ppp-search-box">
            <span className="ppp-search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por alumno, email o propuesta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small fw-semibold">Tipo:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: '130px' }}
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
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
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Todos los estados</option>
              <option value="pending_application">Postulación en Evaluación</option>
              <option value="pending_documentation">Documentación Pendiente</option>
              <option value="in_review">En Revisión Académica</option>
              <option value="observed">Con Observaciones</option>
              <option value="approved">Práctica Aprobada</option>
              <option value="disapproved">Práctica No Aprobada</option>
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
                {filteredExpedientes.map((exp) => (
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
                      <span
                        className={`badge ${
                          exp.type === 'interna' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'
                        } px-2.5 py-1 rounded`}
                      >
                        {exp.type === 'interna' ? 'Interna (Cátedra)' : 'Externa'}
                      </span>
                    </td>
                    <td>
                      <div className="text-dark fw-medium" style={{ maxWidth: '280px' }}>
                        {exp.proposalTitle || 'Práctica Profesional Supervisada'}
                      </div>
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
                        Ver expediente →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PPPExpedientesList;

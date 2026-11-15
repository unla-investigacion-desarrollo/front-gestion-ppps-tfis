import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaFileLines,
  FaUsers,
  FaTableCellsLarge,
  FaArrowTrendUp,
  FaFolder,
  FaBullhorn,
} from 'react-icons/fa6';
import { pppService } from '../../../../services/pppService';

interface EvaluatorDashboardProps {
  userName: string;
  onGoToPPP: () => void;
  onViewActivity: (act: { fecha: string; tipo: string; detalle: string; estudiante?: string }) => void;
}

export const EvaluatorDashboard: React.FC<EvaluatorDashboardProps> = ({
  userName,
  onGoToPPP,
  onViewActivity,
}) => {
  const navigate = useNavigate();

  const [pppCounts, setPppCounts] = useState<{
    totalActivas: number;
    totalPendientes: number;
    enRevision: number;
    conObservaciones: number;
    pendDocumentacion: number;
    pendSiu: number;
    loaded: boolean;
  }>({
    totalActivas: 12,
    totalPendientes: 0,
    enRevision: 0,
    conObservaciones: 0,
    pendDocumentacion: 0,
    pendSiu: 0,
    loaded: false,
  });

  const [proposalsSummary, setProposalsSummary] = useState<{
    open: number;
    total: number;
    loaded: boolean;
  }>({
    open: 3,
    total: 0,
    loaded: false,
  });

  useEffect(() => {
    const loadCounts = async () => {
      const token = localStorage.getItem('token') || '';
      try {
        const tramites = await pppService.getPPPTramites(token);
        let revisionCount = 0;
        let observacionesCount = 0;
        let documentacionCount = 0;
        let siuCount = 0;
        let activasCount = 0;

        for (const itemRecord of tramites) {
          const status = (itemRecord.status || itemRecord.estado || '').toLowerCase().trim();
          const isSiuLoaded = Boolean(
            itemRecord.loadedInSiu ?? itemRecord.isSiuLoaded ?? itemRecord.siuLoaded ?? itemRecord.siu
          );

          if (
            status !== 'dropped_out' &&
            status !== 'abandoned' &&
            status !== 'application_rejected' &&
            status !== 'disapproved' &&
            status !== 'desaprobada'
          ) {
            activasCount += 1;
          }

          if (
            status === 'in_review' ||
            status === 'en revisión' ||
            status === 'en revision' ||
            status === 'pending_application'
          ) {
            revisionCount += 1;
          } else if (status === 'observed' || status === 'con observaciones') {
            observacionesCount += 1;
          } else if (
            status === 'pending_documentation' ||
            status === 'pend. documentación' ||
            status === 'documentacion_pendiente'
          ) {
            documentacionCount += 1;
          } else if (
            status === 'pending_siu' ||
            status === 'pending_siu_upload' ||
            (!isSiuLoaded && (status === 'approved' || status === 'aprobada'))
          ) {
            siuCount += 1;
          }
        }

        setPppCounts({
          totalActivas: tramites.length > 0 ? activasCount : 0,
          totalPendientes: revisionCount + observacionesCount + documentacionCount + siuCount,
          enRevision: revisionCount,
          conObservaciones: observacionesCount,
          pendDocumentacion: documentacionCount,
          pendSiu: siuCount,
          loaded: true,
        });
      } catch (loadError) {
        // Silenciosamente conservar conteos por defecto si no hay conexión
      }

      try {
        const proposals = await pppService.getProposals(token, false);
        const openCount = proposals.filter((p) => p.isOpen).length;
        setProposalsSummary({
          open: openCount,
          total: proposals.length,
          loaded: true,
        });
      } catch {}
    };
    loadCounts();
  }, []);

  const solicitudesItems = [
    { label: 'Esperando aprobación', count: 2 },
    { label: 'Tutores que solicitan incorporarse', count: 1 },
    { label: 'Pendientes de completar integrantes', count: 1 },
  ];
  const totalSolicitudesPendientes = solicitudesItems.reduce((acc, item) => acc + item.count, 0);

  return (
    <div>
      {/* Saludo Principal */}
      <h1 className="teacher-page-title">
        Bienvenido, {userName}
      </h1>
      <p className="teacher-page-subtitle">
        Gestioná los procesos de evaluación de Prácticas Profesionales y Proyectos.
      </p>

      {/* Fila de 2 Tarjetas Superiores con Desglose */}
      <div className="row g-3 mb-4">
        {/* Tarjeta 1: PPP pendientes de revisión */}
        <div className="col-lg-6 col-md-6">
          <div className="teacher-card teacher-breakdown-card">
            <div className="teacher-breakdown-header">
              <div className="teacher-breakdown-title-wrap">
                <div className="teacher-card-icon-box red">
                  <FaFileLines size={18} />
                </div>
                <h3 className="teacher-breakdown-title">PPP pendientes de revisión</h3>
              </div>
              <span className="teacher-counter-badge" title="Total pendientes">
                {pppCounts.totalPendientes}
              </span>
            </div>

            <ul className="teacher-breakdown-list">
              <li
                className="teacher-breakdown-item"
                role="button"
                tabIndex={0}
                onClick={onGoToPPP}
                onKeyDown={(e) => e.key === 'Enter' && onGoToPPP()}
              >
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-subtle" />
                  <span>En revisión</span>
                </div>
                <span className="teacher-breakdown-count">{pppCounts.enRevision}</span>
              </li>
              <li
                className="teacher-breakdown-item"
                role="button"
                tabIndex={0}
                onClick={onGoToPPP}
                onKeyDown={(e) => e.key === 'Enter' && onGoToPPP()}
              >
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-subtle" />
                  <span>Con observaciones</span>
                </div>
                <span className="teacher-breakdown-count">{pppCounts.conObservaciones}</span>
              </li>
              <li
                className="teacher-breakdown-item"
                role="button"
                tabIndex={0}
                onClick={onGoToPPP}
                onKeyDown={(e) => e.key === 'Enter' && onGoToPPP()}
              >
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-subtle" />
                  <span>Pend. de documentación</span>
                </div>
                <span className="teacher-breakdown-count">{pppCounts.pendDocumentacion}</span>
              </li>
              <li
                className="teacher-breakdown-item"
                role="button"
                tabIndex={0}
                onClick={onGoToPPP}
                onKeyDown={(e) => e.key === 'Enter' && onGoToPPP()}
              >
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-subtle" />
                  <span>Pend. de carga en SIU</span>
                </div>
                <span className="teacher-breakdown-count">{pppCounts.pendSiu}</span>
              </li>
            </ul>

            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={onGoToPPP}
            >
              Ver todas →
            </button>
          </div>
        </div>

        {/* Tarjeta 2: Solicitudes de proyectos */}
        <div className="col-lg-6 col-md-6">
          <div className="teacher-card teacher-breakdown-card">
            <div className="teacher-breakdown-header">
              <div className="teacher-breakdown-title-wrap">
                <div className="teacher-card-icon-box green">
                  <FaUsers size={18} />
                </div>
                <h3 className="teacher-breakdown-title">Solicitudes de proyectos</h3>
              </div>
              <span className="teacher-counter-badge" title="Total pendientes">
                {totalSolicitudesPendientes}
              </span>
            </div>

            <ul className="teacher-breakdown-list">
              {solicitudesItems.map((item) => (
                <li
                  key={item.label}
                  className="teacher-breakdown-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/admin/approvals')}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/approvals')}
                >
                  <div className="teacher-breakdown-item-left">
                    <span className="teacher-dot-subtle" />
                    <span>{item.label}</span>
                  </div>
                  <span className="teacher-breakdown-count">{item.count}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={() => navigate('/admin/approvals')}
            >
              Ver todas →
            </button>
          </div>
        </div>
      </div>

      {/* Sección Resumen General */}
      <div className="teacher-general-summary-card">
        <div className="teacher-section-header">
          <h2 className="teacher-section-title">Resumen general</h2>
        </div>

        <div className="teacher-metrics-grid">
          <div className="teacher-submetric-card">
            <div className="teacher-submetric-icon">
              <FaArrowTrendUp size={17} />
            </div>
            <div className="teacher-submetric-num">{pppCounts.totalActivas}</div>
            <div className="teacher-submetric-label">PPP activas</div>
            {pppCounts.loaded && (
              <div className="teacher-submetric-context">
                {pppCounts.enRevision} en revisión · {pppCounts.conObservaciones} con observaciones
              </div>
            )}
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-icon">
              <FaFolder size={17} />
            </div>
            <div className="teacher-submetric-num">8</div>
            <div className="teacher-submetric-label">Proyectos en curso</div>
            <div className="teacher-submetric-context">
              {totalSolicitudesPendientes} solicitudes pendientes de revisión
            </div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-icon">
              <FaBullhorn size={17} />
            </div>
            <div className="teacher-submetric-num">{proposalsSummary.open}</div>
            <div className="teacher-submetric-label">Convocatorias abiertas</div>
            {proposalsSummary.loaded && proposalsSummary.total > 0 && (
              <div className="teacher-submetric-context">
                de {proposalsSummary.total} convocatorias en el catálogo
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluatorDashboard;

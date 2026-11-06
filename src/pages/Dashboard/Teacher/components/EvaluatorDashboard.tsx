import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaFileLines,
  FaClock,
  FaUsers,
  FaTableCellsLarge,
  FaArrowTrendUp,
  FaFolder,
  FaCheck,
  FaXmark,
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
    totalPendientes: number;
    enRevision: number;
    conObservaciones: number;
    pendDocumentacion: number;
    pendSiu: number;
  }>({
    totalPendientes: 0,
    enRevision: 0,
    conObservaciones: 0,
    pendDocumentacion: 0,
    pendSiu: 0,
  });

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const tramites = await pppService.getPPPTramites(token);
        let revisionCount = 0;
        let observacionesCount = 0;
        let documentacionCount = 0;
        let siuCount = 0;

        for (const itemRecord of tramites) {
          const status = (itemRecord.status || itemRecord.estado || '').toLowerCase().trim();
          const isSiuLoaded = Boolean(
            itemRecord.loadedInSiu ?? itemRecord.isSiuLoaded ?? itemRecord.siuLoaded ?? itemRecord.siu
          );

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
          totalPendientes: revisionCount + observacionesCount + documentacionCount + siuCount,
          enRevision: revisionCount,
          conObservaciones: observacionesCount,
          pendDocumentacion: documentacionCount,
          pendSiu: siuCount,
        });
      } catch (loadError) {
        // Silenciosamente conservar conteos por defecto si no hay conexión
      }
    };
    loadCounts();
  }, []);

  return (
    <div>

      {/* Saludo Principal */}
      <h1 className="teacher-page-title">
        Bienvenido, {userName} 👋
      </h1>
      <p className="teacher-page-subtitle">
        Gestioná los procesos de evaluación de Prácticas Profesionales y Proyectos.
      </p>

      {/* Fila de 3 Tarjetas Superiores con Desglose */}
      <div className="row g-3 mb-4">
        {/* Tarjeta 1: PPP pendientes de revisión */}
        <div className="col-lg-4 col-md-6">
          <div className="teacher-card teacher-breakdown-card">
            <div className="teacher-breakdown-header">
              <div className="teacher-breakdown-title-wrap">
                <div className="teacher-card-icon-box red">
                  <FaFileLines size={18} />
                </div>
                <h3 className="teacher-breakdown-title">PPP pendientes de revisión</h3>
              </div>
              <span className="teacher-counter-badge">{pppCounts.totalPendientes}</span>
            </div>

            <ul className="teacher-breakdown-list">
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>En revisión</span>
                </div>
                <span className="teacher-breakdown-count">{pppCounts.enRevision}</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Con observaciones</span>
                </div>
                <span className="teacher-breakdown-count">{pppCounts.conObservaciones}</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Pend. de documentación</span>
                </div>
                <span className="teacher-breakdown-count">{pppCounts.pendDocumentacion}</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
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

        {/* Tarjeta 2: Entregas pendientes */}
        <div className="col-lg-4 col-md-6">
          <div className="teacher-card teacher-breakdown-card">
            <div className="teacher-breakdown-header">
              <div className="teacher-breakdown-title-wrap">
                <div className="teacher-card-icon-box amber">
                  <FaClock size={18} />
                </div>
                <h3 className="teacher-breakdown-title">Entregas pendientes</h3>
              </div>
              <span className="teacher-counter-badge">7</span>
            </div>

            <ul className="teacher-breakdown-list">
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Para revisar</span>
                </div>
                <span className="teacher-breakdown-count">3</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Observadas</span>
                </div>
                <span className="teacher-breakdown-count">2</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Sin calificar</span>
                </div>
                <span className="teacher-breakdown-count">2</span>
              </li>
            </ul>

            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={() => navigate('/docente/entregas')}
            >
              Ver todas →
            </button>
          </div>
        </div>

        {/* Tarjeta 3: Solicitudes de proyectos */}
        <div className="col-lg-4 col-md-6">
          <div className="teacher-card teacher-breakdown-card">
            <div className="teacher-breakdown-header">
              <div className="teacher-breakdown-title-wrap">
                <div className="teacher-card-icon-box green">
                  <FaUsers size={18} />
                </div>
                <h3 className="teacher-breakdown-title">Solicitudes de proyectos</h3>
              </div>
              <span className="teacher-counter-badge">4</span>
            </div>

            <ul className="teacher-breakdown-list">
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Esperando aprobación</span>
                </div>
                <span className="teacher-breakdown-count">2</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Tutores que solicitan incorporarse</span>
                </div>
                <span className="teacher-breakdown-count">1</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Pendientes de completar integrantes</span>
                </div>
                <span className="teacher-breakdown-count">1</span>
              </li>
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
          <FaTableCellsLarge size={17} color="var(--unla-wine)" />
          <h2 className="teacher-section-title">Resumen general</h2>
        </div>

        <div className="teacher-metrics-5grid">
          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <FaArrowTrendUp size={13} />
              <span>PPP activas</span>
            </div>
            <div className="teacher-submetric-num">12</div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <FaFolder size={13} />
              <span>Proyectos en curso</span>
            </div>
            <div className="teacher-submetric-num">8</div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <FaCheck size={13} />
              <span>Entregas aprobadas</span>
            </div>
            <div className="teacher-submetric-num">23</div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <FaXmark size={13} />
              <span>Entregas desaprobadas</span>
            </div>
            <div className="teacher-submetric-num">4</div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <FaBullhorn size={13} />
              <span>Convocatorias abiertas</span>
            </div>
            <div className="teacher-submetric-num">3</div>
          </div>
        </div>
      </div>

      {/* Sección Próximas Actividades */}
      <div className="teacher-table-card">
        <div className="teacher-table-header-row">
          <h2 className="teacher-table-title">Próximas actividades</h2>
          <button
            type="button"
            className="teacher-table-link bg-transparent border-0 p-0"
            onClick={onGoToPPP}
          >
            Ver todas
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle teacher-bootstrap-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: '18%' }}>FECHA</th>
                <th scope="col" style={{ width: '12%' }}>TIPO</th>
                <th scope="col" style={{ width: '55%' }}>DETALLE</th>
                <th scope="col" style={{ width: '15%', textAlign: 'right' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-secondary fw-medium">Hoy, 10:00</td>
                <td>
                  <span className="teacher-badge-interna" style={{ color: '#b91c1c', backgroundColor: '#fee2e2', borderColor: '#fecaca' }}>
                    PPP
                  </span>
                </td>
                <td className="fw-semibold text-dark">
                  Revisión de documentación - Ana García
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-sm teacher-btn-view-outline"
                    onClick={() =>
                      onViewActivity({
                        fecha: 'Hoy, 10:00',
                        tipo: 'PPP',
                        detalle: 'Revisión de documentación - Ana García',
                        estudiante: 'Ana García (DNI 37.865.432)',
                      })
                    }
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
              <tr>
                <td className="text-secondary fw-medium">Hoy, 14:30</td>
                <td>
                  <span className="teacher-badge-interna" style={{ color: '#b45309', backgroundColor: '#fef3c7', borderColor: '#fde68a' }}>
                    Entrega
                  </span>
                </td>
                <td className="fw-semibold text-dark">
                  Entrega final - Proyecto EcoApp
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-sm teacher-btn-view-outline"
                    onClick={() =>
                      onViewActivity({
                        fecha: 'Hoy, 14:30',
                        tipo: 'Entrega',
                        detalle: 'Entrega final - Proyecto EcoApp',
                        estudiante: 'Mariana Pérez y equipo',
                      })
                    }
                  >
                    Revisar
                  </button>
                </td>
              </tr>
              <tr>
                <td className="text-secondary fw-medium">Mañana, 09:00</td>
                <td>
                  <span className="teacher-badge-interna" style={{ color: '#be123c', backgroundColor: '#ffe4e6', borderColor: '#fecdd3' }}>
                    Proyecto
                  </span>
                </td>
                <td className="fw-semibold text-dark">
                  Solicitud de incorporación - Proyecto Alfa
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-sm teacher-btn-view-outline"
                    onClick={() =>
                      onViewActivity({
                        fecha: 'Mañana, 09:00',
                        tipo: 'Proyecto',
                        detalle: 'Solicitud de incorporación - Proyecto Alfa',
                        estudiante: 'Lucas Fernández',
                      })
                    }
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EvaluatorDashboard;

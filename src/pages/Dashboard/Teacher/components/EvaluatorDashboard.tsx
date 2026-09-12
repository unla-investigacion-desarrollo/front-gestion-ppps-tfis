import React from 'react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div>
      {/* Breadcrumb */}
      <div className="teacher-breadcrumb">
        <span>← Inicio</span>
      </div>

      {/* Saludo Principal */}
      <h1 className="teacher-page-title">
        Hola, {userName} 👋
      </h1>
      <p className="teacher-page-subtitle">
        Aquí encontrarás un resumen de tus tareas y accesos rápidos.
      </p>

      {/* Fila de 3 Tarjetas Superiores con Desglose */}
      <div className="row g-3 mb-4">
        {/* Tarjeta 1: PPP pendientes de revisión */}
        <div className="col-lg-4 col-md-6">
          <div className="teacher-card teacher-breakdown-card">
            <div className="teacher-breakdown-header">
              <div className="teacher-breakdown-title-wrap">
                <div className="teacher-card-icon-box red">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                    <path d="M4.5 9a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
                  </svg>
                </div>
                <h3 className="teacher-breakdown-title">PPP pendientes de revisión</h3>
              </div>
              <span className="teacher-counter-badge">5</span>
            </div>

            <ul className="teacher-breakdown-list">
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>En revisión</span>
                </div>
                <span className="teacher-breakdown-count">2</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Con observaciones</span>
                </div>
                <span className="teacher-breakdown-count">1</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Pend. de documentación</span>
                </div>
                <span className="teacher-breakdown-count">1</span>
              </li>
              <li className="teacher-breakdown-item">
                <div className="teacher-breakdown-item-left">
                  <span className="teacher-dot-amber" />
                  <span>Pend. de carga en SIU</span>
                </div>
                <span className="teacher-breakdown-count">1</span>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                  </svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="var(--unla-wine)" viewBox="0 0 16 16">
            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
          </svg>
          <h2 className="teacher-section-title">Resumen general</h2>
        </div>

        <div className="teacher-metrics-5grid">
          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"/>
              </svg>
              <span>PPP activas</span>
            </div>
            <div className="teacher-submetric-num">12</div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
              </svg>
              <span>Proyectos en curso</span>
            </div>
            <div className="teacher-submetric-num">8</div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
              </svg>
              <span>Entregas aprobadas</span>
            </div>
            <div className="teacher-submetric-num">23</div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
              <span>Entregas desaprobadas</span>
            </div>
            <div className="teacher-submetric-num">4</div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
              </svg>
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

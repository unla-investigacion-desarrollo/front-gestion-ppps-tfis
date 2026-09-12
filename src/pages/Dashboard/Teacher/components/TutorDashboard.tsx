import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TutorDashboardProps {
  userName: string;
  onGoToProjects: () => void;
  onViewActivity: (act: { fecha: string; tipo: string; detalle: string; estudiante?: string }) => void;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  userName,
  onGoToProjects,
  onViewActivity,
}) => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="teacher-breadcrumb">
        <span>← Inicio</span>
      </div>

      {/* Saludo */}
      <h1 className="teacher-page-title">
        Hola, {userName} 👋
      </h1>
      <p className="teacher-page-subtitle">
        Aquí tenés un resumen de tus proyectos y solicitudes pendientes.
      </p>

      {/* 4 Tarjetas de Métricas Principales */}
      <div className="row g-3 mb-4">
        {/* Card 1: Mis proyectos activos */}
        <div className="col-lg-3 col-md-6">
          <div className="teacher-card teacher-metric-large-card">
            <div className="teacher-metric-header">
              <div className="teacher-card-icon-box blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                  <path d="M4.5 9a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
                </svg>
              </div>
              <h3 className="teacher-metric-title">Mis proyectos activos</h3>
            </div>
            <div className="teacher-metric-value">3</div>
            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={onGoToProjects}
            >
              Ver proyectos →
            </button>
          </div>
        </div>

        {/* Card 2: Solicitudes de incorporación */}
        <div className="col-lg-3 col-md-6">
          <div className="teacher-card teacher-metric-large-card">
            <div className="teacher-metric-header">
              <div className="teacher-card-icon-box cyan">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                </svg>
              </div>
              <h3 className="teacher-metric-title">Solicitudes de incorporación</h3>
            </div>
            <div className="teacher-metric-value">2</div>
            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={() => navigate('/admin/approvals')}
            >
              Ver solicitudes →
            </button>
          </div>
        </div>

        {/* Card 3: Solicitudes de tutoría */}
        <div className="col-lg-3 col-md-6">
          <div className="teacher-card teacher-metric-large-card">
            <div className="teacher-metric-header">
              <div className="teacher-card-icon-box purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                </svg>
              </div>
              <h3 className="teacher-metric-title">Solicitudes de tutoría</h3>
            </div>
            <div className="teacher-metric-value">4</div>
            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={onGoToProjects}
            >
              Ver pendientes →
            </button>
          </div>
        </div>

        {/* Card 4: Proyectos sin entrega */}
        <div className="col-lg-3 col-md-6">
          <div className="teacher-card teacher-metric-large-card">
            <div className="teacher-metric-header">
              <div className="teacher-card-icon-box red">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z" />
                  <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z" />
                </svg>
              </div>
              <h3 className="teacher-metric-title">Proyectos sin entrega</h3>
            </div>
            <div className="teacher-metric-value">1</div>
            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={onGoToProjects}
            >
              Ver proyectos →
            </button>
          </div>
        </div>
      </div>

      {/* Fila Inferior Dividida */}
      <div className="row g-4">
        {/* Columna Izquierda: Tabla Últimas tutorías registradas */}
        <div className="col-lg-8">
          <div className="teacher-table-card">
            <div className="teacher-table-header-row">
              <h2 className="teacher-table-title">Últimas tutorías registradas</h2>
              <button
                type="button"
                className="teacher-table-link bg-transparent border-0 p-0"
                onClick={onGoToProjects}
              >
                Ver todas
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle teacher-bootstrap-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '35%' }}>Proyecto</th>
                    <th scope="col" style={{ width: '25%' }}>Estudiante</th>
                    <th scope="col" style={{ width: '25%' }}>Fecha</th>
                    <th scope="col" style={{ width: '15%', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-semibold text-dark">Desarrollo TFI y PPP</td>
                    <td className="text-secondary">Ana García</td>
                    <td className="text-secondary">24 abr 2025, 16:30</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm teacher-btn-view-outline"
                        onClick={() =>
                          onViewActivity({
                            fecha: '24 abr 2025, 16:30',
                            tipo: 'Tutoría',
                            detalle: 'Sesión de tutoría - Desarrollo TFI y PPP',
                            estudiante: 'Ana García',
                          })
                        }
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-semibold text-dark">Worker YPF</td>
                    <td className="text-secondary">Lucas Fernández</td>
                    <td className="text-secondary">22 abr 2025, 11:20</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm teacher-btn-view-outline"
                        onClick={() =>
                          onViewActivity({
                            fecha: '22 abr 2025, 11:20',
                            tipo: 'Tutoría',
                            detalle: 'Sesión de tutoría - Worker YPF',
                            estudiante: 'Lucas Fernández',
                          })
                        }
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-semibold text-dark">Proyecto Vaca Muerta</td>
                    <td className="text-secondary">Mariana Pérez</td>
                    <td className="text-secondary">18 abr 2025, 09:15</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm teacher-btn-view-outline"
                        onClick={() =>
                          onViewActivity({
                            fecha: '18 abr 2025, 09:15',
                            tipo: 'Tutoría',
                            detalle: 'Sesión de tutoría - Proyecto Vaca Muerta',
                            estudiante: 'Mariana Pérez',
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

        {/* Columna Derecha: Tarjeta Motivacional con Birrete */}
        <div className="col-lg-4">
          <div className="teacher-tutor-banner-card">
            <svg
              className="teacher-tutor-banner-icon"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917l-7.5-3.5ZM8 8.46 1.758 5.965 8 3.052l6.242 2.913L8 8.46Z" />
              <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.566 4.176 9.032Z" />
            </svg>
            <h3 className="teacher-tutor-banner-title">
              Tu acompañamiento hace la diferencia
            </h3>
            <p className="teacher-tutor-banner-text">
              Las tutorías ayudan a que los estudiantes puedan avanzar, resolver dudas y fortalecer sus proyectos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

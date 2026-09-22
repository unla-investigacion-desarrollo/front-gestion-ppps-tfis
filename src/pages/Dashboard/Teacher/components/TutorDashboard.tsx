import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaFileLines,
  FaPlus,
  FaChalkboardUser,
  FaTriangleExclamation,
  FaGraduationCap,
} from 'react-icons/fa6';

interface TutorDashboardProps {
  userName: string;
  onGoToProjects: () => void;
  onViewActivity: (act: { fecha: string; tipo: string; detalle: string; estudiante?: string }) => void;
  onGoToApprovals?: () => void;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  userName,
  onGoToProjects,
  onViewActivity,
  onGoToApprovals,
}) => {
  const navigate = useNavigate();

  return (
    <div>
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
                <FaFileLines size={18} />
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
                <FaPlus size={18} />
              </div>
              <h3 className="teacher-metric-title">Solicitudes de incorporación</h3>
            </div>
            <div className="teacher-metric-value">2</div>
            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={onGoToApprovals || (() => navigate('/admin/approvals'))}
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
                <FaChalkboardUser size={18} />
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
                <FaTriangleExclamation size={18} />
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
            <FaGraduationCap className="teacher-tutor-banner-icon" />
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

export default TutorDashboard;

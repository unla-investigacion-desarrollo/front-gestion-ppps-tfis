import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaFolderOpen,
  FaClock,
} from 'react-icons/fa6';
import { projectService } from '../../../services/projectService';
import TutorProjectStatusPill from '../../Dashboard/Teacher/components/TutorProjectStatusPill';
import type { TutorProjectRecord } from '../../Dashboard/Teacher/components/TutorProjectsTable';
import './MyTfiCard.css';

export interface MyTfiCardProps {
  /** TFI del estudiante (compatibilidad con ficha única). */
  record?: TutorProjectRecord | null;
  /** Listado completo de TFIs del estudiante (activos y finalizados). */
  records?: TutorProjectRecord[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/**
 * Vista "Mi TFI" del estudiante: muestra las fichas de sus Trabajos Finales Integradores.
 */
export const MyTfiCard: React.FC<MyTfiCardProps> = ({ record = null, records, loading, error, onRetry }) => {
  const navigate = useNavigate();
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  const items = records && records.length > 0 ? records : record ? [record] : [];

  // Sin TFI asignado: consultar si hay solicitudes en revisión para orientar al estudiante
  useEffect(() => {
    if (loading || items.length > 0) return;
    const token = localStorage.getItem('token') || '';
    if (!token) return;
    projectService
      .getMyRequests(token)
      .then((requests: any) => setPendingRequestsCount(Array.isArray(requests) ? requests.length : 0))
      .catch(() => setPendingRequestsCount(0));
  }, [loading, items.length]);

  const goToProject = (projectId: string) =>
    navigate(`/proyectos/${projectId}/trabajo?from=mis-proyectos`, { state: { from: 'mis-proyectos' } });

  return (
    <div className="projects-card-main my-tfi-container">
      <div className="mb-4">
        <h1 className="projects-title m-0">Mi TFI</h1>
        <p className="projects-subtitle text-muted m-0">
          Seguimiento de tu Trabajo Final Integrador y estado de entregas.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <div className="text-secondary small mt-2">Cargando tu TFI...</div>
        </div>
      ) : error ? (
        <div className="alert alert-warning text-start" style={{ maxWidth: '600px' }}>
          <div className="fw-bold mb-1">No se pudo cargar tu TFI</div>
          <div className="small text-muted mb-2">{error}</div>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="my-tfi-empty">
          {pendingRequestsCount > 0 ? (
            <>
              <FaClock size={38} className="my-tfi-empty-icon" />
              <h3>Todavía no tenés un TFI asignado</h3>
              <p>
                Tenés {pendingRequestsCount}{' '}
                {pendingRequestsCount === 1 ? 'solicitud en revisión' : 'solicitudes en revisión'}.
                Cuando sea aprobada, vas a ver tu TFI acá.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/alumno/mis-proyectos?tab=requests')}
              >
                Ver mis solicitudes
              </button>
            </>
          ) : (
            <>
              <FaFolderOpen size={38} className="my-tfi-empty-icon" />
              <h3>Todavía no tenés un TFI asignado</h3>
              <p>Explorá los proyectos disponibles y postulate al que te interese.</p>
            </>
          )}
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {items.map((item) => {
            const workStatus = String(item.rawProject?.studentWork?.status || '').toLowerCase().trim();
            let deliveryLabel = 'Entrega pendiente';
            let deliveryBadge = 'Pendiente';
            let deliveryBadgeClass = 'pending';
            let progressPct = 25;
            let nextStepText = 'El siguiente paso es registrar la primera entrega.';

            if (workStatus === 'pending_review') {
              deliveryLabel = 'Entrega enviada';
              deliveryBadge = 'Pendiente de revisión';
              deliveryBadgeClass = 'review';
              progressPct = 60;
              nextStepText = 'Tu documento fue enviado y está aguardando revisión.';
            } else if (workStatus === 'observed') {
              deliveryLabel = 'Entrega con observaciones';
              deliveryBadge = 'Con observaciones';
              deliveryBadgeClass = 'observed';
              progressPct = 65;
              nextStepText = 'Revisá las observaciones del equipo docente y notificá tus avances.';
            } else if (workStatus === 'approved') {
              deliveryLabel = 'Entrega aprobada';
              deliveryBadge = 'Aprobada';
              deliveryBadgeClass = 'approved';
              progressPct = 100;
              nextStepText = 'Tu Trabajo Final Integrador fue aprobado.';
            } else if (workStatus === 'disapproved') {
              deliveryLabel = 'Entrega desaprobada';
              deliveryBadge = 'Desaprobada';
              deliveryBadgeClass = 'observed';
              progressPct = 40;
              nextStepText = 'Consultá la devolución docente para continuar con el proyecto.';
            }

            const categoryName =
              item.rawProject?.projectType?.name ||
              item.rawProject?.categoria ||
              '';
            const currentYear = new Date().getFullYear();

            return (
              <div key={item.id} className="my-tfi-panel">
                <div className="my-tfi-panel-header">
                  <div>
                    <h2 className="my-tfi-panel-heading">Mi Trabajo Final Integrador</h2>
                    <p className="my-tfi-panel-cycle">Seguimiento académico · Ciclo {currentYear}</p>
                  </div>
                  <TutorProjectStatusPill estado={item.estado} estadoClass={item.estadoClass} />
                </div>

                <div className="my-tfi-panel-divider" />

                <div className="my-tfi-panel-section">
                  <div className="my-tfi-section-label">PROYECTO ASIGNADO</div>
                  <h3 className="my-tfi-project-name">{item.proyecto}</h3>
                  <div className="my-tfi-project-meta">
                    Proyecto N.º {item.id}
                    {categoryName ? ` · ${categoryName}` : ''}
                  </div>
                </div>

                <dl className="my-tfi-panel-grid">
                  <div>
                    <dt>Docente / Tutor</dt>
                    <dd>
                      <span>{item.estudiantePrincipal}</span>
                      {item.estudiantesExtras && (
                        <span className="badge bg-light text-secondary border ms-2">
                          {item.estudiantesExtras}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Última tutoría</dt>
                    <dd>{item.ultimaTutoria === '-' ? 'Sin registrar' : item.ultimaTutoria}</dd>
                  </div>
                </dl>

                <div className="my-tfi-status-box">
                  <div className="my-tfi-status-box-title">Estado de mi TFI</div>
                  <div className="my-tfi-status-box-row">
                    <span className="my-tfi-status-label">{deliveryLabel}</span>
                    <span className={`my-tfi-status-pill ${deliveryBadgeClass}`}>{deliveryBadge}</span>
                  </div>
                  <div className="my-tfi-progress-track">
                    <div className="my-tfi-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="my-tfi-status-hint">{nextStepText}</div>
                </div>

                <button
                  type="button"
                  className="my-tfi-cta-btn"
                  onClick={() => goToProject(item.id)}
                >
                  <span>Ver seguimiento del proyecto</span>
                  <FaArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTfiCard;


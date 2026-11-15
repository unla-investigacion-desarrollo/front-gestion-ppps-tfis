import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFileLines,
  FaChalkboardUser,
  FaCalendarDays,
  FaArrowRight,
  FaCloudArrowUp,
  FaFolderOpen,
  FaClock,
} from 'react-icons/fa6';
import { projectService } from '../../../services/projectService';
import TutorProjectStatusPill from '../../Dashboard/Teacher/components/TutorProjectStatusPill';
import type { TutorProjectRecord } from '../../Dashboard/Teacher/components/TutorProjectsTable';
import './MyTfiCard.css';

export interface MyTfiCardProps {
  /** TFI del estudiante (un estudiante solo puede tener uno). */
  record: TutorProjectRecord | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/**
 * Vista "Mi TFI" del estudiante: ficha única de su Trabajo Final Integrador.
 * Reemplaza la tabla de "Mis proyectos", ya que un estudiante solo puede tener un TFI.
 */
export const MyTfiCard: React.FC<MyTfiCardProps> = ({ record, loading, error, onRetry }) => {
  const navigate = useNavigate();
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Sin TFI asignado: consultar si hay solicitudes en revisión para orientar al estudiante
  useEffect(() => {
    if (loading || record) return;
    const token = localStorage.getItem('token') || '';
    if (!token) return;
    projectService
      .getMyRequests(token)
      .then((requests: any) => setPendingRequestsCount(Array.isArray(requests) ? requests.length : 0))
      .catch(() => setPendingRequestsCount(0));
  }, [loading, record]);

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
      ) : !record ? (
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
        <div className="my-tfi-card">
          <div className="my-tfi-card-header">
            <div className="my-tfi-card-icon">
              <FaFileLines size={20} />
            </div>
            <div className="my-tfi-card-heading">
              <h2 className="my-tfi-card-title">{record.proyecto}</h2>
              <div className="d-flex align-items-center flex-wrap gap-2 mt-1">
                <TutorProjectStatusPill estado={record.estado} estadoClass={record.estadoClass} />
                {record.tutoringRequested && (
                  <span
                    className="badge bg-warning text-dark border border-warning-subtle d-inline-flex align-items-center gap-1"
                    style={{ fontSize: '11px', fontWeight: 600, padding: '3px 7px' }}
                    title="Solicitaste una sesión de tutoría"
                  >
                    <FaChalkboardUser size={11} /> Tutoría solicitada
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="my-tfi-card-desc">{record.subtitulo}</p>

          <dl className="my-tfi-card-info">
            <div>
              <dt>Docente / Tutor</dt>
              <dd>
                <FaChalkboardUser size={13} className="text-secondary" />
                <span>{record.estudiantePrincipal}</span>
                {record.estudiantesExtras && (
                  <span className="badge bg-light text-secondary border">{record.estudiantesExtras}</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Última tutoría</dt>
              <dd>
                <FaCalendarDays size={12} className="text-muted" />
                <span>{record.ultimaTutoria}</span>
              </dd>
            </div>
          </dl>

          <div className="my-tfi-card-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
              onClick={() => navigate(`/alumno/entregas?projectId=${encodeURIComponent(record.id)}`)}
            >
              <FaCloudArrowUp size={13} />
              <span>Ir a entregas</span>
            </button>
            <button
              type="button"
              className="btn btn-sm my-tfi-btn-primary d-inline-flex align-items-center gap-2"
              onClick={() => goToProject(record.id)}
            >
              <span>Ver proyecto</span>
              <FaArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTfiCard;


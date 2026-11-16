import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFileLines,
  FaUsers,
  FaArrowTrendUp,
  FaFolder,
  FaBullhorn,
} from 'react-icons/fa6';
import { pppService } from '../../../../services/pppService';
import { projectService } from '../../../../services/projectService';

interface EvaluatorDashboardProps {
  userName: string;
  onGoToPPP: () => void;
}

export const EvaluatorDashboard: React.FC<EvaluatorDashboardProps> = ({
  userName,
  onGoToPPP,
}) => {
  const navigate = useNavigate();

  const [pppCounts, setPppCounts] = useState<{
    totalActivas: number;
    totalPendientes: number;
    enRevision: number;
    conObservaciones: number;
    pendDocumentacion: number;
    pendSiu: number;
  } | null>(null);

  const [proposalsSummary, setProposalsSummary] = useState<{
    open: number;
    total: number;
  } | null>(null);
  const [projectSummary, setProjectSummary] = useState<{
    inProgress: number;
    withoutStudents: number;
  } | null>(null);
  const [requestCounts, setRequestCounts] = useState<{
    students: number;
    professors: number;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCounts = async () => {
      const token = localStorage.getItem('token') || '';
      if (!token) {
        setErrors({ sesión: 'No se encontró una sesión activa. Iniciá sesión nuevamente.' });
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        pppService.getPPPTramites(token),
        projectService.getPendingRequests(token),
        projectService.getProjectsOverview(token),
        pppService.getProposals(token, false),
      ]);

      if (!isMounted) return;

      const [tramitesResult, requestsResult, projectsResult, proposalsResult] = results;
      const nextErrors: Record<string, string> = {};

      if (tramitesResult.status === 'fulfilled') {
        const tramites = tramitesResult.value;
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
        });
      } else {
        nextErrors.ppp = `No se pudieron cargar los trámites PPP: ${
          tramitesResult.reason instanceof Error ? tramitesResult.reason.message : 'Error desconocido.'
        }`;
      }

      if (requestsResult.status === 'fulfilled') {
        setRequestCounts({
          students: requestsResult.value.pendingStudents.length,
          professors: requestsResult.value.pendingProfessors.length,
        });
      } else {
        nextErrors.requests = `No se pudieron cargar las solicitudes de proyectos: ${
          requestsResult.reason instanceof Error ? requestsResult.reason.message : 'Error desconocido.'
        }`;
      }

      if (projectsResult.status === 'fulfilled') {
        if (!Array.isArray(projectsResult.value)) {
          nextErrors.projects = 'La respuesta de proyectos no tiene un formato válido.';
        } else {
          const inProgressProjects = projectsResult.value.filter((project: any) => {
            const status = String(project.status || project.estado || '').toLowerCase().trim();
            const isFinished = /(final|termin|aprob|complet|cerrad|cancel|rechaz|archiv|abandon)/.test(status);
            return project.active !== false && status !== 'inactive' && status !== 'inactivo' && !isFinished;
          });
          const withoutStudents = inProgressProjects.filter((project: any) => {
            const students =
              (Array.isArray(project.activeStudents) && project.activeStudents.length > 0
                ? project.activeStudents
                : Array.isArray(project.students)
                ? project.students
                : Array.isArray(project.alumnos)
                ? project.alumnos
                : Array.isArray(project.users)
                ? project.users
                : []);
            return students.filter((student: any) => student && student.active !== false).length === 0;
          }).length;

          setProjectSummary({
            inProgress: inProgressProjects.length,
            withoutStudents,
          });
        }
      } else {
        nextErrors.projects = `No se pudieron cargar los proyectos: ${
          projectsResult.reason instanceof Error ? projectsResult.reason.message : 'Error desconocido.'
        }`;
      }

      if (proposalsResult.status === 'fulfilled') {
        const proposals = proposalsResult.value;
        const openCount = proposals.filter((proposal) => proposal.isOpen).length;
        setProposalsSummary({
          open: openCount,
          total: proposals.length,
        });
      } else {
        nextErrors.proposals = `No se pudieron cargar las convocatorias: ${
          proposalsResult.reason instanceof Error ? proposalsResult.reason.message : 'Error desconocido.'
        }`;
      }

      setErrors(nextErrors);
      setLoading(false);
    };

    loadCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const solicitudesItems = [
    { label: 'Esperando aprobación', count: requestCounts?.students ?? null },
    { label: 'Tutores que solicitan incorporarse', count: requestCounts?.professors ?? null },
    { label: 'Pendientes de completar integrantes', count: projectSummary?.withoutStudents ?? null },
  ];
  const totalSolicitudesPendientes =
    requestCounts && projectSummary
      ? requestCounts.students + requestCounts.professors + projectSummary.withoutStudents
      : null;
  const displayCount = (count: number | null | undefined) =>
    loading ? '…' : count ?? '—';

  return (
    <div>
      {/* Saludo Principal */}
      <h1 className="teacher-page-title">
        Bienvenido, {userName}
      </h1>
      <p className="teacher-page-subtitle">
        Gestioná los procesos de evaluación de Prácticas Profesionales y Proyectos.
      </p>

      {Object.entries(errors).map(([section, message]) => (
        <div key={section} className="alert alert-danger py-2 small" role="alert">
          {message}
        </div>
      ))}

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
                {displayCount(pppCounts?.totalPendientes)}
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
                <span className="teacher-breakdown-count">{displayCount(pppCounts?.enRevision)}</span>
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
                <span className="teacher-breakdown-count">{displayCount(pppCounts?.conObservaciones)}</span>
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
                <span className="teacher-breakdown-count">{displayCount(pppCounts?.pendDocumentacion)}</span>
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
                <span className="teacher-breakdown-count">{displayCount(pppCounts?.pendSiu)}</span>
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
                {displayCount(totalSolicitudesPendientes)}
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
                  <span className="teacher-breakdown-count">{displayCount(item.count)}</span>
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
            <div className="teacher-submetric-num">{displayCount(pppCounts?.totalActivas)}</div>
            <div className="teacher-submetric-label">PPP activas</div>
            {pppCounts && (
              <div className="teacher-submetric-context">
                {pppCounts.enRevision} en revisión · {pppCounts.conObservaciones} con observaciones
              </div>
            )}
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-icon">
              <FaFolder size={17} />
            </div>
            <div className="teacher-submetric-num">{displayCount(projectSummary?.inProgress)}</div>
            <div className="teacher-submetric-label">Proyectos en curso</div>
            <div className="teacher-submetric-context">
              {displayCount(totalSolicitudesPendientes)} solicitudes pendientes de revisión
            </div>
          </div>

          <div className="teacher-submetric-card">
            <div className="teacher-submetric-icon">
              <FaBullhorn size={17} />
            </div>
            <div className="teacher-submetric-num">{displayCount(proposalsSummary?.open)}</div>
            <div className="teacher-submetric-label">Convocatorias abiertas</div>
            {proposalsSummary && proposalsSummary.total > 0 && (
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

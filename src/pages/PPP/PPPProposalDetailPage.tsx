import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaArrowUpRightFromSquare,
  FaCalendarDays,
  FaFolderOpen,
  FaIdCard,
  FaNoteSticky,
} from 'react-icons/fa6';
import {
  fetchPPPProposalById,
  selectCurrentPPPProposal,
  selectPPPProposals,
  selectPPPStatus,
} from '../../../redux/slices/pppSlice';
import { PPPApplicant, PPPProposal } from '../../services/pppService';
import { getInitialsFromName } from '../../utils/userUtils';
import './PPP.css';

const formatDate = (value?: string): string => {
  if (!value) return 'No registrada';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No registrada';
  return parsed.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const classifyStatus = (status?: string): 'pending' | 'accepted' | 'rejected' => {
  const normalized = String(status || '').toLowerCase().trim();
  if (
    ['accepted', 'aceptado', 'approved', 'pending_documentation', 'in_review', 'observed'].includes(
      normalized
    )
  ) {
    return 'accepted';
  }
  if (['rejected', 'rechazado', 'application_rejected', 'disapproved'].includes(normalized)) {
    return 'rejected';
  }
  return 'pending';
};

const getInitials = (name: string): string => getInitialsFromName(name, 'EP');

export const PPPProposalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  const currentProposal = useSelector(selectCurrentPPPProposal) as PPPProposal | null;
  const proposalsList = useSelector(selectPPPProposals) as PPPProposal[];
  const status = useSelector(selectPPPStatus);

  useEffect(() => {
    if (id) {
      dispatch(fetchPPPProposalById(id));
    }
  }, [dispatch, id]);

  const proposal = useMemo(() => {
    if (currentProposal && String(currentProposal.id) === String(id)) {
      return currentProposal;
    }
    return proposalsList.find((item) => String(item.id) === String(id)) || null;
  }, [currentProposal, proposalsList, id]);

  const applicants: PPPApplicant[] = useMemo(() => {
    if (!proposal) return [];
    const raw = proposal.applicants || (proposal as any).applications || [];
    return Array.isArray(raw) ? raw : [];
  }, [proposal]);

  const approvedApplicants: PPPApplicant[] = useMemo(() => {
    return applicants.filter((app) => classifyStatus(app.status) === 'accepted');
  }, [applicants]);

  const isLoading = status === 'loading' && !proposal;

  if (isLoading) {
    return (
      <div className="ppp-page-wrapper">
        <div className="ppp-container" style={{ maxWidth: '1080px' }}>
          <div className="bg-white border rounded-4 p-5 text-center text-muted">
            <div className="spinner-border text-danger mb-2" role="status" />
            <div className="small">Cargando información del proyecto PPP...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="ppp-page-wrapper">
        <div className="ppp-container" style={{ maxWidth: '1080px' }}>
          <div className="bg-white border rounded-4 p-5 text-center">
            <h4 className="fw-bold text-dark mb-2">Proyecto PPP no encontrado</h4>
            <p className="text-muted small mb-4">
              No pudimos encontrar la propuesta solicitada o no tenés permisos para visualizarla.
            </p>
            <button
              type="button"
              className="btn-unla-primary"
              onClick={() => navigate('/ppp/convocatorias')}
            >
              Volver a Convocatorias PPP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ppp-page-wrapper">
      <div className="ppp-container" style={{ maxWidth: '1080px' }}>
        {/* Barra superior minimalista */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 bg-white"
            onClick={() => navigate('/ppp/convocatorias')}
          >
            <FaArrowLeft size={12} />
            Volver a Convocatorias PPP
          </button>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-white text-dark border fw-semibold px-3 py-2 rounded-3 shadow-sm">
              Ref #{proposal.id}
            </span>
          </div>
        </div>

        {/* Cabecera principal */}
        <div className="bg-white border rounded-4 p-4 mb-4 shadow-sm">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(100, 0, 29, 0.08)',
                  color: 'var(--unla-primary, #64001d)',
                }}
              >
                <FaIdCard size={22} />
              </div>
              <div>
                <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                  <span
                    className="badge fw-semibold"
                    style={{
                      backgroundColor: '#f5f3ff',
                      color: '#6d28d9',
                      border: '1px solid #ede9fe',
                      fontSize: '0.75rem',
                    }}
                  >
                    PPP
                  </span>
                  <span
                    className={`teacher-status-pill ${proposal.isOpen ? 'curso' : 'finalizado'}`}
                  >
                    <span className="status-dot" />
                    <span>{proposal.isOpen ? 'Vigente' : 'Cerrada'}</span>
                  </span>
                </div>
                <h1 className="h4 fw-bold text-dark m-0">{proposal.title}</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido en 2 columnas */}
        <div className="row g-4">
          {/* Columna principal */}
          <div className="col-lg-8 d-flex flex-column gap-4">
            {/* Descripción */}
            <div className="bg-white border rounded-4 p-4 shadow-sm">
              <h2 className="h6 fw-bold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                Descripción del proyecto
              </h2>
              <p
                className="text-dark mb-0"
                style={{ lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '0.96rem' }}
              >
                {proposal.description || 'Sin descripción registrada.'}
              </p>
            </div>

            {/* Notas internas (si existen) */}
            {proposal.internalNotes && (
              <div
                className="border rounded-4 p-4"
                style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
              >
                <div className="d-flex align-items-center gap-2 mb-2 text-warning-emphasis fw-semibold small">
                  <FaNoteSticky size={14} />
                  <span>Notas internas</span>
                </div>
                <p className="mb-0 small text-dark" style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {proposal.internalNotes}
                </p>
              </div>
            )}

            {/* Integrantes asignados (solo aprobados) */}
            <div className="bg-white border rounded-4 p-4 shadow-sm">
              <div className="d-flex align-items-center gap-2 mb-3">
                <h2 className="h6 fw-bold text-dark m-0">Integrantes asignados</h2>
                <span
                  className="badge rounded-pill px-2.5 py-1"
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#047857',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  {approvedApplicants.length}{' '}
                  {approvedApplicants.length === 1 ? 'estudiante' : 'estudiantes'}
                </span>
              </div>

              {approvedApplicants.length === 0 ? (
                <div className="text-muted small py-3 text-center border rounded-3 bg-light">
                  Todavía no hay estudiantes aprobados asignados a esta práctica.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {approvedApplicants.map((app, index) => {
                    const name =
                      app.student?.fullName ||
                      app.student?.name ||
                      app.studentName ||
                      'Estudiante';
                    const email = app.student?.email || app.studentEmail || '';

                    return (
                      <div
                        key={app.applicationId || app.id || index}
                        className="d-flex align-items-center justify-content-between gap-3 p-3 border rounded-3"
                        style={{ backgroundColor: '#f8fafc' }}
                      >
                        <div className="d-flex align-items-center gap-3 min-w-0">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                            style={{
                              width: '38px',
                              height: '38px',
                              backgroundColor: '#64001d',
                              fontSize: '12px',
                            }}
                          >
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <div className="fw-bold text-dark text-truncate">{name}</div>
                            {email && (
                              <div className="small text-muted text-truncate">{email}</div>
                            )}
                          </div>
                        </div>
                        <span
                          className="teacher-status-pill curso flex-shrink-0"
                        >
                          <span className="status-dot" />
                          <span>Aprobado</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna lateral */}
          <div className="col-lg-4 d-flex flex-column gap-4">
            {/* Resumen rápido */}
            <div className="bg-white border rounded-4 p-4 shadow-sm">
              <h2
                className="h6 fw-bold text-uppercase text-muted mb-3"
                style={{ letterSpacing: '0.04em' }}
              >
                Resumen
              </h2>
              <div className="d-flex flex-column gap-3 small">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Estado</span>
                  <span className="fw-semibold text-dark">
                    {proposal.isOpen ? 'Convocatoria vigente' : 'Convocatoria cerrada'}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Integrantes activos</span>
                  <span className="fw-semibold" style={{ color: '#047857' }}>
                    {approvedApplicants.length}{' '}
                    {approvedApplicants.length === 1 ? 'estudiante' : 'estudiantes'}
                  </span>
                </div>
                <hr className="my-1" />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted d-inline-flex align-items-center gap-1">
                    <FaCalendarDays size={12} />
                    Creada
                  </span>
                  <span className="fw-medium text-dark">{formatDate(proposal.createdAt)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted d-inline-flex align-items-center gap-1">
                    <FaCalendarDays size={12} />
                    Actualizada
                  </span>
                  <span className="fw-medium text-dark">{formatDate(proposal.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Carpeta Drive */}
            <div className="bg-white border rounded-4 p-4 shadow-sm">
              <h2
                className="h6 fw-bold text-uppercase text-muted mb-3"
                style={{ letterSpacing: '0.04em' }}
              >
                Recursos
              </h2>
              {proposal.driveFolderUrl ? (
                <a
                  href={proposal.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-secondary w-100 d-inline-flex align-items-center justify-content-center gap-2"
                >
                  <FaFolderOpen size={15} />
                  <span>Abrir carpeta en Drive</span>
                  <FaArrowUpRightFromSquare size={12} />
                </a>
              ) : (
                <div className="text-muted small">
                  No hay carpeta de Google Drive asociada a esta propuesta.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PPPProposalDetailPage;

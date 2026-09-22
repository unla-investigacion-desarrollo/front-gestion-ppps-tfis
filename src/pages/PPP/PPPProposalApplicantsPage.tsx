import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaArrowLeft,
  FaFolderOpen,
  FaMagnifyingGlass,
  FaUserGraduate,
  FaCheck,
  FaXmark,
  FaClock,
  FaShieldHalved,
  FaUsers,
  FaFileLines,
} from 'react-icons/fa6';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import {
  fetchPPPProposalById,
  acceptPPPApplicant,
  rejectPPPApplicant,
  selectCurrentPPPProposal,
  selectPPPStatus,
} from '../../../redux/slices/pppSlice';
import { useUserProfile } from '../../hooks/useUserProfile';
import { PPPApplicant } from '../../services/pppService';
import { showToast } from '../../utils/toast';
import './PPP.css';

export const PPPProposalApplicantsPage: React.FC = () => {
  const { id: routeProposalId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();

  const currentUser = useSelector(selectCurrentUser) as any;
  const { user: userProfile, isTutor: profileIsTutor } = useUserProfile();

  const currentProposal = useSelector(selectCurrentPPPProposal);
  const pppStatus = useSelector(selectPPPStatus);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);

  // Validación de roles de usuario
  const userRoles = useMemo(() => {
    const rawRoles = Array.isArray(currentUser?.roles)
      ? currentUser.roles
      : currentUser?.rol
      ? [currentUser.rol]
      : [];
    return rawRoles.map((roleRecord: any) =>
      String(roleRecord).toUpperCase().trim()
    );
  }, [currentUser]);

  const isAdmin =
    userRoles.includes('ADMIN') || userRoles.includes('ADMINISTRADOR');
  const isTeacher = userRoles.some((roleName: string) =>
    ['DOCENTE', 'TEACHER', 'PROFESSOR'].includes(roleName)
  );
  const isTutor = Boolean(
    currentUser?.isTutor ?? userProfile?.isTutor ?? profileIsTutor
  );
  const isStudent = !isAdmin && !isTeacher;
  const isEvaluator = (isTeacher && !isTutor) || isAdmin;

  // Cargar propuesta y postulantes al montar
  useEffect(() => {
    if (routeProposalId && isEvaluator) {
      dispatch(fetchPPPProposalById(routeProposalId));
    }
  }, [dispatch, routeProposalId, isEvaluator]);

  // Lista de postulantes normalizada
  const applicantsList: PPPApplicant[] = useMemo(() => {
    return currentProposal?.applicants || [];
  }, [currentProposal]);

  // Métricas de postulantes
  const metrics = useMemo(() => {
    const totalCount = applicantsList.length;
    let pendingCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;

    applicantsList.forEach((applicantRecord) => {
      const normalizedStatus = (applicantRecord.status || '').toLowerCase();
      if (
        normalizedStatus === 'accepted' ||
        normalizedStatus === 'aprobada' ||
        normalizedStatus === 'approved'
      ) {
        acceptedCount += 1;
      } else if (
        normalizedStatus === 'rejected' ||
        normalizedStatus === 'application_rejected' ||
        normalizedStatus === 'rechazada'
      ) {
        rejectedCount += 1;
      } else {
        pendingCount += 1;
      }
    });

    return { totalCount, pendingCount, acceptedCount, rejectedCount };
  }, [applicantsList]);

  // Filtrado de postulantes según búsqueda y estado
  const filteredApplicants = useMemo(() => {
    return applicantsList.filter((applicantRecord) => {
      const applicantName =
        applicantRecord.student?.fullName ||
        applicantRecord.student?.name ||
        applicantRecord.studentName ||
        '';
      const applicantEmail =
        applicantRecord.student?.email ||
        applicantRecord.studentEmail ||
        '';
      const normalizedStatus = (applicantRecord.status || '').toLowerCase();

      // Filtro por estado
      if (statusFilter === 'pending') {
        const isPending =
          normalizedStatus === 'pending' ||
          normalizedStatus === 'pending_application' ||
          !normalizedStatus;
        if (!isPending) return false;
      } else if (statusFilter === 'accepted') {
        const isAccepted =
          normalizedStatus === 'accepted' ||
          normalizedStatus === 'approved' ||
          normalizedStatus === 'aprobada';
        if (!isAccepted) return false;
      } else if (statusFilter === 'rejected') {
        const isRejected =
          normalizedStatus === 'rejected' ||
          normalizedStatus === 'application_rejected' ||
          normalizedStatus === 'rechazada';
        if (!isRejected) return false;
      }

      // Filtro por texto
      if (searchQuery.trim()) {
        const normalizedQuery = searchQuery.toLowerCase().trim();
        const matchesName = applicantName.toLowerCase().includes(normalizedQuery);
        const matchesEmail = applicantEmail.toLowerCase().includes(normalizedQuery);
        const matchesApplicationId = String(
          applicantRecord.applicationId || applicantRecord.id || ''
        ).includes(normalizedQuery);
        return matchesName || matchesEmail || matchesApplicationId;
      }

      return true;
    });
  }, [applicantsList, statusFilter, searchQuery]);

  // Manejador para resolver postulación (Aceptar / Rechazar)
  const handleResolveApplicant = async (
    applicantRecord: PPPApplicant,
    shouldAccept: boolean
  ) => {
    if (!routeProposalId) return;

    const targetStudentId =
      applicantRecord.student?.id ||
      applicantRecord.studentId ||
      applicantRecord.applicationId ||
      applicantRecord.id;

    if (!targetStudentId) {
      showToast('No se encontró el identificador del postulante', 'error');
      return;
    }

    const actionKey = applicantRecord.applicationId || applicantRecord.id || targetStudentId;
    setActionLoadingId(actionKey);

    try {
      if (shouldAccept) {
        await dispatch(
          acceptPPPApplicant({
            proposalId: routeProposalId,
            studentId: targetStudentId,
          })
        ).unwrap();
        showToast(
          'Postulante aceptado con éxito. Se ha iniciado su expediente en Documentación Pendiente.',
          'success'
        );
      } else {
        await dispatch(
          rejectPPPApplicant({
            proposalId: routeProposalId,
            studentId: targetStudentId,
          })
        ).unwrap();
        showToast('Postulación desestimada correctamente.', 'info');
      }

      // Refrescar los datos frescos desde el endpoint GET /ppp/proposals/:id
      dispatch(fetchPPPProposalById(routeProposalId));
    } catch (resolutionError: any) {
      showToast(
        resolutionError || 'Error al procesar la postulación',
        'error'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================================================================
  // BLOQUE DE ACCESO RESTRINGIDO (Tutor docente o Estudiante)
  // =========================================================================
  if (isTutor && !isAdmin) {
    return (
      <div className="ppp-page-wrapper">
        <div className="ppp-container">
          <div className="bg-white rounded-3 border p-5 text-center shadow-sm my-5">
            <div className="mb-3 text-warning">
              <FaShieldHalved size={56} />
            </div>
            <h4 className="fw-bold text-dark mb-2">Acceso restringido a Evaluadores</h4>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: '520px' }}>
              Como docente tutor no contás con permisos para gestionar ni visualizar los postulantes de convocatorias PPP (<code>validateNotTutor</code>). Esta función está reservada exclusivamente para evaluadores y administradores.
            </p>
            <button
              type="button"
              className="btn btn-unla-primary"
              onClick={() => navigate('/ppp/convocatorias')}
            >
              ← Volver a Convocatorias PPP
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isStudent) {
    return (
      <div className="ppp-page-wrapper">
        <div className="ppp-container">
          <div className="bg-white rounded-3 border p-5 text-center shadow-sm my-5">
            <div className="mb-3 text-danger">
              <FaShieldHalved size={56} />
            </div>
            <h4 className="fw-bold text-dark mb-2">Acceso no autorizado</h4>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: '520px' }}>
              Los estudiantes no tienen acceso a ver el listado de todos los postulantes de una convocatoria.
            </p>
            <button
              type="button"
              className="btn btn-unla-primary"
              onClick={() => navigate('/ppp/convocatorias')}
            >
              ← Volver a Convocatorias PPP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ppp-page-wrapper">
      <div className="ppp-container">
        {/* Barra superior de navegación / volver */}
        <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <Link
            to="/ppp/convocatorias"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
          >
            <FaArrowLeft size={13} />
            Volver a Convocatorias PPP
          </Link>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 rounded-pill small">
            Módulo de Evaluación de Postulantes
          </span>
        </div>

        {/* Tarjeta de Encabezado de la Convocatoria */}
        <div className="ppp-header-card mb-4">
          <div className="ppp-header-info">
            <div className="ppp-header-icon">
              <FaUsers size={28} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h1 className="ppp-title mb-0">
                  {currentProposal?.title || 'Convocatoria de PPP'}
                </h1>
                {currentProposal && (
                  <span
                    className={`badge ${
                      currentProposal.isOpen
                        ? 'bg-success-subtle text-success'
                        : 'bg-secondary-subtle text-secondary'
                    } px-2.5 py-1 rounded-pill`}
                  >
                    {currentProposal.isOpen ? 'Convocatoria Abierta' : 'Convocatoria Cerrada'}
                  </span>
                )}
              </div>
              <p className="ppp-subtitle mb-0">
                {currentProposal?.description ||
                  'Gestión y revisión académica de estudiantes postulados a esta práctica profesional.'}
              </p>
            </div>
          </div>

          <div className="ppp-header-actions">
            {currentProposal?.driveFolderUrl && (
              <a
                href={currentProposal.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-unla-outline d-inline-flex align-items-center gap-2"
              >
                <FaFolderOpen size={14} />
                Carpeta Drive ↗
              </a>
            )}
          </div>
        </div>

        {/* Notas internas si existen */}
        {currentProposal?.internalNotes && (
          <div className="alert alert-light border shadow-sm p-3 mb-4 rounded-3">
            <strong className="text-secondary small d-block mb-1">
              Notas internas de cátedra:
            </strong>
            <span className="text-dark small">{currentProposal.internalNotes}</span>
          </div>
        )}

        {/* Tarjetas de Métricas de Postulantes */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white rounded-3 border p-3 shadow-sm d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', backgroundColor: '#eff6ff', color: '#1d4ed8' }}
              >
                <FaUsers size={22} />
              </div>
              <div>
                <div className="text-muted small fw-semibold">Total Postulantes</div>
                <div className="fs-4 fw-bold text-dark">{metrics.totalCount}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white rounded-3 border p-3 shadow-sm d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7', color: '#b45309' }}
              >
                <FaClock size={20} />
              </div>
              <div>
                <div className="text-muted small fw-semibold">Pendientes</div>
                <div className="fs-4 fw-bold text-dark">{metrics.pendingCount}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white rounded-3 border p-3 shadow-sm d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', backgroundColor: '#dcfce7', color: '#15803d' }}
              >
                <FaCheck size={20} />
              </div>
              <div>
                <div className="text-muted small fw-semibold">Aceptados</div>
                <div className="fs-4 fw-bold text-dark">{metrics.acceptedCount}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white rounded-3 border p-3 shadow-sm d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', backgroundColor: '#fee2e2', color: '#b91c1c' }}
              >
                <FaXmark size={22} />
              </div>
              <div>
                <div className="text-muted small fw-semibold">Rechazados</div>
                <div className="fs-4 fw-bold text-dark">{metrics.rejectedCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white rounded-3 border p-3 shadow-sm mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: '240px', maxWidth: '480px' }}>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <FaMagnifyingGlass size={14} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Buscar por estudiante, correo o ID de postulación..."
                value={searchQuery}
                onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
              />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label className="small text-muted fw-semibold text-nowrap">Estado:</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(selectEvent) =>
                setStatusFilter(
                  selectEvent.target.value as 'all' | 'pending' | 'accepted' | 'rejected'
                )
              }
              style={{ width: '160px' }}
            >
              <option value="all">Todos ({metrics.totalCount})</option>
              <option value="pending">Pendientes ({metrics.pendingCount})</option>
              <option value="accepted">Aceptados ({metrics.acceptedCount})</option>
              <option value="rejected">Rechazados ({metrics.rejectedCount})</option>
            </select>
          </div>
        </div>

        {/* Tabla de Postulantes */}
        {pppStatus === 'loading' && applicantsList.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-3 border">
            <div className="spinner-border text-primary mb-2" role="status" />
            <div className="text-muted small">Cargando postulantes de la convocatoria...</div>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="bg-white rounded-3 border p-5 text-center shadow-sm">
            <div className="mb-3 text-muted">
              <FaUserGraduate size={48} color="#cbd5e1" />
            </div>
            <h5 className="fw-bold text-dark mb-2">No se encontraron postulantes</h5>
            <p className="text-muted small mx-auto mb-0" style={{ maxWidth: '420px' }}>
              {applicantsList.length === 0
                ? 'Esta convocatoria aún no ha recibido postulaciones de estudiantes.'
                : 'No hay postulantes que coincidan con los filtros de búsqueda aplicados.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-3 border shadow-sm">
            <table className="table table-hover align-middle mb-0 ppp-table">
              <thead className="table-light border-bottom">
                <tr>
                  <th style={{ width: '90px' }}>ID</th>
                  <th>Estudiante</th>
                  <th>Conocimientos / Motivación</th>
                  <th>Estado</th>
                  <th style={{ width: '140px' }}>Trámite</th>
                  <th style={{ width: '220px', textAlign: 'center' }}>Acciones de Evaluación</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map((applicantRecord, applicantIndex) => {
                  const applicantName =
                    applicantRecord.student?.fullName ||
                    applicantRecord.student?.name ||
                    applicantRecord.studentName ||
                    'Estudiante Postulado';
                  const applicantEmail =
                    applicantRecord.student?.email ||
                    applicantRecord.studentEmail ||
                    '';
                  const applicationId =
                    applicantRecord.applicationId ||
                    applicantRecord.id ||
                    applicantIndex + 1;
                  const normalizedStatus = (applicantRecord.status || '').toLowerCase();
                  const isPending =
                    normalizedStatus === 'pending' ||
                    normalizedStatus === 'pending_application' ||
                    !normalizedStatus;
                  const isAccepted =
                    normalizedStatus === 'accepted' ||
                    normalizedStatus === 'approved' ||
                    normalizedStatus === 'aprobada';
                  const isRejected =
                    normalizedStatus === 'rejected' ||
                    normalizedStatus === 'application_rejected' ||
                    normalizedStatus === 'rechazada';

                  const itemActionLoading =
                    actionLoadingId === applicantRecord.applicationId ||
                    actionLoadingId === applicantRecord.id;

                  // Iniciales para avatar
                  const initials = applicantName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((namePart: string) => namePart[0]?.toUpperCase())
                    .join('') || 'EP';

                  return (
                    <tr key={applicantRecord.applicationId || applicantRecord.id || applicantIndex}>
                      {/* Columna: ID de Postulación */}
                      <td>
                        <span className="badge bg-light text-dark border fw-medium px-2 py-1">
                          #{applicationId}
                        </span>
                      </td>

                      {/* Columna: Estudiante */}
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: '36px',
                              height: '36px',
                              backgroundColor: '#800020',
                              fontSize: '13px',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{applicantName}</div>
                            {applicantEmail && (
                              <div className="small text-muted">{applicantEmail}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna: Conocimientos Previos */}
                      <td>
                        <div
                          className="small text-secondary"
                          style={{
                            maxWidth: '360px',
                            whiteSpace: 'normal',
                            lineHeight: '1.4',
                          }}
                        >
                          {applicantRecord.previousKnowledge ? (
                            applicantRecord.previousKnowledge
                          ) : (
                            <span className="text-muted fst-italic">
                              Sin información adicional especificada
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Columna: Estado */}
                      <td>
                        {isAccepted ? (
                          <span className="badge bg-success-subtle text-success px-2.5 py-1 rounded-pill">
                            Aceptado
                          </span>
                        ) : isRejected ? (
                          <span className="badge bg-danger-subtle text-danger px-2.5 py-1 rounded-pill">
                            Rechazado
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning px-2.5 py-1 rounded-pill">
                            Pendiente de evaluación
                          </span>
                        )}
                      </td>

                      {/* Columna: Enlace a Trámite si existe */}
                      <td>
                        {applicantRecord.applicationId ? (
                          <Link
                            to={`/ppp/${applicantRecord.applicationId}`}
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                            title="Ver expediente individual de este trámite"
                          >
                            <FaFileLines size={12} />
                            Ver #{applicantRecord.applicationId}
                          </Link>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>

                      {/* Columna: Acciones de Evaluación */}
                      <td style={{ textAlign: 'center' }}>
                        {isPending ? (
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                              disabled={itemActionLoading}
                              onClick={() => handleResolveApplicant(applicantRecord, false)}
                              title="Rechazar postulación"
                            >
                              <FaXmark size={13} />
                              Rechazar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                              disabled={itemActionLoading}
                              onClick={() => handleResolveApplicant(applicantRecord, true)}
                              title="Aceptar estudiante en la práctica"
                            >
                              <FaCheck size={13} />
                              Aceptar
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small fst-italic">
                            Resuelta
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PPPProposalApplicantsPage;

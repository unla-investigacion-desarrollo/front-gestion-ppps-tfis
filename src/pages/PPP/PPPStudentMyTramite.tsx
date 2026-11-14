import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaIdCard, FaSquarePlus, FaMagnifyingGlass } from 'react-icons/fa6';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import {
  fetchMyPPPApplications,
  createPPPExternal,
  selectPPPExpedientes,
} from '../../../redux/slices/pppSlice';
import { PPPEpidiente, PPPStatus, normalizePPPType } from '../../services/pppService';
import { showToast } from '../../utils/toast';
import './PPP.css';

export const PPPStudentMyTramite: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser) as any;
  const myExpedientes = useSelector(selectPPPExpedientes) as PPPEpidiente[];

  const [consultIdInput, setConsultIdInput] = useState<string>('');

  useEffect(() => {
    // Limpiar posibles datos cacheados antiguos en localStorage
    try {
      localStorage.removeItem(`ppp_student_applications_${currentUser?.id || 'me'}`);
      localStorage.removeItem('ppp_student_applications_me');
      localStorage.removeItem('ppp_proposals_mock');
      localStorage.removeItem('ppp_expedientes_mock');
    } catch {}

    dispatch(fetchMyPPPApplications());
  }, [dispatch, currentUser?.id]);

  const handleCreateExternal = async () => {
    try {
      const studentInfo = {
        id: currentUser?.id,
        name:
          [currentUser?.nombre, currentUser?.apellido]
            .filter(Boolean)
            .join(' ') || currentUser?.email,
        email: currentUser?.email,
      };
      const newExp = await dispatch(createPPPExternal({ studentInfo })).unwrap();
      showToast('Trámite externo iniciado con éxito', 'success');
      if (newExp?.id) {
        navigate(`/ppp/${newExp.id}`);
      }
    } catch (externalError: any) {
      showToast(externalError || 'Error al iniciar trámite externo', 'error');
    }
  };

  const getStatusLabel = (statusKey: PPPStatus | string) => {
    switch (statusKey) {
      case 'pending_application':
        return 'Postulación en Evaluación';
      case 'application_rejected':
        return 'Postulación Desestimada';
      case 'pending_documentation':
        return 'Documentación Pendiente';
      case 'in_review':
        return 'En Revisión Académica';
      case 'observed':
        return 'Con Observaciones';
      case 'approved':
        return 'Práctica Aprobada';
      case 'disapproved':
        return 'Práctica No Aprobada';
      case 'dropped_out':
        return 'Trámite Dado de Baja';
      default:
        return statusKey;
    }
  };

  const handleConsultSubmit = (formSubmitEvent: React.FormEvent) => {
    formSubmitEvent.preventDefault();
    const cleanId = consultIdInput.trim().replace(/^#/, '');
    if (!cleanId) {
      showToast('Por favor, ingresá el número de identificación de tu postulación o trámite', 'error');
      return;
    }
    navigate(`/ppp/${cleanId}`);
  };

  return (
    <div className="ppp-page-wrapper">
      <div className="ppp-container">
        {/* Cabecera Principal */}
        <div className="ppp-header-card">
          <div className="ppp-header-info">
            <div className="ppp-header-icon">
              <FaIdCard size={28} />
            </div>
            <div>
              <h1 className="ppp-title">Mis Trámites de Prácticas Profesionales (PPP)</h1>
              <p className="ppp-subtitle">
                Accedé al estado de tus postulaciones, entrega de convenios oficiales y avance académico.
              </p>
            </div>
          </div>
          <div className="ppp-header-actions">
            <Link to="/ppp/convocatorias" className="btn-unla-outline">
              Explorar convocatorias
            </Link>
            <button type="button" className="btn-unla-primary" onClick={handleCreateExternal}>
              Iniciar trámite externo
            </button>
          </div>
        </div>

        {/* Buscador de Trámite / Postulación por ID (GET /ppp/:id) */}
        <div className="bg-white rounded-3 border p-3.5 shadow-sm mb-4">
          <form onSubmit={handleConsultSubmit} className="d-flex align-items-center flex-wrap gap-2">
            <div className="text-secondary small fw-semibold me-2">
              Consultar postulación o expediente por ID:
            </div>
            <div className="input-group" style={{ maxWidth: '280px' }}>
              <span className="input-group-text bg-light text-muted">#</span>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: 1, 14, 25..."
                value={consultIdInput}
                onChange={(changeEvent) => setConsultIdInput(changeEvent.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-sm btn-unla-primary d-inline-flex align-items-center gap-1.5">
              <FaMagnifyingGlass size={13} />
              Consultar trámite
            </button>
          </form>
        </div>

        {/* Listado de Trámites y Postulaciones del Alumno */}
        {myExpedientes.length === 0 ? (
          <div className="bg-white rounded-3 border p-5 text-center shadow-sm">
            <div className="mb-3 text-muted">
              <FaSquarePlus size={56} color="#cbd5e1" />
            </div>
            <h5 className="fw-bold text-dark mb-2">Aún no tenés ningún trámite de PPP iniciado</h5>
            <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '480px' }}>
              Podés postularte a las propuestas de proyectos internos ofrecidos por la universidad o iniciar la tramitación de una práctica profesional autogestionada en una empresa u organismo externo.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/ppp/convocatorias" className="btn-unla-primary text-decoration-none">
                Ver convocatorias abiertas
              </Link>
              <button type="button" className="btn-unla-outline" onClick={handleCreateExternal}>
                Iniciar trámite externo
              </button>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {myExpedientes.map((expedienteItem) => {
              const isInterna = normalizePPPType(expedienteItem.type, expedienteItem) === 'interna';
              return (
              <div
                key={expedienteItem.id}
                className="bg-white rounded-3 border p-4 shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-3"
              >
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span className="badge bg-light text-secondary border">
                      Trámite #{expedienteItem.id}
                    </span>
                    <span
                      className={`badge ${
                        isInterna
                          ? 'bg-primary-subtle text-primary'
                          : 'bg-info-subtle text-info'
                      }`}
                    >
                      {isInterna ? 'Práctica Interna' : 'Práctica Externa'}
                    </span>
                    <span className={`ppp-status-badge ppp-status-${expedienteItem.status}`}>
                      <span className="ppp-status-dot" />
                      {getStatusLabel(expedienteItem.status)}
                    </span>
                  </div>
                  <h5 className="fw-bold m-0">
                    <Link
                      to={`/ppp/${expedienteItem.id}`}
                      className="text-decoration-none"
                      style={{ color: 'var(--unla-primary, #64001d)' }}
                      title="Ver detalle completo de la PPP"
                    >
                      {expedienteItem.proposalTitle || expedienteItem.proposal?.title || 'Práctica Profesional Supervisada'}
                    </Link>
                  </h5>
                  <div className="text-muted small mt-1">
                    Iniciado el:{' '}
                    {expedienteItem.createdAt
                      ? new Date(expedienteItem.createdAt).toLocaleDateString('es-AR')
                      : '-'}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className={`ppp-siu-badge ${expedienteItem.isSiuLoaded ? 'loaded' : 'pending'}`}>
                    {expedienteItem.isSiuLoaded ? '✓ SIU Asentado' : '○ SIU Pendiente'}
                  </span>
                  <Link
                    to={`/ppp/${expedienteItem.id}`}
                    className="btn-unla-primary text-decoration-none"
                  >
                    Ver seguimiento →
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PPPStudentMyTramite;

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaIdCard, FaFileArrowDown, FaFolderOpen } from 'react-icons/fa6';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import {
  fetchMyPPPApplications,
  fetchPPPGeneralDrive,
  selectPPPExpedientes,
  selectPPPGeneralDrive,
} from '../../../redux/slices/pppSlice';
import { PPPEpidiente, normalizePPPType } from '../../services/pppService';
import { PPPHowItWorks } from './components';
import { formatNumericDate, formatPPPStatus } from '../../utils/formatters';
import './PPP.css';

export const PPPStudentMyTramite: React.FC = () => {
  const dispatch = useDispatch<any>();
  const currentUser = useSelector(selectCurrentUser) as any;
  const myExpedientes = useSelector(selectPPPExpedientes) as PPPEpidiente[];
  const generalDriveUrl = useSelector(selectPPPGeneralDrive);

  useEffect(() => {
    // Limpiar posibles datos cacheados antiguos en localStorage
    try {
      localStorage.removeItem(`ppp_student_applications_${currentUser?.id || 'me'}`);
      localStorage.removeItem('ppp_student_applications_me');
      localStorage.removeItem('ppp_proposals_mock');
      localStorage.removeItem('ppp_expedientes_mock');
    } catch {}

    dispatch(fetchMyPPPApplications());
    dispatch(fetchPPPGeneralDrive());
  }, [dispatch, currentUser?.id]);

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
        </div>

        <PPPHowItWorks highlightStep={3} defaultOpen={myExpedientes.length === 0} />

        {/* BOTÓN PRIORITARIO: Descargar Modelos y Convenios Oficiales (Drive General) */}
        <div className="ppp-drive-download-banner">
          <div className="ppp-drive-download-info">
            <div className="ppp-drive-download-icon">
              <FaFileArrowDown size={24} />
            </div>
            <div>
              <h6 className="fw-bold text-dark m-0">Modelos y Convenios Oficiales de PPP</h6>
              <p className="text-muted small m-0">
                Descargá las actas acuerdo, convenios marco, planillas de actividades y seguro para presentar en la cátedra.
              </p>
            </div>
          </div>

          <a
            href={
              generalDriveUrl ||
              myExpedientes[0]?.generalDriveUrl ||
              'https://drive.google.com/drive/u/0/folders/1DxFDOFkHbMfaY0d313EMMlS-itEMRztI'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="btn-unla-primary text-decoration-none d-inline-flex align-items-center gap-1.5"
          >
            <FaFolderOpen size={16} />
            Abrir carpeta de convenios (Drive) ↗
          </a>
        </div>

        {/* Listado de Trámites y Postulaciones del Alumno */}
        {myExpedientes.length === 0 ? (
          <div className="bg-white rounded-3 border p-5 text-center shadow-sm">
            <h5 className="fw-bold text-dark mb-2">Aún no tenés ningún trámite de PPP iniciado</h5>
            <p className="text-muted small mx-auto mb-0" style={{ maxWidth: '480px' }}>
              Podés postularte a las propuestas de proyectos internos ofrecidos por la universidad o iniciar la tramitación de una práctica profesional autogestionada en una empresa u organismo externo.
            </p>
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
                      {formatPPPStatus(expedienteItem.status)}
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
                    Iniciado el: {formatNumericDate(expedienteItem.createdAt, '-')}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className={`ppp-siu-badge ${expedienteItem.isSiuLoaded ? 'loaded' : 'pending'}`}>
                    {expedienteItem.isSiuLoaded ? '✓ SIU Asentado' : '○ SIU Pendiente'}
                  </span>
                  {expedienteItem.status === 'pending_application' ? (
                    <span className="badge bg-light text-secondary border fw-normal px-2 py-1">
                      Pendiente de aprobación
                    </span>
                  ) : (
                    <Link
                      to={`/ppp/${expedienteItem.id}`}
                      className="btn-unla-primary text-decoration-none"
                    >
                      Ver seguimiento →
                    </Link>
                  )}
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

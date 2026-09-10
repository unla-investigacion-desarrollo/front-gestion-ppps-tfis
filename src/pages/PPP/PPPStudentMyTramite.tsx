import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import {
  fetchPPPExpedientes,
  createPPPExternal,
  selectPPPExpedientes,
  selectPPPStatus,
} from '../../../redux/slices/pppSlice';
import { PPPEpidiente } from '../../services/pppService';
import { showToast } from '../../utils/toast';
import './PPP.css';

export const PPPStudentMyTramite: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser) as any;
  const expedientes = useSelector(selectPPPExpedientes) as PPPEpidiente[];

  useEffect(() => {
    dispatch(fetchPPPExpedientes());
  }, [dispatch]);

  // Buscar trámites del alumno actual
  const myExpedientes = useMemo(() => {
    if (!currentUser?.id) return expedientes;
    return expedientes.filter(
      (e) =>
        String(e.studentId) === String(currentUser.id) ||
        (e.studentEmail && currentUser.email && e.studentEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        e.studentId === 'me'
    );
  }, [expedientes, currentUser]);

  const handleCreateExternal = async () => {
    try {
      const studentInfo = {
        id: currentUser?.id,
        name: [currentUser?.nombre, currentUser?.apellido].filter(Boolean).join(' ') || currentUser?.email,
        email: currentUser?.email,
      };
      const newExp = await dispatch(createPPPExternal({ studentInfo })).unwrap();
      showToast('Trámite externo iniciado con éxito', 'success');
      if (newExp?.id) {
        navigate(`/ppp/${newExp.id}`);
      }
    } catch (err: any) {
      showToast(err || 'Error al iniciar trámite externo', 'error');
    }
  };

  return (
    <div className="ppp-page-wrapper">
      <div className="ppp-container">
        <div className="ppp-header-card">
          <div className="ppp-header-info">
            <div className="ppp-header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 16s-1 0-1-1 1-4 5-4 5 3 5 4 1 1 1 1H4Zm4-5.95a2.5 2.5 0 1 0-.001-5.001A2.5 2.5 0 0 0 8 10.05Zm4.5-1.55a.5.5 0 0 0 0 1H15a.5.5 0 0 0 0-1h-2.5Zm0-2.5a.5.5 0 0 0 0 1H15a.5.5 0 0 0 0-1h-2.5Zm0-2.5a.5.5 0 0 0 0 1H15a.5.5 0 0 0 0-1h-2.5Z" />
              </svg>
            </div>
            <div>
              <h1 className="ppp-title">Mis Trámites de Prácticas Profesionales (PPP)</h1>
              <p className="ppp-subtitle">
                Accedé al estado de tus expedientes, entrega de convenios oficiales y avance académico.
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

        {myExpedientes.length === 0 ? (
          <div className="bg-white rounded-3 border p-5 text-center shadow-sm">
            <div className="mb-3 text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="#cbd5e1" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
              </svg>
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
            {myExpedientes.map((exp) => (
              <div key={exp.id} className="bg-white rounded-3 border p-4 shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-light text-secondary border">Expediente #{exp.id}</span>
                    <span className={`badge ${exp.type === 'interna' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'}`}>
                      {exp.type === 'interna' ? 'Práctica Interna' : 'Práctica Externa'}
                    </span>
                    <span className={`ppp-status-badge ppp-status-${exp.status}`}>
                      <span className="ppp-status-dot" />
                      {exp.status}
                    </span>
                  </div>
                  <h5 className="fw-bold text-dark m-0">{exp.proposalTitle || 'Práctica Profesional Supervisada'}</h5>
                  <div className="text-muted small mt-1">
                    Iniciado el: {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '-'}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className={`ppp-siu-badge ${exp.isSiuLoaded ? 'loaded' : 'pending'}`}>
                    {exp.isSiuLoaded ? '✓ SIU Asentado' : '○ SIU Pendiente'}
                  </span>
                  <Link to={`/ppp/${exp.id}`} className="btn-unla-primary text-decoration-none">
                    Ver seguimiento →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PPPStudentMyTramite;

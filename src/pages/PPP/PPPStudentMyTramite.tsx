import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaIdCard, FaSquarePlus, FaMagnifyingGlass } from 'react-icons/fa6';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import {
  fetchPPPExpedientes,
  createPPPExternal,
  selectPPPExpedientes,
} from '../../../redux/slices/pppSlice';
import { PPPEpidiente } from '../../services/pppService';
import { showToast } from '../../utils/toast';
import './PPP.css';

export const PPPStudentMyTramite: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser) as any;
  const expedientes = useSelector(selectPPPExpedientes) as PPPEpidiente[];

  const [consultIdInput, setConsultIdInput] = useState<string>('');

  useEffect(() => {
    dispatch(fetchPPPExpedientes());
  }, [dispatch]);

  // Leer postulaciones conservadas localmente por el estudiante
  const studentStorageKey = `ppp_student_applications_${currentUser?.id || 'me'}`;
  const storedApplications = useMemo(() => {
    try {
      const storedData = localStorage.getItem(studentStorageKey);
      return storedData ? JSON.parse(storedData) : [];
    } catch (readError) {
      return [];
    }
  }, [studentStorageKey]);

  // Buscar trámites del alumno actual combinando expedientes y postulaciones registradas
  const myExpedientes = useMemo(() => {
    const rawList = [...expedientes];

    // Filtrar expedientes del usuario
    let filteredList = rawList.filter((expedienteItem) => {
      const matchesUserId =
        currentUser?.id && String(expedienteItem.studentId) === String(currentUser.id);
      const matchesUserEmail =
        expedienteItem.studentEmail &&
        currentUser?.email &&
        expedienteItem.studentEmail.toLowerCase() === currentUser.email.toLowerCase();
      const matchesMe = expedienteItem.studentId === 'me';
      return matchesUserId || matchesUserEmail || matchesMe;
    });

    // Añadir postulaciones guardadas localmente si no están ya en la lista
    storedApplications.forEach((storedApp: any) => {
      const alreadyIncluded = filteredList.some(
        (existingItem) => String(existingItem.id) === String(storedApp.id)
      );
      if (!alreadyIncluded) {
        filteredList.unshift({
          id: storedApp.id,
          type: 'interna',
          status: storedApp.status || 'pending_application',
          isSiuLoaded: false,
          proposalId: storedApp.proposalId,
          proposalTitle: storedApp.proposalTitle || 'Convocatoria PPP',
          createdAt: storedApp.appliedAt || new Date().toISOString(),
        } as PPPEpidiente);
      }
    });

    return filteredList;
  }, [expedientes, currentUser, storedApplications]);

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
            {myExpedientes.map((expedienteItem) => (
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
                        expedienteItem.type === 'interna'
                          ? 'bg-primary-subtle text-primary'
                          : 'bg-info-subtle text-info'
                      }`}
                    >
                      {expedienteItem.type === 'interna' ? 'Práctica Interna' : 'Práctica Externa'}
                    </span>
                    <span className={`ppp-status-badge ppp-status-${expedienteItem.status}`}>
                      <span className="ppp-status-dot" />
                      {expedienteItem.status === 'pending_application'
                        ? 'Postulación Pendiente de Revisión'
                        : expedienteItem.status}
                    </span>
                  </div>
                  <h5 className="fw-bold text-dark m-0">
                    {expedienteItem.proposalTitle || 'Práctica Profesional Supervisada'}
                  </h5>
                  <div className="text-muted small mt-1">
                    Iniciado el:{' '}
                    {expedienteItem.createdAt
                      ? new Date(expedienteItem.createdAt).toLocaleDateString()
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PPPStudentMyTramite;

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { pppService, PPPApplication, PPPProposal } from '../../services/pppService';
import { showToast } from '../../utils/toast';
import './PPPProposals.css';

const PPPProposals: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const token = useSelector((state: any) => state.auth.token) || localStorage.getItem('token') || '';
  const roles = useMemo(() => (user?.roles || []).map((role) => String(role).toUpperCase()), [user]);
  const canManage = roles.some((role) => ['DOCENTE', 'PROFESSOR', 'TEACHER', 'ADMIN', 'ADMINISTRADOR'].includes(role));
  const isStudent = roles.includes('ESTUDIANTE') || roles.includes('STUDENT') || !canManage;

  const [proposals, setProposals] = useState<PPPProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<PPPProposal | null>(null);
  const [applicantsProposal, setApplicantsProposal] = useState<PPPProposal | null>(null);
  const [previousKnowledge, setPreviousKnowledge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generalDriveUrl, setGeneralDriveUrl] = useState('');
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    driveFolderUrl: '',
    internalNotes: '',
  });

  const loadProposals = async () => {
    setLoading(true);
    setError('');
    try {
      setProposals(await pppService.getProposals(token));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las convocatorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProposals();
  }, [token]);

  useEffect(() => {
    if (!canManage) return;
    void pppService.getGeneralDrive(token)
      .then((drive) => setGeneralDriveUrl(drive.generalDriveUrl || ''))
      .catch(() => setGeneralDriveUrl(''));
  }, [token, canManage]);

  const visibleProposals = isStudent ? proposals.filter((proposal) => proposal.isOpen) : proposals;

  const handleCreateProposal = async (event: FormEvent) => {
    event.preventDefault();
    if (!newProposal.title.trim() || !newProposal.description.trim()) return;

    setSubmitting(true);
    try {
      await pppService.createProposal({
        title: newProposal.title.trim(),
        description: newProposal.description.trim(),
        ...(newProposal.driveFolderUrl.trim() ? { driveFolderUrl: newProposal.driveFolderUrl.trim() } : {}),
        ...(newProposal.internalNotes.trim() ? { internalNotes: newProposal.internalNotes.trim() } : {}),
      }, token);
      setNewProposal({ title: '', description: '', driveFolderUrl: '', internalNotes: '' });
      showToast('Convocatoria creada correctamente.', 'success');
      await loadProposals();
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'No se pudo crear la convocatoria.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (proposal: PPPProposal) => {
    try {
      await pppService.updateProposalStatus(proposal.id, !proposal.isOpen, token);
      showToast(`Convocatoria ${!proposal.isOpen ? 'abierta' : 'cerrada'}.`, 'success');
      await loadProposals();
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'No se pudo actualizar la convocatoria.', 'error');
    }
  };

  const handleApplicationAction = async (proposal: PPPProposal, application: PPPApplication, accept: boolean) => {
    const studentId = application.studentId ?? application.student?.id ?? application.student?.id_user;
    if (studentId === undefined || studentId === null) {
      showToast('La postulación no contiene un identificador de estudiante.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (accept) await pppService.acceptApplication(proposal.id, studentId as string | number, token);
      else await pppService.rejectApplication(proposal.id, studentId as string | number, token);
      showToast(accept ? 'Postulación aceptada.' : 'Postulación rechazada.', 'success');
      await loadProposals();
      setApplicantsProposal(null);
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'No se pudo actualizar la postulación.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProposal || !previousKnowledge.trim()) return;

    setSubmitting(true);
    try {
      await pppService.applyToProposal(selectedProposal.id, { previousKnowledge: previousKnowledge.trim() }, token);
      setSelectedProposal(null);
      setPreviousKnowledge('');
      showToast('Postulación enviada correctamente.', 'success');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'No se pudo enviar la postulación.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartExternal = async () => {
    setSubmitting(true);
    try {
      const result = await pppService.startExternalCase(token);
      const caseId = result?.id;
      showToast('Trámite externo iniciado correctamente.', 'success');
      if (caseId !== undefined && caseId !== null) navigate(`/ppp/${caseId}`);
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'No se pudo iniciar el trámite externo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGeneralDrive = async (event: FormEvent) => {
    event.preventDefault();
    if (!generalDriveUrl.trim()) return;
    setSubmitting(true);
    try {
      const drive = await pppService.updateGeneralDrive(generalDriveUrl.trim(), token);
      setGeneralDriveUrl(drive.generalDriveUrl || generalDriveUrl.trim());
      showToast('Drive general actualizado correctamente.', 'success');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el Drive general.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="unla-page ppp-page">
      <div className="ppp-heading">
        <div>
          <span className="ppp-eyebrow">Prácticas Profesionales Supervisadas</span>
          <h1>Convocatorias PPP</h1>
          <p>{isStudent ? 'Explorá las oportunidades abiertas y enviá tu postulación.' : 'Gestioná las convocatorias disponibles para estudiantes.'}</p>
        </div>
        <button className="unla-btn ppp-refresh" type="button" onClick={() => void loadProposals()} disabled={loading}>
          Actualizar
        </button>
      </div>

      {isStudent && (
        <section className="unla-card ppp-external-card">
          <div><h2>Trámite externo</h2><p>Iniciá un expediente PPP externo sin postularte a una convocatoria.</p></div>
          <button className="unla-btn" type="button" onClick={() => void handleStartExternal()} disabled={submitting}>Iniciar trámite externo</button>
        </section>
      )}

      {error && <div className="ppp-alert ppp-alert-error">{error}</div>}
      {loading ? <div className="unla-card">Cargando convocatorias...</div> : (
        <section className="ppp-grid" aria-live="polite">
          {visibleProposals.map((proposal) => (
            <article className="unla-card ppp-proposal-card" key={proposal.id}>
              <div className="ppp-card-topline">
                <span className={`ppp-status ${proposal.isOpen ? 'is-open' : 'is-closed'}`}>
                  {proposal.isOpen ? 'Abierta' : 'Cerrada'}
                </span>
                {canManage && (
                  <label className="ppp-switch-label">
                    <input type="checkbox" checked={proposal.isOpen} onChange={() => void handleToggle(proposal)} />
                    <span>{proposal.isOpen ? 'Cerrar' : 'Abrir'}</span>
                  </label>
                )}
              </div>
              <h2>{proposal.title}</h2>
              <p className="ppp-description">{proposal.description}</p>
              {canManage && proposal.internalNotes && (
                <div className="ppp-private-note"><strong>Notas internas:</strong> {proposal.internalNotes}</div>
              )}
              {proposal.driveFolderUrl && (
                <a className="ppp-drive-link" href={proposal.driveFolderUrl} target="_blank" rel="noreferrer">
                  Ver carpeta de la propuesta
                </a>
              )}
              {isStudent && (
                <button className="unla-btn" type="button" onClick={() => setSelectedProposal(proposal)}>
                  Postularme
                </button>
              )}
              {canManage && <button className="ppp-secondary-action" type="button" onClick={() => setApplicantsProposal(proposal)}>Ver postulantes ({proposal.applications?.length || 0})</button>}
            </article>
          ))}
          {visibleProposals.length === 0 && <div className="unla-card ppp-empty">No hay convocatorias disponibles.</div>}
        </section>
      )}

      {canManage && (
        <section className="unla-card ppp-create-card">
          <h2>Crear propuesta interna</h2>
          <form className="ppp-form" onSubmit={handleCreateProposal}>
            <label>Título<input value={newProposal.title} onChange={(event) => setNewProposal({ ...newProposal, title: event.target.value })} required /></label>
            <label>Descripción<textarea value={newProposal.description} onChange={(event) => setNewProposal({ ...newProposal, description: event.target.value })} required rows={4} /></label>
            <label>Carpeta de Drive <span>(opcional)</span><input type="url" value={newProposal.driveFolderUrl} onChange={(event) => setNewProposal({ ...newProposal, driveFolderUrl: event.target.value })} /></label>
            <label>Notas internas <span>(opcional)</span><textarea value={newProposal.internalNotes} onChange={(event) => setNewProposal({ ...newProposal, internalNotes: event.target.value })} rows={3} /></label>
            <button className="unla-btn" type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Crear convocatoria'}</button>
          </form>
        </section>
      )}

      {canManage && (
        <section className="unla-card ppp-create-card">
          <h2>Drive general de la carrera</h2>
          <form className="ppp-form ppp-drive-form" onSubmit={handleSaveGeneralDrive}>
            <label>URL institucional<input type="url" value={generalDriveUrl} onChange={(event) => setGeneralDriveUrl(event.target.value)} required /></label>
            <button className="unla-btn" type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar Drive general'}</button>
          </form>
        </section>
      )}

      {selectedProposal && (
        <div className="ppp-modal-backdrop" role="presentation" onMouseDown={() => setSelectedProposal(null)}>
          <section className="unla-card ppp-modal" role="dialog" aria-modal="true" aria-labelledby="apply-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="ppp-modal-header"><h2 id="apply-title">Postularme a {selectedProposal.title}</h2><button type="button" onClick={() => setSelectedProposal(null)} aria-label="Cerrar">×</button></div>
            <form className="ppp-form" onSubmit={handleApply}>
              <label>Conocimientos previos<textarea value={previousKnowledge} onChange={(event) => setPreviousKnowledge(event.target.value)} required rows={6} /></label>
              <button className="unla-btn" type="submit" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar postulación'}</button>
            </form>
          </section>
        </div>
      )}

      {applicantsProposal && (
        <div className="ppp-modal-backdrop" role="presentation" onMouseDown={() => setApplicantsProposal(null)}>
          <section className="unla-card ppp-modal" role="dialog" aria-modal="true" aria-labelledby="applicants-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="ppp-modal-header"><h2 id="applicants-title">Postulantes a {applicantsProposal.title}</h2><button type="button" onClick={() => setApplicantsProposal(null)} aria-label="Cerrar">×</button></div>
            <div className="ppp-applicants-list">
              {(applicantsProposal.applications || []).map((application, index) => {
                const student = application.student || {};
                const studentId = application.studentId ?? student.id ?? student.id_user;
                return <article className="ppp-applicant" key={String(studentId ?? index)}><div><strong>{String(student.name || student.nombre || [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email || `Postulante ${index + 1}`)}</strong><span>{application.previousKnowledge || 'Sin conocimientos previos informados'}</span></div><div className="ppp-applicant-actions"><button className="unla-btn" type="button" disabled={submitting} onClick={() => void handleApplicationAction(applicantsProposal, application, true)}>Aceptar</button><button className="ppp-action-danger" type="button" disabled={submitting} onClick={() => void handleApplicationAction(applicantsProposal, application, false)}>Rechazar</button></div></article>;
              })}
              {!applicantsProposal.applications?.length && <p className="ppp-muted">No hay postulantes para esta convocatoria.</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default PPPProposals;

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { pppService, PPPCase } from '../../services/pppService';
import { showToast } from '../../utils/toast';
import './PPPCaseDetail.css';

const statusLabels: Record<string, string> = {
  pending_application: 'Postulación en evaluación',
  application_rejected: 'Postulación desestimada',
  pending_documentation: 'Documentación pendiente',
  in_review: 'En revisión académica',
  observed: 'Con observaciones',
  approved: 'Práctica aprobada',
  disapproved: 'Práctica no aprobada',
  dropped_out: 'Trámite dado de baja',
};

const PPPCaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const token = useSelector((state: any) => state.auth.token) || localStorage.getItem('token') || '';
  const roles = useMemo(() => (user?.roles || []).map((role) => String(role).toUpperCase()), [user]);
  const canManage = roles.some((role) => ['DOCENTE', 'PROFESSOR', 'TEACHER', 'ADMIN', 'ADMINISTRADOR'].includes(role));
  const [pppCase, setPppCase] = useState<PPPCase | null>(null);
  const [generalDriveUrl, setGeneralDriveUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadCase = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await pppService.getCase(id, token);
      setPppCase(result);
      if (!canManage) {
        try {
          const drive = await pppService.getGeneralDrive(token);
          setGeneralDriveUrl(drive.generalDriveUrl || '');
        } catch {
          setGeneralDriveUrl('');
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el trámite.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCase();
  }, [id, token, canManage]);

  const runAction = async (action: () => Promise<PPPCase>, message: string) => {
    setBusy(true);
    try {
      setPppCase(await action());
      showToast(message, 'success');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el trámite.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="unla-page"><div className="unla-card">Cargando trámite...</div></main>;
  if (error || !pppCase) return <main className="unla-page"><div className="unla-card ppp-detail-error">{error || 'Trámite no encontrado.'}</div></main>;

  const status = String(pppCase.status || '');
  const title = pppCase.proposal?.title || String(pppCase.title || 'Trámite PPP');
  const student = pppCase.student || {};
  const canNotify = !canManage && ['pending_documentation', 'observed'].includes(status);
  const canAbandon = !canManage && !['application_rejected', 'approved', 'disapproved', 'dropped_out'].includes(status);
  const canEvaluate = canManage && status === 'in_review';
  const canLoadSiu = canManage && status === 'approved' && !pppCase.isSiuLoaded;

  return (
    <main className="unla-page ppp-detail-page">
      <button className="ppp-back-link" type="button" onClick={() => navigate('/ppp/proposals')}>← Volver a convocatorias</button>
      <div className="ppp-detail-heading">
        <div><span className="ppp-eyebrow">Expediente PPP</span><h1>{title}</h1></div>
        <span className="ppp-detail-status">{statusLabels[status] || status}</span>
      </div>

      <div className="ppp-detail-grid">
        <section className="unla-card">
          <h2>Estado del trámite</h2>
          <p className="ppp-detail-status-large">{statusLabels[status] || status}</p>
          <div className="ppp-detail-facts">
            <div><span>Tipo</span><strong>{String(pppCase.type || 'No informado')}</strong></div>
            <div><span>Carga en SIU Guaraní</span><strong>{pppCase.isSiuLoaded ? 'Confirmada' : 'Pendiente'}</strong></div>
          </div>
          {pppCase.observations && <div className="ppp-observation"><strong>Observaciones</strong><p>{pppCase.observations}</p></div>}
        </section>

        {canManage && (
          <section className="unla-card">
            <h2>Alumno postulante</h2>
            <div className="ppp-detail-facts">
              <div><span>Nombre</span><strong>{String(student.name || student.nombre || 'No informado')}</strong></div>
              <div><span>Email</span><strong>{String(student.email || 'No informado')}</strong></div>
              <div><span>Legajo</span><strong>{String(student.legajo || 'No informado')}</strong></div>
            </div>
          </section>
        )}

        {!canManage && (
          <section className="unla-card">
            <h2>Documentación oficial</h2>
            <p>Descargá los modelos y convenios desde la carpeta institucional.</p>
            {generalDriveUrl ? <a className="unla-btn ppp-inline-button" href={generalDriveUrl} target="_blank" rel="noreferrer">Abrir Drive general</a> : <p className="ppp-muted">El Drive general todavía no está configurado.</p>}
          </section>
        )}
      </div>

      <section className="unla-card ppp-actions-card">
        <h2>Acciones</h2>
        <div className="ppp-actions">
          {canEvaluate && <><button className="unla-btn" type="button" disabled={busy} onClick={() => void runAction(() => pppService.approveCase(id!, token), 'Trámite aprobado.')}>Aprobar</button><button className="ppp-action-warning" type="button" disabled={busy} onClick={() => void runAction(() => pppService.observeCase(id!, token), 'Trámite observado.')}>Observar</button><button className="ppp-action-danger" type="button" disabled={busy} onClick={() => void runAction(() => pppService.disapproveCase(id!, token), 'Trámite desaprobado.')}>Desaprobar</button></>}
          {canLoadSiu && <button className="unla-btn" type="button" disabled={busy} onClick={() => void runAction(() => pppService.loadCaseInSiu(id!, token), 'Carga en SIU confirmada.')}>Confirmar carga en SIU</button>}
          {canNotify && <button className="unla-btn" type="button" disabled={busy} onClick={() => void runAction(() => pppService.notifyDocumentationSent(id!, token), 'Entrega de documentación notificada.')}>Notificar entrega de documentación</button>}
          {canAbandon && <button className="ppp-action-danger" type="button" disabled={busy} onClick={() => void runAction(() => pppService.abandonCase(id!, token), 'Trámite dado de baja.')}>Dar de baja trámite</button>}
          {!canEvaluate && !canLoadSiu && !canNotify && !canAbandon && <span className="ppp-muted">No hay acciones disponibles para este estado.</span>}
        </div>
      </section>
    </main>
  );
};

export default PPPCaseDetail;

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { pppService, PPPCase } from '../../services/pppService';
import './PPPInbox.css';

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

const getStudentName = (pppCase: PPPCase) => {
  const student = pppCase.student || {};
  return String(student.name || student.nombre || [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email || 'Sin alumno');
};

const PPPInbox: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector((state: any) => state.auth.token) || localStorage.getItem('token') || '';
  const navigate = useNavigate();
  const [cases, setCases] = useState<PPPCase[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isManager = (user?.roles || []).some((role) => ['DOCENTE', 'PROFESSOR', 'TEACHER', 'ADMIN', 'ADMINISTRADOR'].includes(String(role).toUpperCase()));

  const loadCases = async () => {
    setLoading(true);
    setError('');
    try {
      setCases(await pppService.getCases(token));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar la bandeja.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) void loadCases();
  }, [token, isManager]);

  const typeOptions = useMemo(() => Array.from(new Set(cases.map((item) => String(item.type || '').trim()).filter(Boolean))), [cases]);
  const filteredCases = useMemo(() => {
    const query = studentFilter.trim().toLowerCase();
    return cases.filter((item) => {
      const student = getStudentName(item).toLowerCase();
      const email = String(item.student?.email || '').toLowerCase();
      const type = String(item.type || '');
      return (statusFilter === 'all' || item.status === statusFilter)
        && (typeFilter === 'all' || type === typeFilter)
        && (!query || student.includes(query) || email.includes(query));
    });
  }, [cases, statusFilter, typeFilter, studentFilter]);

  if (!isManager) return <main className="unla-page"><div className="unla-card ppp-inbox-denied">No tenés permisos para consultar la bandeja general.</div></main>;

  return (
    <main className="unla-page ppp-inbox-page">
      <div className="ppp-inbox-heading">
        <div><span className="ppp-eyebrow">Gestión académica</span><h1>Bandeja de expedientes PPP</h1><p>Revisá postulaciones y trámites en curso.</p></div>
        <button className="unla-btn" type="button" onClick={() => void loadCases()} disabled={loading}>Actualizar</button>
      </div>

      <section className="unla-card ppp-filters" aria-label="Filtros de expedientes">
        <label>Estado<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Tipo<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Todos</option>{typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <label>Alumno<input value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)} placeholder="Nombre o email" /></label>
      </section>

      {error && <div className="ppp-inbox-error">{error}</div>}
      <section className="unla-card ppp-table-wrapper">
        {loading ? <p className="ppp-muted">Cargando expedientes...</p> : <div className="ppp-table-scroll"><table className="ppp-inbox-table"><thead><tr><th>Alumno</th><th>Propuesta</th><th>Tipo</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{filteredCases.map((item) => <tr key={String(item.id)}><td><strong>{getStudentName(item)}</strong><small>{String(item.student?.email || '')}</small></td><td>{item.proposal?.title || String(item.title || 'Sin propuesta')}</td><td>{String(item.type || 'No informado')}</td><td><span className="ppp-table-status">{statusLabels[item.status] || item.status}</span></td><td><button className="ppp-open-button" type="button" onClick={() => navigate(`/ppp/${item.id}`)}>Abrir expediente</button></td></tr>)}{!filteredCases.length && <tr><td className="ppp-empty-row" colSpan={5}>No hay expedientes que coincidan con los filtros.</td></tr>}</tbody></table></div>}
      </section>
    </main>
  );
};

export default PPPInbox;

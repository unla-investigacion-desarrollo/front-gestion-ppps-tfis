import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCloudArrowUp,
  FaFileLines,
  FaFolderOpen,
  FaClock,
  FaCircleExclamation,
  FaCheck,
  FaXmark,
  FaMinus,
  FaPaperPlane,
  FaChalkboardUser,
  FaArrowUpRightFromSquare,
  FaPencil,
  FaCircleInfo,
} from 'react-icons/fa6';
import { projectService } from '../../services/projectService';
import {
  studentWorkService,
  StudentWork,
  StudentWorkStatus,
} from '../../services/studentWorkService';
import { showToast } from '../../utils/toast';
import '../Trabajo/Trabajo.css';

const StudentDeliveries: React.FC = () => {
  const token = localStorage.getItem('token') || '';

  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [work, setWork] = useState<StudentWork | null>(null);

  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [loadingWork, setLoadingWork] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [backendError, setBackendError] = useState<string | null>(null);
  const [urlErrors, setUrlErrors] = useState<{ doc?: string; drive?: string }>({});

  // 1. Cargar proyectos activos asignados al estudiante desde el backend
  const loadMyActiveProjects = useCallback(async () => {
    if (!token) return;
    setLoadingProjects(true);
    setBackendError(null);
    try {
      const activeList = await projectService.getMyActiveProjects(token);
      const normalized = Array.isArray(activeList)
        ? activeList.map((item: any) => item.project || item).filter((p: any) => p && p.id)
        : [];

      setMyProjects(normalized);

      if (normalized.length > 0) {
        const firstId = String(normalized[0].id);
        setSelectedProjectId((prev) => prev || firstId);
      } else {
        setSelectedProjectId('');
        // Consultar al backend para obtener el mensaje oficial cuando no tiene proyecto asignado
        try {
          const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');
          const res = await fetch(`${API_URL}/student-work/project/0`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              documentUrl: 'https://docs.google.com/document/d/placeholder',
            }),
          });
          if (!res.ok) {
            const text = await res.text();
            let parsed: any;
            try {
              parsed = JSON.parse(text);
            } catch {}
            const msg =
              parsed?.message ||
              (Array.isArray(parsed?.errors) ? parsed.errors.join(', ') : null) ||
              text;
            if (msg) {
              setBackendError(Array.isArray(msg) ? msg.join(', ') : String(msg));
            }
          }
        } catch {}
      }
    } catch (err: any) {
      setBackendError(err?.message || 'Error al obtener los proyectos asignados del servidor.');
    } finally {
      setLoadingProjects(false);
    }
  }, [token]);

  useEffect(() => {
    loadMyActiveProjects();
  }, [loadMyActiveProjects]);

  // 2. Cargar la entrega (StudentWork) del proyecto seleccionado
  const loadWorkForProject = useCallback(
    async (projId: string) => {
      if (!projId || !token) {
        setWork(null);
        return;
      }
      setLoadingWork(true);
      try {
        const data = await studentWorkService.getWorkByProject(projId, token);
        setWork(data);
        if (data) {
          setDocumentUrl(data.documentUrl || '');
          setDriveFolderUrl(data.driveFolderUrl || '');
          setIsEditing(false);
        } else {
          setDocumentUrl('');
          setDriveFolderUrl('');
          setIsEditing(true);
        }
      } catch (err: any) {
        setBackendError(err?.message || 'Error al consultar la entrega del proyecto.');
      } finally {
        setLoadingWork(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (selectedProjectId) {
      loadWorkForProject(selectedProjectId);
    }
  }, [selectedProjectId, loadWorkForProject]);

  const currentProject = myProjects.find((p) => String(p.id) === String(selectedProjectId));

  const validateUrls = (docUrl: string, driveUrl: string) => {
    const errs: { doc?: string; drive?: string } = {};

    if (!docUrl.trim()) {
      errs.doc = 'El enlace a Google Docs es obligatorio.';
    } else if (!docUrl.trim().startsWith('https://docs.google.com/')) {
      errs.doc = 'Debe ser una URL válida que comience con https://docs.google.com/';
    }

    if (driveUrl.trim() && !driveUrl.trim().startsWith('https://drive.google.com/')) {
      errs.drive = 'Debe ser una URL válida que comience con https://drive.google.com/';
    }

    setUrlErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 3. Registrar o actualizar entrega: POST /student-work/project/:projectId o PATCH /student-work/:id
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);

    if (!validateUrls(documentUrl, driveFolderUrl)) return;

    const targetProjectId = selectedProjectId || '0';
    setSubmitting(true);
    try {
      if (work?.id && isEditing) {
        const updated = await studentWorkService.updateWork(
          work.id,
          {
            documentUrl: documentUrl.trim(),
            driveFolderUrl: driveFolderUrl.trim() || undefined,
          },
          token
        );
        setWork(updated);
        setIsEditing(false);
        showToast('Enlaces de la entrega actualizados correctamente', 'success');
      } else {
        const created = await studentWorkService.createWork(
          targetProjectId,
          {
            documentUrl: documentUrl.trim(),
            driveFolderUrl: driveFolderUrl.trim() || undefined,
          },
          token
        );
        setWork(created);
        setIsEditing(false);
        showToast('Entrega registrada exitosamente', 'success');
      }
    } catch (err: any) {
      const message = err?.message || 'Error al registrar la entrega en el servidor';
      setBackendError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifyAdvances = async () => {
    if (!work?.id || !token) return;
    setSubmitting(true);
    setBackendError(null);
    try {
      const updated = await studentWorkService.notifyAdvances(work.id, token);
      setWork(updated);
      showToast('Se notificaron los avances. Estado: Pendiente de revisión', 'success');
    } catch (err: any) {
      const message = err?.message || 'Error al notificar avances';
      setBackendError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestTutoring = async () => {
    if (!work?.id || !token) return;
    setSubmitting(true);
    setBackendError(null);
    try {
      const updated = await studentWorkService.requestTutoring(work.id, token);
      setWork(updated);
      showToast('Tutoría solicitada exitosamente al equipo docente', 'success');
    } catch (err: any) {
      const message = err?.message || 'Error al solicitar tutoría';
      setBackendError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: StudentWorkStatus) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="badge-status badge-pending_review d-inline-flex align-items-center gap-1">
            <FaClock size={14} />
            Pendiente de revisión
          </span>
        );
      case 'observed':
        return (
          <span className="badge-status badge-observed d-inline-flex align-items-center gap-1">
            <FaCircleExclamation size={14} />
            Con observaciones
          </span>
        );
      case 'approved':
        return (
          <span className="badge-status badge-approved d-inline-flex align-items-center gap-1">
            <FaCheck size={14} />
            Aprobada
          </span>
        );
      case 'disapproved':
        return (
          <span className="badge-status badge-disapproved d-inline-flex align-items-center gap-1">
            <FaXmark size={14} />
            Desaprobada
          </span>
        );
      case 'absent':
        return (
          <span className="badge-status badge-absent d-inline-flex align-items-center gap-1">
            <FaMinus size={14} />
            Ausente
          </span>
        );
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="trabajo-page-container">
      <div className="trabajo-wrapper">
        {/* Encabezado Principal */}
        <div className="trabajo-card mb-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(138, 21, 56, 0.1)',
                  color: 'var(--unla-wine, #8a1538)',
                }}
              >
                <FaCloudArrowUp size={24} />
              </div>
              <div>
                <h1 className="trabajo-project-title m-0" style={{ fontSize: '24px' }}>
                  Entregas de Proyecto TFI
                </h1>
                <p className="trabajo-project-desc m-0">
                  Registrá los enlaces de Google Docs y Google Drive de tu entrega, consultá observaciones, tutorías y calificación.
                </p>
              </div>
            </div>

            {selectedProjectId && (
              <Link
                to={`/proyectos/${selectedProjectId}/trabajo?from=mis-proyectos`}
                state={{ from: 'mis-proyectos' }}
                className="btn-trabajo-primary text-decoration-none d-inline-flex align-items-center gap-2"
              >
                <FaFileLines size={14} />
                Abrir espacio de trabajo completo
              </Link>
            )}
          </div>

          {/* Selector de proyecto si tuviera más de uno activo */}
          {myProjects.length > 1 && (
            <div className="mt-3 pt-3 border-top">
              <label htmlFor="projectSelect" className="form-label fw-semibold small text-secondary">
                Seleccionar Proyecto Activo
              </label>
              <select
                id="projectSelect"
                className="form-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {myProjects.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    #{p.id} - {p.title || p.titulo || `Proyecto #${p.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentProject && (
            <div className="mt-3 pt-3 border-top d-flex flex-wrap gap-4 align-items-center">
              <div>
                <span className="text-muted small d-block">Proyecto asignado</span>
                <strong className="text-dark">
                  #{currentProject.id} — {currentProject.title || currentProject.titulo}
                </strong>
              </div>
              {(currentProject.projectType?.name || currentProject.categoria) && (
                <div>
                  <span className="text-muted small d-block">Categoría</span>
                  <span className="badge bg-secondary">
                    {currentProject.projectType?.name || currentProject.categoria}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mensaje de error del backend (ej. cuando no tiene proyecto asignado o falla validación) */}
        {backendError && (
          <div className="alert alert-danger d-flex align-items-center gap-3 p-3 rounded-3 mb-4 shadow-sm">
            <FaCircleExclamation size={22} className="flex-shrink-0" />
            <div className="flex-grow-1">
              <strong className="d-block">Aviso del servidor</strong>
              <span>{backendError}</span>
            </div>
            {myProjects.length === 0 && (
              <Link
                to="/alumno/mis-proyectos?tab=all"
                className="btn btn-sm btn-outline-danger text-nowrap"
              >
                Ver proyectos disponibles
              </Link>
            )}
          </div>
        )}

        {loadingProjects || loadingWork ? (
          <div className="trabajo-card text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-2 mb-0">Consultando datos del proyecto y entrega...</p>
          </div>
        ) : (
          <div className="trabajo-card">
            {/* Si ya existe una entrega registrada y no está en modo edición */}
            {work && !isEditing ? (
              <div>
                <div className="trabajo-status-header">
                  <div className="trabajo-status-title-group">
                    <h2 className="trabajo-section-title">Estado de tu Entrega</h2>
                    {renderStatusBadge(work.status)}
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                      onClick={() => setIsEditing(true)}
                    >
                      <FaPencil size={12} />
                      Modificar enlaces
                    </button>
                  </div>
                </div>

                {/* Calificación si existe */}
                {work.qualification !== null && work.qualification !== undefined && (
                  <div className="trabajo-qualification-card mb-4">
                    <div>
                      <span className="text-muted small text-uppercase fw-bold">
                        Calificación Registrada
                      </span>
                      <div className="qualification-score-display">
                        {work.qualification}{' '}
                        <span style={{ fontSize: '18px', color: '#6b7280' }}>/ 10</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="qualification-status-text">
                        {work.qualification === 0
                          ? 'Estado: Ausente'
                          : work.qualification >= 4
                          ? 'Estado: Aprobado'
                          : 'Estado: Desaprobado'}
                      </div>
                      {work.lastReviewedAt && (
                        <span className="text-muted small">
                          Revisado el {new Date(work.lastReviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Banner de tutoría solicitada */}
                {work.tutoringRequested && (
                  <div className="trabajo-tutoring-banner mb-4">
                    <FaCircleInfo size={20} />
                    <div>
                      <strong>Tutoría solicitada:</strong> Tu solicitud de tutoría fue enviada al
                      equipo docente.
                    </div>
                  </div>
                )}

                {/* Enlaces registrados */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 bg-light h-100 d-flex flex-column justify-content-between">
                      <div>
                        <span className="text-muted small fw-semibold d-block mb-1">
                          Documento Principal (Google Docs)
                        </span>
                        <div className="text-truncate small text-secondary mb-2">
                          {work.documentUrl}
                        </div>
                      </div>
                      <a
                        href={work.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 align-self-start"
                      >
                        <FaFileLines size={13} />
                        Abrir Google Docs
                        <FaArrowUpRightFromSquare size={11} />
                      </a>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 bg-light h-100 d-flex flex-column justify-content-between">
                      <div>
                        <span className="text-muted small fw-semibold d-block mb-1">
                          Carpeta de Recursos (Google Drive)
                        </span>
                        <div className="text-truncate small text-secondary mb-2">
                          {work.driveFolderUrl || 'No se adjuntó carpeta de Drive opcional'}
                        </div>
                      </div>
                      {work.driveFolderUrl && (
                        <a
                          href={work.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 align-self-start"
                        >
                          <FaFolderOpen size={13} />
                          Abrir Google Drive
                          <FaArrowUpRightFromSquare size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones de seguimiento para el estudiante */}
                <div className="d-flex flex-wrap gap-2 pt-3 border-top">
                  {work.status === 'observed' && (
                    <button
                      type="button"
                      className="btn-trabajo-primary d-inline-flex align-items-center gap-2"
                      onClick={handleNotifyAdvances}
                      disabled={submitting}
                    >
                      <FaPaperPlane size={14} />
                      Notificar avances / correcciones realizadas
                    </button>
                  )}

                  {!work.tutoringRequested && (
                    <button
                      type="button"
                      className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                      onClick={handleRequestTutoring}
                      disabled={submitting}
                    >
                      <FaChalkboardUser size={15} />
                      Solicitar tutoría docente
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Formulario para registrar (POST /student-work/project/:projectId) o editar enlaces */
              <form onSubmit={handleSubmit}>
                <h2 className="trabajo-section-title mb-3">
                  {work ? 'Modificar Enlaces de Entrega' : 'Registrar Entrega de Proyecto'}
                </h2>
                <p className="text-muted small mb-4">
                  Ingresá el enlace obligatorio al documento de <strong>Google Docs</strong> y,
                  opcionalmente, el enlace a la carpeta de <strong>Google Drive</strong> con anexos
                  o código fuente.
                </p>

                <div className="mb-3">
                  <label htmlFor="docUrlInput" className="form-label fw-semibold">
                    Enlace a Google Docs <span className="text-danger">*</span>
                  </label>
                  <input
                    id="docUrlInput"
                    type="url"
                    className={`form-control ${urlErrors.doc ? 'is-invalid' : ''}`}
                    placeholder="https://docs.google.com/document/d/..."
                    value={documentUrl}
                    onChange={(e) => {
                      setDocumentUrl(e.target.value);
                      if (urlErrors.doc) setUrlErrors((prev) => ({ ...prev, doc: undefined }));
                    }}
                    required
                  />
                  {urlErrors.doc ? (
                    <div className="invalid-feedback">{urlErrors.doc}</div>
                  ) : (
                    <div className="form-text">
                      Obligatorio. Debe comenzar con <code>https://docs.google.com/</code>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="driveUrlInput" className="form-label fw-semibold">
                    Carpeta de Google Drive (Opcional)
                  </label>
                  <input
                    id="driveUrlInput"
                    type="url"
                    className={`form-control ${urlErrors.drive ? 'is-invalid' : ''}`}
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveFolderUrl}
                    onChange={(e) => {
                      setDriveFolderUrl(e.target.value);
                      if (urlErrors.drive) setUrlErrors((prev) => ({ ...prev, drive: undefined }));
                    }}
                  />
                  {urlErrors.drive ? (
                    <div className="invalid-feedback">{urlErrors.drive}</div>
                  ) : (
                    <div className="form-text">
                      Opcional. Si se incluye, debe comenzar con <code>https://drive.google.com/</code>
                    </div>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="submit"
                    className="btn-trabajo-primary d-inline-flex align-items-center gap-2"
                    disabled={submitting}
                  >
                    <FaCloudArrowUp size={16} />
                    {submitting
                      ? 'Guardando...'
                      : work
                      ? 'Actualizar Enlaces'
                      : 'Registrar Entrega'}
                  </button>
                  {work && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setDocumentUrl(work.documentUrl || '');
                        setDriveFolderUrl(work.driveFolderUrl || '');
                        setUrlErrors({});
                      }}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDeliveries;

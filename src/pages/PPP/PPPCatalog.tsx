import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaIdCard,
  FaMagnifyingGlass,
  FaEllipsisVertical,
  FaArrowRotateLeft,
} from 'react-icons/fa6';
import {
  fetchPPPProposals,
  selectPPPProposals,
} from '../../../redux/slices/pppSlice';
import { PPPProposal, pppService } from '../../services/pppService';
import { showToast } from '../../utils/toast';
import Pagination from '../../components/Pagination';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../Teacher/TeacherProjectsList.css';

/**
 * Catálogo de PPP con el estilo institucional de Gestión de TFI:
 * listado general de prácticas profesionales únicas registradas,
 * con su descripción, vigencia y menú de acciones.
 */
export const PPPCatalog: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const proposals = useSelector(selectPPPProposals) as PPPProposal[];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'open' | 'closed'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeDropdownId, setActiveDropdownId] = useState<string | number | null>(null);
  const [editingProposal, setEditingProposal] = useState<PPPProposal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDriveUrl, setEditDriveUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    dispatch(fetchPPPProposals());
  }, [dispatch]);

  const filteredProposals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return proposals.filter((item) => {
      if (filterStatus === 'open' && !item.isOpen) return false;
      if (filterStatus === 'closed' && item.isOpen) return false;
      if (q) {
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        if (!title.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [proposals, searchQuery, filterStatus]);

  const totalItems = filteredProposals.length;
  const paginatedProposals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProposals.slice(startIndex, startIndex + pageSize);
  }, [filteredProposals, currentPage, pageSize]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('ALL');
    setCurrentPage(1);
  };

  const handleOpenEdit = (proposal: PPPProposal) => {
    setEditingProposal(proposal);
    setEditTitle(proposal.title || '');
    setEditDescription(proposal.description || '');
    setEditDriveUrl(proposal.driveFolderUrl || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      showToast('El título y la descripción son obligatorios.', 'error');
      return;
    }

    const token = localStorage.getItem('token') || '';
    if (!token) {
      showToast('Sesión no válida o expirada.', 'error');
      return;
    }

    setSavingEdit(true);
    try {
      await pppService.updateProposal(
        editingProposal.id,
        {
          title: editTitle,
          description: editDescription,
          driveFolderUrl: editDriveUrl,
        },
        token
      );
      showToast('Propuesta PPP actualizada correctamente.', 'success');
      setEditingProposal(null);
      dispatch(fetchPPPProposals());
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar la propuesta PPP.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProposal = async (proposal: PPPProposal) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la propuesta "${proposal.title}"? Esta acción es definitiva.`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token') || '';
      await pppService.deleteProposal(proposal.id, token);
      showToast('Propuesta PPP eliminada correctamente.', 'success');
      dispatch(fetchPPPProposals());
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar la propuesta PPP.', 'error');
    }
  };

  return (
    <div className="projects-page-container">
      <div className="projects-card-main">
        {/* Cabecera */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="m-0 projects-title d-flex align-items-center gap-2">
              <FaIdCard size={26} style={{ color: 'var(--unla-primary, #64001d)' }} />
              <span>Catálogo de PPP</span>
            </h1>
            <p className="m-0 text-muted projects-subtitle">
              Listado general de prácticas profesionales registradas, con su descripción y vigencia.
            </p>
          </div>
        </div>

        {/* Filtros estilo Gestión de TFI */}
        <div className="filters-card">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="search-input-wrapper">
                <span className="search-icon-wrapper text-muted">
                  <FaMagnifyingGlass size={15} />
                </span>
                <input
                  type="text"
                  className="form-control search-input-field"
                  placeholder="Buscar por título o descripción..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select filter-select-field"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as 'ALL' | 'open' | 'closed');
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Vigencia: Todas</option>
                <option value="open">Vigentes</option>
                <option value="closed">Cerradas</option>
              </select>
            </div>
            <div className="col-md-3 d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-clear-filters d-inline-flex align-items-center gap-2"
                onClick={handleClearFilters}
              >
                <FaArrowRotateLeft size={13} />
                <span>Limpiar filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabla estilo Gestión de TFI */}
        <div className="projects-table-wrapper" style={{ flexGrow: 1 }}>
          <table className="table table-striped table-hover m-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th style={{ width: '90px', padding: '12px 16px' }}>Ref</th>
                <th style={{ width: '28%', padding: '12px 16px' }}>Práctica (PPP)</th>
                <th style={{ padding: '12px 16px' }}>Descripción</th>
                <th style={{ width: '140px', padding: '12px 16px' }}>Vigencia</th>
                <th style={{ width: '90px', padding: '12px 16px', textAlign: 'center' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedProposals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No hay prácticas PPP registradas que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedProposals.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: '12px 16px' }} className="text-muted fw-semibold">
                      #{item.id}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge-project-type-ppp me-2">PPP</span>
                      <span className="fw-bold text-dark">{item.title}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <p className="project-description-text mb-0">
                        {item.description || 'Sin descripción.'}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`teacher-status-pill ${item.isOpen ? 'curso' : 'finalizado'
                          }`}
                      >
                        <span className="status-dot" />
                        <span>{item.isOpen ? 'Vigente' : 'Cerrada'}</span>
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div className="d-inline-flex align-items-center justify-content-center">
                        <div className="actions-dropdown-wrapper">
                          <button
                            type="button"
                            className={`btn-actions-trigger d-flex align-items-center justify-content-center ${activeDropdownId === item.id ? 'active' : ''
                              }`}
                            onClick={() =>
                              setActiveDropdownId(
                                activeDropdownId === item.id ? null : item.id
                              )
                            }
                            title="Acciones"
                          >
                            <FaEllipsisVertical size={15} />
                          </button>

                          {activeDropdownId === item.id && (
                            <>
                              <div
                                className="dropdown-click-outside-backdrop"
                                onClick={() => setActiveDropdownId(null)}
                              />
                              <ul className="custom-dropdown-menu dropdown-menu-end">
                                <button
                                  type="button"
                                  className="custom-dropdown-item fw-semibold"
                                  style={{ color: 'var(--unla-primary, #64001d)' }}
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    navigate(`/ppp/convocatorias/${item.id}/postulaciones`);
                                  }}
                                >
                                  Ver postulantes
                                </button>
                                <li className="dropdown-divider" style={{ margin: '4px 0' }} />
                                <button
                                  type="button"
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleOpenEdit(item);
                                  }}
                                >
                                  Editar PPP
                                </button>
                                <li className="dropdown-divider" style={{ margin: '4px 0' }} />
                                <button
                                  type="button"
                                  className="custom-dropdown-item text-danger"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleDeleteProposal(item);
                                  }}
                                >
                                  Eliminar PPP
                                </button>
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            pageSizeOptions={[5, 10, 20]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Modal: Editar PPP */}
      {editingProposal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px' }}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Editar PPP</h5>
                <button
                  type="button"
                  className="btn-close"
                  disabled={savingEdit}
                  onClick={() => setEditingProposal(null)}
                />
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body px-4 py-3 d-flex flex-column gap-3">
                  <div>
                    <label className="form-label small fw-semibold text-dark">Título *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-dark">Descripción *</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-dark">
                      Enlace a carpeta de Google Drive (opcional)
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={editDriveUrl}
                      onChange={(e) => setEditDriveUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-light border"
                    disabled={savingEdit}
                    onClick={() => setEditingProposal(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-unla-primary"
                    disabled={savingEdit}
                  >
                    {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPPCatalog;

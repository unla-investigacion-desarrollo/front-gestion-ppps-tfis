import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaIdCard,
  FaPlus,
  FaFolder,
  FaMagnifyingGlass,
  FaTableList,
  FaTableCellsLarge,
} from 'react-icons/fa6';
import { usePPPProposals, CreateProposalFormData } from '../../hooks/usePPPProposals';
import {
  PPPProposalsTable,
  PPPProposalsCards,
  PPPCreateProposalModal,
  PPPApplyModal,
  PPPApplicantsModal,
  PPPDriveModal,
  PPPAppliedFeedbackModal,
  PPPCloseProposalModal,
  PPPDeleteProposalModal,
  PPPExternalProposalModal,
  PPPEditProposalModal,
  PPPHowItWorks,
} from './components';
import { PPPProposal, pppService } from '../../services/pppService';
import { fetchPPPProposals } from '../../../redux/slices/pppSlice';
import { showToast } from '../../utils/toast';
import './PPP.css';

export const PPPProposalsCatalog: React.FC = () => {
  const {
    isStudent,
    isTutor,
    canManageApplicants,
    proposals,
    appliedProposalIds,
    searchQuery,
    setSearchQuery,
    filterState,
    setFilterState,
    viewMode,
    setViewMode,
    filteredProposals,
    actionLoading,
    showCreateModal,
    setShowCreateModal,
    createForm,
    setCreateForm,
    showApplyModal,
    setShowApplyModal,
    selectedProposalToApply,
    setSelectedProposalToApply,
    previousKnowledge,
    setPreviousKnowledge,
    appliedFeedback,
    setAppliedFeedback,
    showApplicantsModal,
    setShowApplicantsModal,
    selectedProposalApplicants,
    setSelectedProposalApplicants,
    showDriveModal,
    setShowDriveModal,
    showExternalProposalModal,
    setShowExternalProposalModal,
    driveInput,
    setDriveInput,
    handleToggleOpenStatus,
    handleCreateProposalSubmit,
    handleApplySubmit,
    handleCreateExternal,
    handleConfirmCreateExternal,
    handleUpdateDriveSubmit,
    handleApplicantAction,
    handleNavigateToApplicantsPage,
    handleViewTramite,
  } = usePPPProposals();

  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [proposalToClose, setProposalToClose] = useState<PPPProposal | null>(null);
  const [proposalToDelete, setProposalToDelete] = useState<PPPProposal | null>(null);
  const [deletingProposal, setDeletingProposal] = useState<boolean>(false);
  const [editingProposal, setEditingProposal] = useState<PPPProposal | null>(null);
  const [editForm, setEditForm] = useState<CreateProposalFormData>({
    title: '',
    description: '',
    driveFolderUrl: '',
  });
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const handleOpenEdit = (proposalItem: PPPProposal) => {
    setEditingProposal(proposalItem);
    setEditForm({
      title: proposalItem.title || '',
      description: proposalItem.description || '',
      driveFolderUrl: proposalItem.driveFolderUrl || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal) return;
    if (!editForm.title.trim() || !editForm.description.trim()) {
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
          title: editForm.title,
          description: editForm.description,
          driveFolderUrl: editForm.driveFolderUrl,
        },
        token
      );
      showToast('Propuesta PPP actualizada correctamente.', 'success');
      setEditingProposal(null);
      await dispatch(fetchPPPProposals({ isStudent }));
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar la propuesta PPP.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProposal = (proposalItem: PPPProposal) => {
    setProposalToDelete(proposalItem);
  };

  const handleConfirmDeleteProposal = async () => {
    if (!proposalToDelete) return;
    setDeletingProposal(true);
    try {
      const token = localStorage.getItem('token') || '';
      await pppService.deleteProposal(proposalToDelete.id, token);
      showToast('Propuesta PPP eliminada correctamente.', 'success');
      setProposalToDelete(null);
      await dispatch(fetchPPPProposals({ isStudent }));
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar la propuesta PPP.', 'error');
    } finally {
      setDeletingProposal(false);
    }
  };

  const handleSwitchStatus = (proposalItem: PPPProposal) => {
    if (proposalItem.isOpen) {
      setProposalToClose(proposalItem);
      return;
    }
    handleToggleOpenStatus(proposalItem);
  };

  const handleConfirmCloseProposal = async () => {
    if (!proposalToClose) return;
    await handleToggleOpenStatus(proposalToClose);
    setProposalToClose(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterState]);

  const getPendingApplicantsCount = (proposalItem: any): number => {
    const rawApplicants = Array.isArray(proposalItem.applicants)
      ? proposalItem.applicants
      : Array.isArray(proposalItem.applications)
        ? proposalItem.applications
        : null;
    if (rawApplicants) {
      return rawApplicants.filter(
        (app: any) =>
          !app?.status ||
          app.status === 'pending_application' ||
          app.status === 'pending'
      ).length;
    }
    return (
      proposalItem.pendingApplicantsCount ??
      proposalItem.applicantsCount ??
      proposalItem.applicationsCount ??
      proposalItem._count?.applications ??
      proposalItem._count?.applicants ??
      0
    );
  };

  const sortedProposals = useMemo(() => {
    return [...filteredProposals].sort(
      (a, b) => getPendingApplicantsCount(b) - getPendingApplicantsCount(a)
    );
  }, [filteredProposals]);

  const totalItems = sortedProposals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedProposals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedProposals.slice(startIndex, startIndex + pageSize);
  }, [sortedProposals, currentPage, pageSize]);

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
              <h1 className="ppp-title">Gestión de Convocatorias y Postulaciones PPP</h1>
              <p className="ppp-subtitle">
                {isStudent
                  ? 'Explorá las convocatorias de Prácticas Profesionales Supervisadas abiertas y postulate o gestioná una práctica externa.'
                  : 'Gestión académica de propuestas internas de PPP, control de convocatorias y postulaciones.'}
              </p>
            </div>
          </div>

          <div className="ppp-header-actions">
            {isStudent ? (
              <button
                type="button"
                className="btn-unla-primary d-inline-flex align-items-center gap-1"
                onClick={handleCreateExternal}
                disabled={actionLoading}
              >
                <FaPlus size={14} />
                Iniciar trámite externo
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-unla-outline d-inline-flex align-items-center gap-1"
                  onClick={() => setShowDriveModal(true)}
                >
                  <FaFolder size={14} />
                  Drive institucional
                </button>
                <button
                  type="button"
                  className="btn-unla-primary d-inline-flex align-items-center gap-1"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FaPlus size={14} />
                  Crear propuesta
                </button>
              </>
            )}
          </div>
        </div>

        {isStudent && <PPPHowItWorks highlightStep={1} />}

        {/* Barra de Búsqueda y Filtros */}
        <div className="ppp-filter-card">
          <div className="ppp-search-box">
            <span className="ppp-search-icon">
              <FaMagnifyingGlass size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por título, temática o palabras clave..."
              value={searchQuery}
              onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
            />
          </div>

          {!isStudent && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small fw-semibold">Estado:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: '160px' }}
                value={filterState}
                onChange={(changeEvent) =>
                  setFilterState(changeEvent.target.value as 'all' | 'open' | 'closed')
                }
              >
                <option value="all">Todas ({proposals.length})</option>
                <option value="open">Solo abiertas</option>
                <option value="closed">Solo cerradas</option>
              </select>
            </div>
          )}

          {/* Alternador de Modo de Vista (Tabla estilo Expedientes vs Cuadrícula de Tarjetas) */}
          <div className="project-join-view-toggle ms-auto">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Vista de tabla (estilo expedientes)"
            >
              <FaTableList size={14} />
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Vista de cuadrícula de tarjetas"
            >
              <FaTableCellsLarge size={14} />
            </button>
          </div>
        </div>

        {/* Listado de Convocatorias: Vista Tabla (Igual a Expedientes) */}
        {viewMode === 'table' ? (
          <PPPProposalsTable
            proposals={paginatedProposals}
            totalItems={totalItems}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            isStudent={isStudent}
            appliedProposalIds={appliedProposalIds}
            canManageApplicants={canManageApplicants}
            isTutor={isTutor}
            actionLoading={actionLoading}
            onToggleOpenStatus={handleSwitchStatus}
            onOpenApplyModal={(proposalItem) => {
              setSelectedProposalToApply(proposalItem);
              setShowApplyModal(true);
            }}
            onOpenApplicantsModal={(proposalItem) => {
              setSelectedProposalApplicants(proposalItem);
              setShowApplicantsModal(true);
            }}
            onNavigateToApplicantsPage={handleNavigateToApplicantsPage}
            onViewProject={(proposalItem) => navigate(`/ppp/catalogo/${proposalItem.id}`)}
            onEditProposal={handleOpenEdit}
            onDeleteProposal={handleDeleteProposal}
          />
        ) : (
          <>
            <PPPProposalsCards
              proposals={paginatedProposals}
              isStudent={isStudent}
              appliedProposalIds={appliedProposalIds}
              canManageApplicants={canManageApplicants}
              isTutor={isTutor}
              actionLoading={actionLoading}
              onToggleOpenStatus={handleSwitchStatus}
              onOpenApplyModal={(proposalItem) => {
                setSelectedProposalToApply(proposalItem);
                setShowApplyModal(true);
              }}
              onOpenApplicantsModal={(proposalItem) => {
                setSelectedProposalApplicants(proposalItem);
                setShowApplicantsModal(true);
              }}
              onNavigateToApplicantsPage={handleNavigateToApplicantsPage}
            />
            {totalItems > 0 && (
              <div className="ppp-pagination-footer rounded-3 border mb-4">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <span>
                    Mostrando {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, totalItems)} de {totalItems} convocatorias
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">Por página:</span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: '72px' }}
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>

                <div className="ppp-pagination-nav">
                  <button
                    type="button"
                    className="ppp-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`ppp-page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="ppp-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modales de Gestión */}
        <PPPCreateProposalModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          createForm={createForm}
          onCreateFormChange={setCreateForm}
          onSubmit={handleCreateProposalSubmit}
          actionLoading={actionLoading}
        />

        <PPPApplyModal
          show={showApplyModal}
          proposal={selectedProposalToApply}
          previousKnowledge={previousKnowledge}
          onPreviousKnowledgeChange={setPreviousKnowledge}
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleApplySubmit}
          actionLoading={actionLoading}
        />

        <PPPApplicantsModal
          show={showApplicantsModal}
          proposal={selectedProposalApplicants}
          onClose={() => setShowApplicantsModal(false)}
          onApplicantAction={handleApplicantAction}
          onNavigateToApplicantsPage={handleNavigateToApplicantsPage}
          actionLoading={actionLoading}
        />

        <PPPDriveModal
          show={showDriveModal}
          driveInput={driveInput}
          onDriveInputChange={setDriveInput}
          onClose={() => setShowDriveModal(false)}
          onSubmit={handleUpdateDriveSubmit}
          actionLoading={actionLoading}
        />

        <PPPExternalProposalModal
          show={showExternalProposalModal}
          onClose={() => setShowExternalProposalModal(false)}
          onConfirm={handleConfirmCreateExternal}
          actionLoading={actionLoading}
        />

        {/* Modal de Confirmación y Seguimiento para Estudiante */}
        <PPPAppliedFeedbackModal
          show={!!appliedFeedback}
          feedback={appliedFeedback}
          onClose={() => setAppliedFeedback(null)}
          onViewTramite={handleViewTramite}
        />

        {/* Modal de Confirmación para Cerrar Convocatoria */}
        <PPPCloseProposalModal
          proposal={proposalToClose}
          onClose={() => setProposalToClose(null)}
          onConfirm={handleConfirmCloseProposal}
          actionLoading={actionLoading}
        />

        {/* Modal para confirmar la eliminación de una propuesta PPP */}
        <PPPDeleteProposalModal
          proposal={proposalToDelete}
          onClose={() => setProposalToDelete(null)}
          onConfirm={handleConfirmDeleteProposal}
          actionLoading={deletingProposal}
        />

        {/* Modal para Editar Propuesta PPP */}
        <PPPEditProposalModal
          proposal={editingProposal}
          form={editForm}
          onFormChange={setEditForm}
          onClose={() => setEditingProposal(null)}
          onSubmit={handleSaveEdit}
          actionLoading={savingEdit}
        />
      </div>
    </div>
  );
};

export default PPPProposalsCatalog;

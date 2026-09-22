import React from 'react';
import {
  FaIdCard,
  FaPlus,
  FaFolder,
  FaMagnifyingGlass,
  FaTableList,
  FaTableCellsLarge,
} from 'react-icons/fa6';
import { usePPPProposals } from '../../hooks/usePPPProposals';
import {
  PPPProposalsTable,
  PPPProposalsCards,
  PPPCreateProposalModal,
  PPPApplyModal,
  PPPApplicantsModal,
  PPPDriveModal,
  PPPAppliedFeedbackModal,
} from './components';
import './PPP.css';

export const PPPProposalsCatalog: React.FC = () => {
  const {
    isAdmin,
    isStudent,
    isTutor,
    canManageApplicants,
    proposals,
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
    driveInput,
    setDriveInput,
    handleToggleOpenStatus,
    handleCreateProposalSubmit,
    handleApplySubmit,
    handleCreateExternal,
    handleUpdateDriveSubmit,
    handleApplicantAction,
    handleNavigateToApplicantsPage,
    handleViewTramite,
  } = usePPPProposals();

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
              <h1 className="ppp-title">Catálogo de Convocatorias PPP</h1>
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
            proposals={filteredProposals}
            isStudent={isStudent}
            canManageApplicants={canManageApplicants}
            isTutor={isTutor}
            actionLoading={actionLoading}
            onToggleOpenStatus={handleToggleOpenStatus}
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
        ) : (
          <PPPProposalsCards
            proposals={filteredProposals}
            isStudent={isStudent}
            canManageApplicants={canManageApplicants}
            isTutor={isTutor}
            actionLoading={actionLoading}
            onToggleOpenStatus={handleToggleOpenStatus}
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

        {/* Modal de Confirmación y Seguimiento para Estudiante */}
        <PPPAppliedFeedbackModal
          show={!!appliedFeedback}
          feedback={appliedFeedback}
          onClose={() => setAppliedFeedback(null)}
          onViewTramite={handleViewTramite}
        />
      </div>
    </div>
  );
};

export default PPPProposalsCatalog;

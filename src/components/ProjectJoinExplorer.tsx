import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFolderOpen, FaCircleCheck, FaArrowRight } from 'react-icons/fa6';
import { useProjectExplorer } from '../hooks/useProjectExplorer';
import {
  ProjectExplorerHeader,
  ProjectExplorerFilters,
  ProjectExplorerTable,
  ProjectExplorerCards,
  ProjectRequestsTable,
} from './ProjectExplorer';
import Pagination from './Pagination';
import './ProjectJoinExplorer.css';

export interface ProjectJoinExplorerProps {
  onJoinSuccess?: (projectId: number | string) => void;
}

/** Ruta de la vista "Mi TFI" del estudiante. */
const goToMyTfi = (navigate: ReturnType<typeof useNavigate>) =>
  navigate('/dashboard', { state: { initialView: 'proyectos' } });

/**
 * Explorador de proyectos del estudiante.
 * La navegación entre "Proyectos disponibles" y "Mis solicitudes" la maneja el sidebar
 * (query param ?tab=all | ?tab=requests); este componente renderiza una sola vista a la vez.
 */
export const ProjectJoinExplorer: React.FC<ProjectJoinExplorerProps> = ({ onJoinSuccess }) => {
  const navigate = useNavigate();
  const {
    allUsers,
    myRequests,
    loading,
    requestingId,
    activeTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pendingProjectIds,
    activeProjectIds,
    activeTfi,
    hasActiveTfi,
    availableCategories,
    filteredProjects,
    paginatedProjects,
    handleJoinProject,
    handleClearFilters,
  } = useProjectExplorer({ onJoinSuccess });

  // =========================================================================
  // VISTA: MIS SOLICITUDES
  // =========================================================================
  if (activeTab === 'requests') {
    return (
      <div className="project-join-container">
        <ProjectExplorerHeader
          title="Mis solicitudes"
          subtitle="Postulaciones a proyectos TFI que están esperando aprobación."
        />
        {loading ? (
          <div className="project-join-loading-state">
            <div className="spinner-border text-primary" role="status" />
            <p>Cargando solicitudes...</p>
          </div>
        ) : (
          <ProjectRequestsTable
            requests={myRequests}
            allUsers={allUsers}
            onExploreClick={() => navigate('/alumno/mis-proyectos?tab=all')}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // VISTA: PROYECTOS DISPONIBLES
  // =========================================================================
  const activeTfiTitle = activeTfi?.project?.title || 'tu proyecto';

  return (
    <div className="project-join-container">
      <ProjectExplorerHeader
        title="Proyectos disponibles"
        subtitle="Explorá los proyectos TFI y postulate al que te interese. Solo podés tener un TFI."
      />

      {/* Aviso: el estudiante ya tiene su TFI asignado */}
      {hasActiveTfi && (
        <div className="project-join-tfi-banner" role="status">
          <FaCircleCheck size={18} className="project-join-tfi-banner-icon" />
          <div className="project-join-tfi-banner-text">
            <strong>Ya tenés un TFI asignado: {activeTfiTitle}.</strong>
            <span>Como solo podés tener un TFI, no es posible postularte a otros proyectos.</span>
          </div>
          <button
            type="button"
            className="btn-action-deliveries"
            onClick={() => goToMyTfi(navigate)}
          >
            <span>Ver mi TFI</span>
            <FaArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Barra de Filtros y Buscador */}
      <ProjectExplorerFilters
        searchQuery={searchQuery}
        onSearchChange={(newQueryText) => {
          setSearchQuery(newQueryText);
          setCurrentPage(1);
        }}
        selectedCategory={selectedCategory}
        onCategoryChange={(newCategorySelection) => {
          setSelectedCategory(newCategorySelection);
          setCurrentPage(1);
        }}
        availableCategories={availableCategories}
        selectedStatus={selectedStatus}
        onStatusChange={(newStatusSelection) => {
          setSelectedStatus(newStatusSelection);
          setCurrentPage(1);
        }}
        onClearFilters={handleClearFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Estado de carga */}
      {loading && (
        <div className="project-join-loading-state">
          <div className="spinner-border text-primary" role="status" />
          <p>Cargando proyectos disponibles del sistema...</p>
        </div>
      )}

      {/* Estado vacío cuando no hay proyectos o los filtros no coinciden */}
      {!loading && filteredProjects.length === 0 && (
        <div className="project-join-empty">
          <FaFolderOpen size={42} className="text-muted mb-3" />
          <h3>No se encontraron proyectos</h3>
          <p>
            {searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
              ? 'No hay resultados que coincidan con los filtros aplicados. Intentá restablecerlos.'
              : 'Aún no hay proyectos registrados disponibles para postularse en el sistema.'}
          </p>
          {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mt-2"
              onClick={handleClearFilters}
            >
              Limpiar filtros de búsqueda
            </button>
          )}
        </div>
      )}

      {/* Vista 1: Tabla Institucional */}
      {!loading && filteredProjects.length > 0 && viewMode === 'table' && (
        <ProjectExplorerTable
          projects={paginatedProjects}
          allUsers={allUsers}
          pendingProjectIds={pendingProjectIds}
          activeProjectIds={activeProjectIds}
          requestingId={requestingId}
          onJoinProject={handleJoinProject}
          canApply={!hasActiveTfi}
        />
      )}

      {/* Vista 2: Cuadrícula de Tarjetas */}
      {!loading && filteredProjects.length > 0 && viewMode === 'cards' && (
        <ProjectExplorerCards
          projects={paginatedProjects}
          allUsers={allUsers}
          pendingProjectIds={pendingProjectIds}
          activeProjectIds={activeProjectIds}
          requestingId={requestingId}
          onJoinProject={handleJoinProject}
          canApply={!hasActiveTfi}
        />
      )}

      {/* Espaciador flexible para empujar la paginación al fondo */}
      <div style={{ flexGrow: 1 }} />

      {/* Controles de Paginación */}
      {!loading && filteredProjects.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredProjects.length}
          pageSize={pageSize}
          onPageChange={(targetPageNumber) => setCurrentPage(targetPageNumber)}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(targetPageSize) => {
            setPageSize(targetPageSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};

export default ProjectJoinExplorer;

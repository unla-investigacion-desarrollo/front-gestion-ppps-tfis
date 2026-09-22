import React from 'react';
import { FaFolderOpen } from 'react-icons/fa6';
import { useProjectExplorer } from '../hooks/useProjectExplorer';
import {
  ProjectExplorerHeader,
  ProjectExplorerTabs,
  ProjectExplorerFilters,
  ProjectExplorerTable,
  ProjectExplorerCards,
  ProjectRequestsTable,
  ProjectActiveTable,
} from './ProjectExplorer';
import Pagination from './Pagination';
import './ProjectJoinExplorer.css';

export interface ProjectJoinExplorerProps {
  onJoinSuccess?: (projectId: number | string) => void;
  title?: string;
  subtitle?: string;
}

/**
 * Componente orquestador del explorador de proyectos y postulaciones.
 * Integra la lógica del hook useProjectExplorer con subcomponentes modulares reutilizables.
 */
export const ProjectJoinExplorer: React.FC<ProjectJoinExplorerProps> = ({
  onJoinSuccess,
  title = 'Proyectos y Postulaciones',
  subtitle = 'Explorá proyectos existentes, postulate para participar y hacé seguimiento de tus solicitudes.',
}) => {
  const {
    allUsers,
    projects,
    myRequests,
    myActiveProjects,
    loading,
    requestingId,
    activeTab,
    setActiveTab,
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
    availableCategories,
    filteredProjects,
    paginatedProjects,
    handleJoinProject,
    handleClearFilters,
  } = useProjectExplorer({ onJoinSuccess });

  return (
    <div className="project-join-container">
      {/* Cabecera institucional con Icon Box */}
      <ProjectExplorerHeader title={title} subtitle={subtitle} />

      {/* Pestañas de navegación institucionales con contadores */}
      <ProjectExplorerTabs
        activeTab={activeTab}
        onSelectTab={(selectedTab) => {
          setActiveTab(selectedTab);
          setCurrentPage(1);
        }}
        totalProjectsCount={projects.length}
        pendingRequestsCount={myRequests.length}
        activeProjectsCount={myActiveProjects.length}
      />

      {/* =========================================================================
          PESTAÑA 1: EXPLORAR PROYECTOS
          ========================================================================= */}
      {activeTab === 'all' && (
        <>
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
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ color: 'var(--unla-primary) !important' }}
              />
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
            />
          )}

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
        </>
      )}

      {/* =========================================================================
          PESTAÑA 2: MIS SOLICITUDES PENDIENTES
          ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="tab-pane-content">
          <ProjectRequestsTable
            requests={myRequests}
            allUsers={allUsers}
            onExploreClick={() => setActiveTab('all')}
          />
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 3: MIS PROYECTOS ACTIVOS
          ========================================================================= */}
      {activeTab === 'active' && (
        <div className="tab-pane-content">
          <ProjectActiveTable
            activeProjects={myActiveProjects}
            allUsers={allUsers}
            onExploreClick={() => setActiveTab('all')}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectJoinExplorer;

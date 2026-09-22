import React from 'react';
import { ExplorerTab } from './types';

export interface ProjectExplorerTabsProps {
  activeTab: ExplorerTab;
  onSelectTab: (selectedTab: ExplorerTab) => void;
  totalProjectsCount: number;
  pendingRequestsCount: number;
  activeProjectsCount: number;
}

/**
 * Pestañas de navegación para el explorador de proyectos, solicitudes y proyectos activos.
 */
export const ProjectExplorerTabs: React.FC<ProjectExplorerTabsProps> = ({
  activeTab,
  onSelectTab,
  totalProjectsCount,
  pendingRequestsCount,
  activeProjectsCount,
}) => {
  return (
    <div className="project-join-tabs">
      <button
        type="button"
        className={`project-join-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
        onClick={() => onSelectTab('all')}
      >
        <span>Explorar Proyectos</span>
        <span className="project-join-tab-counter">{totalProjectsCount}</span>
      </button>

      <button
        type="button"
        className={`project-join-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
        onClick={() => onSelectTab('requests')}
      >
        <span>Mis Solicitudes Pendientes</span>
        {pendingRequestsCount > 0 && (
          <span className="project-join-tab-counter counter-pending">
            {pendingRequestsCount}
          </span>
        )}
      </button>

      <button
        type="button"
        className={`project-join-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
        onClick={() => onSelectTab('active')}
      >
        <span>Mis Proyectos Activos</span>
        {activeProjectsCount > 0 && (
          <span className="project-join-tab-counter counter-active">
            {activeProjectsCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ProjectExplorerTabs;

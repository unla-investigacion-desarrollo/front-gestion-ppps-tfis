import { FaClockRotateLeft } from 'react-icons/fa6';
import ActivityItem from './ActivityItem';

const RecentActivityPanel = ({
  activities,
  isLoading,
  hasError,
  onManageUsers,
}) => {
  return (
    <div className="dashboard-panel-card">
      <div className="panel-card-header">
        <h3 className="panel-card-title d-flex align-items-center gap-2">
          <FaClockRotateLeft size={20} color="var(--unla-primary)" />
          Actividad reciente
        </h3>
        <a
          href="#/"
          onClick={(event) => {
            event.preventDefault();
            onManageUsers();
          }}
          className="panel-card-link"
        >
          Gestionar usuarios →
        </a>
      </div>
      <div className="activity-list">
        {activities.length > 0 ? activities.map((activityItem) => (
          <ActivityItem
            key={activityItem.id}
            title={activityItem.title}
            description={activityItem.description}
            time={activityItem.time}
            badgeText={activityItem.badgeText}
            badgeType={activityItem.badgeType}
            iconTheme={activityItem.iconTheme}
            icon={activityItem.icon}
          />
        )) : (
          <div className="py-4 text-center text-muted small">
            {hasError
              ? 'No se pudo cargar la actividad.'
              : isLoading
                ? 'Cargando actividad...'
                : 'No hay movimientos recientes con fecha disponible.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivityPanel;
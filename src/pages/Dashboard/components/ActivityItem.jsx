import React from 'react';

const ActivityItem = ({ title, description, time, badgeText, badgeType, icon, iconTheme }) => {
  const getBadgeStyles = () => {
    switch (badgeType) {
      case 'activo':
      case 'aprobada':
        return { backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 600 };
      case 'pendiente':
        return { backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 600 };
      case 'curso':
        return { backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 600 };
      case 'inactivo':
        return { backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 600 };
      default:
        return { backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 600 };
    }
  };

  return (
    <div className="activity-item-container d-flex align-items-center justify-content-between py-3 border-bottom-custom">
      <div className="d-flex align-items-start gap-3">
        <div className={`activity-icon-wrapper theme-${iconTheme}`}>
          {icon}
        </div>
        <div className="activity-content">
          <strong className="activity-title d-block">{title}</strong>
          <span className="activity-desc text-muted">{description}</span>
        </div>
      </div>
      <div className="activity-meta d-flex align-items-center gap-3 text-end">
        <span className="activity-time text-muted small">{time}</span>
        {badgeText && (
          <span className="badge activity-badge" style={getBadgeStyles()}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;

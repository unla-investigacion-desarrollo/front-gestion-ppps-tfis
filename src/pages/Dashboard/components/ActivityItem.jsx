import React from 'react';

const ActivityItem = ({ title, description, time, badgeText, badgeType, icon, iconTheme }) => {
  const badgeClass = badgeType ? `activity-badge-${badgeType}` : 'activity-badge-inactivo';

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
          <span className={`badge activity-badge ${badgeClass}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;

import React from 'react';
import { FaChevronRight } from 'react-icons/fa6';

const MetricCard = ({ title, value, trendText, trendDirection, icon, colorTheme, onClick }) => {
  const getTrendClass = () => {
    if (trendDirection === 'up') return 'trend-up';
    if (trendDirection === 'down') return 'trend-down';
    return 'trend-none';
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return '↑';
    if (trendDirection === 'down') return '↓';
    return '→';
  };

  return (
    <div className="metric-card-container" onClick={onClick}>
      <div className="metric-card-body d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div className={`metric-icon-wrapper theme-${colorTheme}`}>
            {icon}
          </div>
          <div className="metric-info">
            <span className="metric-label">{title}</span>
            <div className="metric-value">{value}</div>
            <span className={`metric-trend ${getTrendClass()}`}>
              {getTrendIcon()} {trendText}
            </span>
          </div>
        </div>
        <span className="metric-arrow-link">
          <FaChevronRight size={14} color="var(--unla-muted)" />
        </span>
      </div>
    </div>
  );
};

export default MetricCard;

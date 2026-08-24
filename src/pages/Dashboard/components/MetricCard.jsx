import React from 'react';

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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--unla-muted)" className="bi bi-chevron-right" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </span>
      </div>
    </div>
  );
};

export default MetricCard;

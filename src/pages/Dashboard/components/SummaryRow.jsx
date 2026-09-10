import React from 'react';

const SummaryRow = ({ label, value, theme }) => {
  const bulletThemeClass = theme ? `summary-bullet-${theme}` : '';

  return (
    <div className="summary-row-container d-flex justify-content-between align-items-center py-2 border-bottom-custom-light">
      <div className="d-flex align-items-center gap-2">
        <span className={`summary-bullet ${bulletThemeClass}`} />
        <span className="summary-label">{label}</span>
      </div>
      <strong className="summary-value">{value}</strong>
    </div>
  );
};

export default SummaryRow;

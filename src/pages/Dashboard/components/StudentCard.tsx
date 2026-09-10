import React from 'react';

export interface StudentCardProps {
  title: string;
  description: string;
  colorTheme: 'purple' | 'blue' | 'green' | 'pink' | 'amber';
  icon: React.ReactNode;
  onClick: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  title,
  description,
  colorTheme,
  icon,
  onClick,
}) => {
  return (
    <div
      className="student-feature-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className={`student-card-icon-badge ${colorTheme}`}>
        {icon}
      </div>
      <h3 className="student-card-title">{title}</h3>
      <p className="student-card-desc">{description}</p>
      <div className="student-card-arrow">→</div>
    </div>
  );
};

export default StudentCard;

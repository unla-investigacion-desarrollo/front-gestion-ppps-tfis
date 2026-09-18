import React from 'react';
import { FaGraduationCap } from 'react-icons/fa6';

export interface StudentPromoCardProps {
  title?: string;
  description?: string;
}

export const StudentPromoCard: React.FC<StudentPromoCardProps> = ({
  title = 'Tu futuro académico también es parte de tu proyecto',
  description = 'Estamos para acompañarte en cada paso.',
}) => {
  return (
    <div className="student-future-card">
      <div className="student-future-content">
        <h3 className="student-future-title">{title}</h3>
        <p className="student-future-desc">{description}</p>
      </div>

      <div className="student-future-illustration" aria-hidden="true">
        <FaGraduationCap
          size={72}
          style={{
            color: '#1e40af',
            filter: 'drop-shadow(0 6px 12px rgba(30, 64, 175, 0.25))',
          }}
        />
      </div>
    </div>
  );
};

export default StudentPromoCard;

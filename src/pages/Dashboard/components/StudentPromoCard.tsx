import React from 'react';

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
        <svg
          width="110"
          height="95"
          viewBox="0 0 100 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Destellos / estrellitas */}
          <path
            d="M84 10L86 4L88 10L94 12L88 14L86 20L84 14L78 12L84 10Z"
            fill="#3b82f6"
            opacity="0.75"
          />
          <circle cx="95" cy="24" r="1.5" fill="#3b82f6" opacity="0.6" />
          <circle cx="76" cy="2" r="1" fill="#3b82f6" opacity="0.5" />

          {/* Birrete de graduación (Mortarboard) */}
          <path
            d="M50 18L18 30L50 42L82 30L50 18Z"
            fill="#1e40af"
            stroke="#1e3a8a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Casquete del birrete */}
          <path
            d="M30 35V46C30 46 39 53 50 53C61 53 70 46 70 46V35"
            stroke="#1e3a8a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Borla y cordón */}
          <path
            d="M75 32V44L77 46H73L75 44"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="75" cy="32" r="2.5" fill="#3b82f6" />

          {/* Libro superior */}
          <rect
            x="16"
            y="57"
            width="64"
            height="12"
            rx="3"
            fill="#ffffff"
            stroke="#1e3a8a"
            strokeWidth="2.5"
          />
          <line
            x1="24"
            y1="57"
            x2="24"
            y2="69"
            stroke="#1e3a8a"
            strokeWidth="2"
          />

          {/* Libro inferior */}
          <rect
            x="12"
            y="69"
            width="72"
            height="13"
            rx="3"
            fill="#ffffff"
            stroke="#1e3a8a"
            strokeWidth="2.5"
          />
          <line
            x1="21"
            y1="69"
            x2="21"
            y2="82"
            stroke="#1e3a8a"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
};

export default StudentPromoCard;

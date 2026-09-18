import React from 'react';

export interface TutorProjectStatusPillProps {
  estado: string;
  estadoClass: 'curso' | 'revision' | 'finalizado' | string;
}

/**
 * Componente reutilizable para mostrar el estado de un proyecto del tutor
 * con punto indicador y colores contextuales.
 */
export const TutorProjectStatusPill: React.FC<TutorProjectStatusPillProps> = ({
  estado,
  estadoClass,
}) => {
  return (
    <span className={`teacher-status-pill ${estadoClass}`}>
      <span className="status-dot" />
      <span>{estado}</span>
    </span>
  );
};

export default TutorProjectStatusPill;

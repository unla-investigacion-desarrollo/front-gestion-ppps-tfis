import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaFolderOpen,
  FaListCheck,
  FaCloudArrowUp,
  FaChevronDown,
  FaCircleInfo,
} from 'react-icons/fa6';

export interface TFIHowItWorksProps {
  /** Paso actual a resaltar (1, 2 o 3) según la pantalla en la que se muestra */
  highlightStep?: 1 | 2 | 3;
  /** Si arranca desplegado */
  defaultOpen?: boolean;
}

const steps = [
  {
    number: 1,
    icon: FaFolderOpen,
    title: 'Elegí tu proyecto',
    description:
      'Explorá los proyectos TFI disponibles y postulate al que te interese. Solo podés tener un TFI asignado.',
    link: { to: '/alumno/mis-proyectos?tab=all', label: 'Ver proyectos disponibles' },
  },
  {
    number: 2,
    icon: FaListCheck,
    title: 'Seguí tu solicitud',
    description:
      'Consultá en "Mis solicitudes" si tu postulación fue aceptada o rechazada por el tutor o administración.',
    link: { to: '/alumno/mis-proyectos?tab=requests', label: 'Ir a Mis solicitudes' },
  },
  {
    number: 3,
    icon: FaCloudArrowUp,
    title: 'Entregá tu trabajo',
    description:
      'Una vez asignado, cargá el enlace de tu documento y carpeta de Drive en "Mi proyecto y entregas" para su revisión.',
    link: { to: '/alumno/entregas', label: 'Ir a Mi proyecto y entregas' },
  },
] as const;

export const TFIHowItWorks: React.FC<TFIHowItWorksProps> = ({
  highlightStep,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div className="bg-white rounded-3 border shadow-sm mb-4">
      <button
        type="button"
        className="w-100 d-flex align-items-center justify-content-between bg-transparent border-0 px-4 py-3"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="d-inline-flex align-items-center gap-2 fw-semibold text-dark">
          <FaCircleInfo size={16} style={{ color: '#7a0026' }} />
          ¿Cómo funciona el Proyecto TFI?
        </span>
        <FaChevronDown
          size={12}
          className="text-muted"
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <div className="row g-3">
            {steps.map((step) => {
              const Icon = step.icon;
              const isHighlighted = highlightStep === step.number;
              return (
                <div key={step.number} className="col-12 col-md-4">
                  <div
                    className="h-100 rounded-3 p-3 d-flex flex-column gap-2"
                    style={{
                      border: isHighlighted ? '1px solid #7a0026' : '1px solid #e5e7eb',
                      backgroundColor: isHighlighted ? '#fdf2f5' : '#f9fafb',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold"
                        style={{
                          width: 28,
                          height: 28,
                          fontSize: '0.85rem',
                          backgroundColor: isHighlighted ? '#7a0026' : '#e5e7eb',
                          color: isHighlighted ? '#fff' : '#374151',
                        }}
                      >
                        {step.number}
                      </span>
                      <Icon size={15} style={{ color: '#7a0026' }} />
                      <span className="fw-semibold text-dark">{step.title}</span>
                    </div>
                    <p className="small text-secondary m-0" style={{ lineHeight: 1.5 }}>
                      {step.description}
                    </p>
                    {step.link && !isHighlighted && (
                      <Link
                        to={step.link.to}
                        className="small fw-semibold mt-auto text-decoration-none"
                        style={{ color: '#7a0026' }}
                      >
                        {step.link.label} →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TFIHowItWorks;


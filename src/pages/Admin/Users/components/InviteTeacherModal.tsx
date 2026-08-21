import React from 'react';
import UserForm from './UserForm';

interface InviteTeacherModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  initialRole?: 'DOCENTE' | 'ADMIN';
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
}

const InviteTeacherModal: React.FC<InviteTeacherModalProps> = ({
  isOpen,
  isAdmin,
  initialRole = 'DOCENTE',
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal fade show custom-modal-dialog-wrapper" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content custom-modal-content">
            <div className="modal-header custom-modal-header">
              <h5 className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary)' }}>
                {isAdmin ? 'Crear / Invitar Usuario' : 'Crear / Invitar Docente'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body custom-modal-body">
              <UserForm
                isAdmin={isAdmin}
                initialRole={initialRole}
                onSubmit={async (data) => {
                  await onSubmit(data);
                  onClose();
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="custom-modal-backdrop" />
    </>
  );
};

export default InviteTeacherModal;

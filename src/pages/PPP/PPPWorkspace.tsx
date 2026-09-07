import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import PPPInbox from './PPPInbox';
import PPPProposals from './PPPProposals';
import './PPPWorkspace.css';

const PPPWorkspace: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const roles = useMemo(() => (user?.roles || []).map((role) => String(role).toUpperCase()), [user]);
  const isManager = roles.some((role) => ['DOCENTE', 'PROFESSOR', 'TEACHER', 'ADMIN', 'ADMINISTRADOR'].includes(role));

  if (!isManager) return <PPPProposals />;

  return (
    <div className="ppp-workspace">
      <PPPProposals />
      <PPPInbox />
    </div>
  );
};

export default PPPWorkspace;

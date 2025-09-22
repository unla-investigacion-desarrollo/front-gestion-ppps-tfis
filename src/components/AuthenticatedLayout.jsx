import React from 'react';
import useSessionReminder from '../hooks/useSessionReminder';
import SessionReminderModal from './SessionReminderModal';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import '../styles/unla.css';

const AuthenticatedLayout = ({ children }) => {
  const {
    showReminder,
    timeLeft,
    extendSession,
    handleLogout
  } = useSessionReminder({ inactivityMs: 15 * 1000, reminderSeconds: 15 }); // 15s inactividad, 15s countdown

  const user = useSelector((state) => state.auth.user);
  const isAdmin = !!user && Array.isArray(user.roles) && (
    user.roles.includes('admin') ||
    user.roles.includes('ADMIN') ||
    user.roles.includes('SUPER_ADMIN')
  );

  return (
    <>
      <header className="unla-header">
        <span className="unla-title">Gestión TFI UNLa</span>
        <div className="spacer" />
        <Link to="/dashboard">Inicio</Link>
        {isAdmin && (
          <>
            <Link to="/admin/users">Usuarios</Link>
            <Link to="/admin/approvals">Aprobaciones</Link>
          </>
        )}
        <div style={{ marginLeft: 12, opacity: 0.7 }}>
          {user ? user.email : ''}
        </div>
      </header>
      {children}
      <SessionReminderModal
        isOpen={showReminder}
        timeLeft={timeLeft}
        onExtendSession={extendSession}
        onLogout={handleLogout}
      />
    </>
  );
};

export default AuthenticatedLayout;

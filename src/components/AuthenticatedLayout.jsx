import React from 'react';
import useSessionReminder from '../hooks/useSessionReminder';
import SessionReminderModal from './SessionReminderModal';

const AuthenticatedLayout = ({ children }) => {
  const {
    showReminder,
    timeLeft,
    extendSession,
    handleLogout
  } = useSessionReminder({ inactivityMs: 15 * 1000, reminderSeconds: 15 }); // 15s inactividad, 15s countdown

  return (
    <>
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

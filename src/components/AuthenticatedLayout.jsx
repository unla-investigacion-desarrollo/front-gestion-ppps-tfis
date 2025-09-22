import React, { useEffect, useState } from 'react';
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
  const mustChange = !!user?.mustChangePassword;

  // Simple toast handling (reads sessionStorage 'toast')
  const [toast, setToast] = useState(null);
  useEffect(() => {
    try {
      const msg = sessionStorage.getItem('toast');
      if (msg) {
        setToast({ message: msg, type: 'success' });
        sessionStorage.removeItem('toast');
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
      }
    } catch {}
    const onToast = (e) => {
      const payload = e?.detail || {};
      setToast({ message: payload.message || 'Operación realizada', type: payload.type || 'info' });
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    };
    window.addEventListener('toast', onToast);
    return () => window.removeEventListener('toast', onToast);
  }, []);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 12 }}>
          <span style={{ opacity: 0.7 }}>{user ? user.email : ''}</span>
          {user && (
            <Link
              to="/change-password"
              title={mustChange ? 'Debés cambiar tu contraseña' : 'Cambiar contraseña'}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                background: mustChange ? '#ffebee' : 'var(--unla-surface)',
                border: mustChange ? '1px solid #c62828' : '1px solid var(--unla-border)',
                color: mustChange ? '#b71c1c' : 'inherit',
                fontWeight: 600,
              }}
            >
              🔒 {mustChange ? 'Cambiar contraseña (pendiente)' : 'Cambiar contraseña'}
            </Link>
          )}
        </div>
      </header>
      {children}
      <SessionReminderModal
        isOpen={showReminder}
        timeLeft={timeLeft}
        onExtendSession={extendSession}
        onLogout={handleLogout}
      />
      {toast && (
        <div style={{ position: 'fixed', top: 12, right: 12, background: toast.type === 'error' ? '#c62828' : toast.type === 'info' ? '#1976d2' : '#2e7d32', color: 'white', padding: '10px 14px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000 }}>
          {toast.message}
          <button onClick={() => setToast(null)} style={{ marginLeft: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.6)', color: 'white', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}>Cerrar</button>
        </div>
      )}
    </>
  );
};

export default AuthenticatedLayout;

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
  const displayName = user
    ? [user.nombre, user.apellido].filter(Boolean).join(' ').trim() || user.nombre || user.apellido || user.email || ''
    : '';
  const isAdmin = !!user && Array.isArray(user.roles) && (
    user.roles.includes('admin') ||
    user.roles.includes('ADMIN') ||
    user.roles.includes('SUPER_ADMIN')
  );
  const mustChange = !!user?.mustChangePassword;

  // Toast handling con cola por usuario (localStorage 'userNotifications')
  const [toast, setToast] = useState(null);
  const USER_NOTIFICATIONS_KEY = 'userNotifications';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  };

  const popNextUserNotification = (userId) => {
    try {
      const raw = localStorage.getItem(USER_NOTIFICATIONS_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw) || {};
      const list = Array.isArray(map[userId]) ? map[userId] : [];
      if (list.length === 0) return null;
      const next = list.shift();
      map[userId] = list;
      localStorage.setItem(USER_NOTIFICATIONS_KEY, JSON.stringify(map));
      return next || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // 1) Intentar mostrar lo que venga por sessionStorage (flujo previo)
    try {
      const key = user ? `toast:${user.id}` : 'toast:anon';
      const msg = sessionStorage.getItem(key) || sessionStorage.getItem('toast'); // compatibilidad vieja
      if (msg) {
        showToast(msg, 'success');
        sessionStorage.removeItem(key);
        sessionStorage.removeItem('toast');
      }
    } catch (err) {
      void err;
    }
    // 2) Listener para eventos de toast
    const onToast = (e) => {
      const payload = e?.detail || {};
      showToast(payload.message || 'Operación realizada', payload.type || 'info');
    };
    window.addEventListener('toast', onToast);
    return () => window.removeEventListener('toast', onToast);
  }, [user]);

  // Cuando no hay un toast visible, intentar sacar el próximo de la cola del usuario
  useEffect(() => {
    if (!toast && user?.id) {
      const nextMsg = popNextUserNotification(user.id);
      if (nextMsg) {
        showToast(nextMsg, 'success');
      }
    }
  }, [toast, user]);

  return (
    <>
      <header className="unla-header">
        <span className="unla-title">{`Bienvenido${displayName ? ' ' + displayName : ''}`}</span>
        <div className="spacer" />
        <Link to="/dashboard">Inicio</Link>
        {(isAdmin || user?.roles?.includes('DOCENTE')) && (
          <>
            <Link to="/admin/proposals">Propuestas</Link>
            <Link to="/docente/proyectos">Proyectos</Link>
            <Link to="/docente/entregas">Entregas</Link>
          </>
        )}
        {isAdmin && (
          <>
            <Link to="/admin/users">Usuarios</Link>
            <Link to="/admin/approvals">Aprobaciones</Link>
            <Link to="/admin/outbox">Outbox</Link>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 12 }}>
          {user && !displayName && (
            <span style={{ opacity: 0.7 }}>{user.email}</span>
          )}
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

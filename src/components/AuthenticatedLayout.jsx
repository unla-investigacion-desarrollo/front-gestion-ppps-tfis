import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Campus-Virtual-UNLa.png';
import '../styles/unla.css';

const AuthenticatedLayout = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const displayName = user
    ? [user.nombre, user.apellido].filter(Boolean).join(' ').trim() || user.nombre || user.apellido || user.email || ''
    : '';
  const rawRoles = Array.isArray(user?.roles) ? [...user.roles] : user?.roles ? [user.roles] : [];
  if (user?.rol) rawRoles.push(user.rol);
  const normalizedRoles = rawRoles.map((r) => String(r).toUpperCase().trim());
  const isAdmin = normalizedRoles.some((r) => ['ADMIN', 'ADMINISTRADOR'].includes(r));
  const isTeacher = normalizedRoles.some((r) => ['DOCENTE', 'TEACHER', 'PROFESSOR', 'ADMIN', 'ADMINISTRADOR'].includes(r));
  const mustChange = !!user?.mustChangePassword;

  // Toast handling con cola por usuario (localStorage 'userNotifications')
  const [toast, setToast] = useState(null);
  const [progress, setProgress] = useState(1); // 1 => 100%
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const USER_NOTIFICATIONS_KEY = 'userNotifications';

  const showToast = (message, type = 'success') => {
    // Limpiar timers previos
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setToast({ message, type });
    const duration = 25000; // 25s
    const start = Date.now();
    setProgress(1);

    // Barra de progreso decreciente
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.max(0, 1 - elapsed / duration);
      setProgress(p);
      if (elapsed >= duration) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 100);

    // Autocierre al finalizar
    timerRef.current = setTimeout(() => {
      setToast(null);
      setProgress(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, duration);

    // Devuelve cleanup del toast concreto
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      timerRef.current = null;
      intervalRef.current = null;
    };
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
    return () => {
      window.removeEventListener('toast', onToast);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
        <div className="unla-header-brand">
          <img src={logo} alt="UNLa Logo" className="unla-header-logo" />
          <span className="unla-header-title">Gestión de TFI</span>
        </div>
        <div className="spacer" />
        <nav className="unla-nav-links">
          <NavLink to="/dashboard">Inicio</NavLink>
          {(isAdmin || isTeacher) && (
            <>
              <NavLink to="/admin/proposals">Propuestas</NavLink>
              <NavLink to="/docente/proyectos">Proyectos</NavLink>
              <NavLink to="/docente/entregas">Entregas</NavLink>
            </>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin/users">Usuarios</NavLink>
              <NavLink to="/admin/approvals">Aprobaciones</NavLink>
            </>
          )}
        </nav>
        {user && (
          <div className="profile-dropdown-container" ref={dropdownRef}>
            <button
              className="profile-dropdown-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              type="button"
            >
              <div className="profile-dropdown-avatar">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span>{user.email}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>
            <ul className={`profile-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
              <li>
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/change-password');
                  }}
                  type="button"
                >
                  Cambiar contraseña
                </button>
              </li>
              <div className="profile-dropdown-divider" />
              <li>
                <button
                  className="profile-dropdown-item"
                  onClick={handleLogoutClick}
                  type="button"
                >
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </div>
        )}
      </header>
      {children}
      {toast && (
        <div
          onClick={() => {
            setToast(null);
            setProgress(0);
            if (timerRef.current) clearTimeout(timerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            timerRef.current = null;
            intervalRef.current = null;
          }}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: toast.type === 'error' ? '#fff5f5' : toast.type === 'info' ? '#f0f7ff' : '#f0fff6',
            color: toast.type === 'error' ? '#842029' : toast.type === 'info' ? '#084298' : '#146c43',
            padding: '14px 16px 12px',
            border: `1px solid ${toast.type === 'error' ? '#f1aeb5' : toast.type === 'info' ? '#9ec5fe' : '#a3cfbb'}`,
            borderLeft: `5px solid ${toast.type === 'error' ? '#dc3545' : toast.type === 'info' ? '#0d6efd' : '#198754'}`,
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
            zIndex: 1000,
            cursor: 'pointer',
            minWidth: 320,
            maxWidth: 'min(420px, calc(100vw - 40px))',
          }}
          title="Click para cerrar"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span
              aria-hidden="true"
              style={{
                width: 24,
                height: 24,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: toast.type === 'error' ? '#dc3545' : toast.type === 'info' ? '#0d6efd' : '#198754',
                color: '#fff',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {toast.type === 'error' ? '!' : toast.type === 'info' ? 'i' : '✓'}
            </span>
            <div style={{ flex: 1, lineHeight: 1.4 }}>
              <strong style={{ display: 'block', marginBottom: 2 }}>
                {toast.type === 'error' ? 'No se pudo completar' : toast.type === 'info' ? 'Información' : 'Operación exitosa'}
              </strong>
              <span>{toast.message}</span>
            </div>
            <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1, opacity: 0.55 }}>×</span>
          </div>
          <div style={{ width: '100%', height: 3, background: 'rgba(0,0,0,0.12)', borderRadius: 999, overflow: 'hidden', marginTop: 12 }}>
            <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: toast.type === 'error' ? '#dc3545' : toast.type === 'info' ? '#0d6efd' : '#198754', transition: 'width 100ms linear' }} />
          </div>
        </div>
      )}
    </>
  );
};

export default AuthenticatedLayout;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword } from '../../../redux/slices/usersSlice';
import { selectCurrentUser, setMustChangePassword } from '../../../redux/slices/authSlice';
import './ChangePassword.css';
import bgImage from '../../assets/unla-edificio.jpg';

const ChangePassword = () => {
  const user = useSelector(selectCurrentUser) as any;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Password live checks
  const pw = form.newPassword || '';
  const hasLen = pw.length >= 6;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const checksPassed = [hasLen, hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const strength = checksPassed <= 2 ? 'weak' : checksPassed === 3 ? 'medium' : 'strong';
  const confirmMatches = !!form.confirmPassword && form.newPassword === form.confirmPassword;

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (!form.newPassword || form.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      const res = await dispatch<any>(changePassword({ id: user.id, currentPassword: form.currentPassword, newPassword: form.newPassword }));
      if (res && res.error) {
        setError(res.payload || 'Error al cambiar la contraseña');
        return;
      }
      dispatch(setMustChangePassword(false));
      setOk('Contraseña actualizada correctamente.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      try {
        const key = user ? `toast:${user.id}` : 'toast:anon';
        sessionStorage.setItem(key, 'Contraseña actualizada correctamente');
      } catch { }
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (e: any) {
      setError(e?.message || 'Error al cambiar la contraseña');
    }
  };

  return (
    <div
      className="change-password-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="change-password-overlay" />

      <div className="change-password-card">
        <h1 className="change-password-title">Cambiar contraseña</h1>

        {user?.mustChangePassword ? (
          <div className="change-password-alert info">
            Debés cambiar tu contraseña predeterminada para continuar.
          </div>
        ) : (
          <p className="change-password-subtitle">
            Ingresá tus datos para actualizar tus credenciales de acceso.
          </p>
        )}

        {error && <div className="change-password-alert error">{error}</div>}
        {ok && <div className="change-password-alert success">{ok}</div>}

        <form className="unla-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="current-pw-input">Contraseña actual</label>
            <div style={{ position: 'relative' }}>
              <input
                id="current-pw-input"
                className="login-input"
                type={show.current ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.currentPassword}
                onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                required
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                aria-label={show.current ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                title={show.current ? 'Ocultar' : 'Mostrar'}
                onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                className="password-toggle-btn"
              >
                {show.current ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-pw-input">Nueva contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="new-pw-input"
                className="login-input"
                type={show.next ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.newPassword}
                onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                required
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                aria-label={show.next ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                title={show.next ? 'Ocultar' : 'Mostrar'}
                onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                className="password-toggle-btn"
              >
                {show.next ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>


          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-pw-input">Confirmar nueva contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm-pw-input"
                className="login-input"
                type={show.confirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                aria-label={show.confirm ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                title={show.confirm ? 'Ocultar' : 'Mostrar'}
                onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                className="password-toggle-btn"
              >
                {show.confirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {form.confirmPassword && (
              <div className={`confirm-hint-box ${confirmMatches ? 'valid' : 'invalid'}`}>
                {confirmMatches ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} style={{ marginRight: 2 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Las contraseñas coinciden</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} style={{ marginRight: 2 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Las contraseñas no coinciden</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="change-password-buttons">
            <button className="btn-save-pw" type="submit">Guardar</button>
            <button
              type="button"
              className="btn-cancel-pw"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;

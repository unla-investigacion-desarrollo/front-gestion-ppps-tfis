import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCheck, FaXmark } from 'react-icons/fa6';
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
                  <FaEyeSlash size={18} />
                ) : (
                  <FaEye size={18} />
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
                  <FaEyeSlash size={18} />
                ) : (
                  <FaEye size={18} />
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
                  <FaEyeSlash size={18} />
                ) : (
                  <FaEye size={18} />
                )}
              </button>
            </div>
            {form.confirmPassword && (
              <div className={`confirm-hint-box ${confirmMatches ? 'valid' : 'invalid'}`}>
                {confirmMatches ? (
                  <>
                    <FaCheck size={14} style={{ marginRight: 4 }} />
                    <span>Las contraseñas coinciden</span>
                  </>
                ) : (
                  <>
                    <FaXmark size={12} style={{ marginRight: 4 }} />
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

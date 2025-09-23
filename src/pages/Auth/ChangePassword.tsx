import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword } from '../../../redux/slices/usersSlice';
import { selectCurrentUser, setMustChangePassword } from '../../../redux/slices/authSlice';
import '../../styles/unla.css';

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
      } catch {}
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (e: any) {
      setError(e?.message || 'Error al cambiar la contraseña');
    }
  };

  return (
    <div className="unla-page" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="unla-card" style={{ width: '100%', maxWidth: 560 }}>
        <h1>Cambiar contraseña</h1>
        {user?.mustChangePassword && (
          <div className="unla-hint" style={{ marginBottom: 8 }}>
            Debés cambiar tu contraseña para continuar.
          </div>
        )}
        {error && <div className="unla-hint error" style={{ marginBottom: 8 }}>{error}</div>}
        {ok && <div className="unla-hint" style={{ marginBottom: 8, color: '#2e7d32' }}>{ok}</div>}
        <form className="unla-form" onSubmit={handleSubmit}>
          <div style={{ position: 'relative' }}>
            <input
              className="unla-input"
              type={show.current ? 'text' : 'password'}
              placeholder="Contraseña actual"
              value={form.currentPassword}
              onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
              required
            />
            <button type="button" title={show.current ? 'Ocultar' : 'Mostrar'} onClick={() => setShow((s) => ({ ...s, current: !s.current }))} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>{show.current ? '🙈' : '👁️'}</button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="unla-input"
              type={show.next ? 'text' : 'password'}
              placeholder="Nueva contraseña (min 6)"
              value={form.newPassword}
              onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
              required
            />
            <button type="button" title={show.next ? 'Ocultar' : 'Mostrar'} onClick={() => setShow((s) => ({ ...s, next: !s.next }))} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>{show.next ? '🙈' : '👁️'}</button>
          </div>
          <div aria-live="polite" style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ height: 6, flex: 1, borderRadius: 4, background: strength === 'weak' ? '#ffcdd2' : strength === 'medium' ? '#ffe0b2' : '#c8e6c9' }} />
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                {strength === 'weak' ? 'Débil' : strength === 'medium' ? 'Media' : 'Fuerte'}
              </span>
            </div>
            <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <li style={{ color: hasLen ? '#2e7d32' : '#c62828', fontSize: 12 }}>{hasLen ? '✔' : '✖'} Mínimo 6 caracteres</li>
              <li style={{ color: hasLower ? '#2e7d32' : '#c62828', fontSize: 12 }}>{hasLower ? '✔' : '✖'} Minúscula</li>
              <li style={{ color: hasUpper ? '#2e7d32' : '#c62828', fontSize: 12 }}>{hasUpper ? '✔' : '✖'} Mayúscula</li>
              <li style={{ color: hasNumber ? '#2e7d32' : '#c62828', fontSize: 12 }}>{hasNumber ? '✔' : '✖'} Número</li>
              <li style={{ color: hasSpecial ? '#2e7d32' : '#c62828', fontSize: 12 }}>{hasSpecial ? '✔' : '✖'} Símbolo</li>
            </ul>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="unla-input"
              type={show.confirm ? 'text' : 'password'}
              placeholder="Confirmar nueva contraseña"
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
            />
            <button type="button" title={show.confirm ? 'Ocultar' : 'Mostrar'} onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>{show.confirm ? '🙈' : '👁️'}</button>
          </div>
          <div aria-live="polite" className="unla-hint" style={{ marginTop: 6, color: confirmMatches ? '#2e7d32' : '#c62828' }}>
            {form.confirmPassword ? (confirmMatches ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden') : 'Repetí la nueva contraseña'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="unla-btn" type="submit">Guardar</button>
            <button
              type="button"
              className="unla-btn"
              onClick={() => navigate('/dashboard')}
              style={{ background: '#777' }}
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

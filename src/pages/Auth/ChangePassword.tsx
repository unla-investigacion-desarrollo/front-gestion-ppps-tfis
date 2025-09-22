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
        sessionStorage.setItem('toast', 'Contraseña actualizada correctamente');
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
          <button className="unla-btn" type="submit">Guardar</button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;

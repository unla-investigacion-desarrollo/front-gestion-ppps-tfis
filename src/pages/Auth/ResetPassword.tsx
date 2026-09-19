import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaTriangleExclamation } from "react-icons/fa6";
import { authService } from "../../services/authService";
import "./ResetPassword.css";
import logo from "../../assets/logo.png";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCaps = e.getModifierState && e.getModifierState("CapsLock");
    setCapsLockOn(!!isCaps);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(
        "El enlace de restablecimiento es inválido o no contiene un token.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword({ token, newPassword });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al restablecer la contraseña");
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Ocurrió un error inesperado al conectar con el servidor",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* Panel visual izquierdo */}
      <div className="login-visual-panel">
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <img src={logo} alt="Logo UNLa" className="login-visual-logo" />
          <h2 className="login-visual-subtitle">
            Plataforma de Gestión de PPS y TFI
          </h2>
        </div>
      </div>

      {/* Panel derecho del formulario */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="login-mobile-logo-container">
            <img src={logo} alt="Logo UNLa" className="login-mobile-logo" />
          </div>

          <h1 className="login-title">Nueva contraseña</h1>
          <p className="login-subtitle-helper">
            Ingresá tu nueva clave para acceder nuevamente a la plataforma
          </p>

          {error && <div className="error-message">{error}</div>}

          {success ? (
            <div className="success-message">
              ¡Contraseña restablecida con éxito! Redirigiendo a inicio de
              sesión...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="unla-form">
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">
                  Nueva Contraseña
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="••••••••"
                    className="login-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyUp={handlePasswordKey}
                    onKeyDown={handlePasswordKey}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="password-toggle-btn"
                    title={showPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">
                  Confirmar Contraseña
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    className="login-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyUp={handlePasswordKey}
                    onKeyDown={handlePasswordKey}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="password-toggle-btn"
                    title={showConfirmPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>

                {capsLockOn && (
                  <div className="caps-lock-warning">
                    <FaTriangleExclamation size={14} className="warning-icon" />
                    <span>Mayúsculas activadas (Caps Lock)</span>
                  </div>
                )}
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? (
                  <span className="spinner-loading">Restableciendo...</span>
                ) : (
                  "Restablecer contraseña"
                )}
              </button>
            </form>
          )}

          <div className="login-links-container">
            <div className="login-link-item">
              <Link to="/login" className="login-link">
                ← Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

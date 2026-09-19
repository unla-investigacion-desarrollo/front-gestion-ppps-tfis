import { useDispatch, useSelector } from "react-redux";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaTriangleExclamation } from "react-icons/fa6";
import {
  loginUser,
  selectAuthError,
  selectAuthLoading,
} from "../../../redux/slices/authSlice";
import "./Login.css";
import logo from "../../assets/logo.png";

interface LoginCredentials {
  email: string;
  password: string;
}

function LoginForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const error = useSelector(selectAuthError) as string | null;
  const loading = useSelector(selectAuthLoading);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await dispatch(loginUser(credentials) as any).unwrap();
      navigate("/dashboard");
    } catch (err) {
      console.error("Error en login:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCaps = e.getModifierState && e.getModifierState("CapsLock");
    setCapsLockOn(!!isCaps);
  };

  return (
    <div className="login-split-container">
      {/* Panel izquierdo con la imagen y el branding */}
      <div className="login-visual-panel">
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <img src={logo} alt="Logo UNLa" className="login-visual-logo" />
          <h2 className="login-visual-subtitle">
            Plataforma de Gestión de PPS y TFI
          </h2>
        </div>
      </div>

      {/* Panel derecho con el formulario */}
      <div className="login-form-panel">
        <div className="login-form-wrapper">
          {/* Logo visible en mobile cuando se oculta el panel izquierdo */}
          <div className="login-mobile-logo-container">
            <img src={logo} alt="Logo UNLa" className="login-mobile-logo" />
          </div>

          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle-helper">
            Ingresá tus credenciales para acceder a la plataforma
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="unla-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">
                Correo electrónico
              </label>
              <input
                id="email-input"
                type="email"
                name="email"
                placeholder="nombre@ejemplo.com"
                className="login-input"
                value={credentials.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password-input">
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  className="login-input"
                  value={credentials.password}
                  onChange={handleChange}
                  onKeyUp={handlePasswordKey}
                  onKeyDown={handlePasswordKey}
                  required
                  aria-label="Contraseña"
                  style={{ paddingRight: "45px" }}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  onClick={() => setShowPassword((s) => !s)}
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
              {capsLockOn && (
                <div className="caps-lock-warning">
                  <FaTriangleExclamation
                    size={14}
                    style={{ marginRight: "4px", flexShrink: 0 }}
                  />
                  <span>Mayúsculas activadas (Caps Lock)</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading === "pending"}
            >
              {loading === "pending" ? (
                <span className="spinner-loading">Iniciando sesión...</span>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <div className="login-links-container">
            <div className="login-link-item">
              ¿Sos estudiante y todavía no tenés cuenta?{" "}
              <Link to="/register" className="login-link">
                Registrate aquí
              </Link>
            </div>
            <div className="login-link-item">
              ¿Olvidaste tu contraseña?{" "}
              <Link to="/forgot-password" className="login-link">
                Recuperala aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;

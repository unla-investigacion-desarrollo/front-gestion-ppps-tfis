import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/authService";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo procesar la solicitud");
      }

      setOk(
        "Si el correo está registrado, recibirás un enlace de recuperación.",
      );
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h1 className="forgot-password-title">Recuperar contraseña</h1>
        <p className="forgot-password-subtitle">
          Ingresá tu correo electrónico para recibir las instrucciones de
          recuperación.
        </p>

        {error && <div className="forgot-alert-error">{error}</div>}
        {ok && <div className="forgot-alert-success">{ok}</div>}

        <form onSubmit={handleSubmit}>
          <div className="forgot-group">
            <label className="forgot-label" htmlFor="forgot-email">
              Correo Electrónico
            </label>
            <input
              id="forgot-email"
              type="email"
              className="forgot-input"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            className="forgot-button-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <div className="forgot-footer-links">
          ¿Recordaste tu contraseña?
          <Link to="/login" className="forgot-link">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

import React, { useState, useEffect } from 'react';

// Interfaz para definir las propiedades del componente del formulario de usuario.
interface UserFormProps {
  isSuperAdmin: boolean; // Indica si el usuario actual es Super Admin para permitir seleccionar roles.
  onSubmit: (data: {
    email: string;
    nombre: string;
    apellido: string;
    dni: string;
    invite: boolean;
    password?: string;
    rol: 'DOCENTE' | 'ADMIN';
  }) => Promise<void>; // Callback que se ejecuta cuando el formulario es válido y enviado.
}

/**
 * Componente que encapsula el formulario para crear o invitar a un nuevo docente/administrador.
 * Gestiona localmente su propio estado, validaciones y comprobación asíncrona de disponibilidad de DNI y Email.
 */
const UserForm: React.FC<UserFormProps> = ({ isSuperAdmin, onSubmit }) => {
  // Estado local para los campos del formulario
  const [form, setForm] = useState({
    email: '',
    nombre: '',
    apellido: '',
    dni: '',
    invite: true,
    password: '',
    rol: 'DOCENTE' as 'DOCENTE' | 'ADMIN',
  });

  // Estados para controlar el chequeo de disponibilidad (debonced)
  const [dniCheckTeach, setDniCheckTeach] = useState<'idle' | 'checking' | 'free' | 'taken'>('idle');
  const [emailCheck, setEmailCheck] = useState<'idle' | 'checking' | 'free' | 'taken'>('idle');

  // Efecto para verificar disponibilidad del DNI con debounce de 350ms
  useEffect(() => {
    if (!form.dni || form.dni.length !== 8) {
      setDniCheckTeach('idle');
      return;
    }
    setDniCheckTeach('checking');
    const handle = setTimeout(() => {
      try {
        const raw = localStorage.getItem('users');
        const users = raw ? JSON.parse(raw) : [];
        const exists = users.some((u: any) => (u.dni || '') === form.dni);
        setDniCheckTeach(exists ? 'taken' : 'free');
      } catch {
        setDniCheckTeach('free');
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [form.dni]);

  // Efecto para verificar disponibilidad del Email con debounce de 350ms
  useEffect(() => {
    const email = (form.email || '').trim().toLowerCase();
    if (!email) {
      setEmailCheck('idle');
      return;
    }
    setEmailCheck('checking');
    const handle = setTimeout(() => {
      try {
        const raw = localStorage.getItem('users');
        const users = raw ? JSON.parse(raw) : [];
        const exists = users.some((u: any) => (u.email || '').toLowerCase() === email);
        setEmailCheck(exists ? 'taken' : 'free');
      } catch {
        setEmailCheck('free');
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [form.email]);

  // Manejador genérico de cambios en inputs de texto estándar
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Manejador de envío del formulario con validaciones correspondientes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones del formulario antes del envío
    if (!form.email) {
      alert('Email es obligatorio');
      return;
    }
    if (emailCheck === 'taken') {
      alert('El email ya está en uso');
      return;
    }
    if (!form.nombre || /[^\p{L}\s]/gu.test(form.nombre)) {
      alert('Nombre debe contener solo letras');
      return;
    }
    if (!form.apellido || /[^\p{L}\s]/gu.test(form.apellido)) {
      alert('Apellido debe contener solo letras');
      return;
    }
    if (!/^\d{8}$/.test(form.dni)) {
      alert('DNI debe tener 8 dígitos');
      return;
    }
    if (dniCheckTeach === 'taken') {
      alert('El DNI ya está en uso');
      return;
    }

    // Ejecuta la callback recibida por props
    await onSubmit({
      email: form.email,
      nombre: form.nombre,
      apellido: form.apellido,
      dni: form.dni,
      invite: form.invite,
      password: form.invite ? undefined : form.password,
      rol: form.rol,
    });

    // Limpia el formulario a sus valores por defecto tras el envío exitoso
    setForm({
      email: '',
      nombre: '',
      apellido: '',
      dni: '',
      invite: true,
      password: '',
      rol: 'DOCENTE',
    });
  };

  return (
    <>
      <h2 className="unla-section-title">
        {isSuperAdmin ? 'Crear/Invitar Admin o Docente' : 'Crear/Invitar Docente'}
      </h2>
      <form className="row g-3" onSubmit={handleSubmit}>
        {/* Selector de rol: solo visible para el Super Admin */}
        {isSuperAdmin && (
          <div className="col-md-6">
            <select
              className="form-select"
              name="rol"
              value={form.rol}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  rol: e.target.value as 'DOCENTE' | 'ADMIN',
                  invite: e.target.value === 'DOCENTE' ? prev.invite : false,
                }))
              }
              required
            >
              <option value="DOCENTE">Docente</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        )}

        {/* Input para el Email */}
        <div className="col-md-6">
          <input
            className="form-control"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <div className="form-text">
            {form.email.trim() && emailCheck === 'taken'
              ? "❌ El email ya está en uso."
              : form.email.trim() && emailCheck === 'checking'
              ? "⏳ Verificando email…"
              : "Ingresá un email válido. No debe estar registrado."}
          </div>
        </div>

        {/* Input para el Nombre */}
        <div className="col-md-6">
          <input
            className="form-control"
            name="nombre"
            placeholder="Nombre (solo letras)"
            value={form.nombre}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                nombre: e.target.value.replace(/[^\p{L}\s]/gu, ""),
              }))
            }
          />
        </div>

        {/* Input para el Apellido */}
        <div className="col-md-6">
          <input
            className="form-control"
            name="apellido"
            placeholder="Apellido (solo letras)"
            value={form.apellido}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                apellido: e.target.value.replace(/[^\p{L}\s]/gu, ""),
              }))
            }
          />
        </div>

        {/* Input para el DNI */}
        <div className="col-md-6">
          <input
            className="form-control"
            name="dni"
            placeholder="DNI (8 dígitos)"
            value={form.dni}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                dni: e.target.value.replace(/\D/g, "").slice(0, 8),
              }))
            }
            required
          />
          <div className="form-text">
            {form.dni.length === 8 && dniCheckTeach === "taken"
              ? "❌ El DNI ya está en uso."
              : form.dni.length === 8 && dniCheckTeach === "checking"
              ? "⏳ Verificando DNI…"
              : "Debe contener exactamente 8 dígitos"}
          </div>
        </div>

        {/* Selección de invitación (sin contraseña por email) - solo disponible para docentes */}
        {form.rol === "DOCENTE" && (
          <div className="col-12">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="inviteCheck"
                checked={form.invite}
                onChange={(e) => setForm((prev) => ({ ...prev, invite: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="inviteCheck">
                Invitar por email (sin contraseña)
              </label>
            </div>
          </div>
        )}

        {/* Campo de Contraseña Inicial en caso de no ser una invitación */}
        {!form.invite && (
          <div className="col-12">
            <input
              className="form-control"
              name="password"
              placeholder="Contraseña inicial (definida por admin)"
              value={form.password}
              onChange={handleChange}
              type="text"
              required
            />
          </div>
        )}

        {/* Botón de Envío */}
        <div className="col-12">
          <button className="btn btn-primary" type="submit">
            {form.invite
              ? `Invitar ${form.rol === "DOCENTE" ? "Docente" : "Usuario"}`
              : `Crear ${form.rol === "DOCENTE" ? "Docente" : "Admin"}`}
          </button>
        </div>
      </form>
    </>
  );
};

export default UserForm;

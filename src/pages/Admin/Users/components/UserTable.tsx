import React, { useState } from 'react';

// Interfaz que define las propiedades del componente de la tabla de usuarios
interface UserTableProps {
  users: any[];
  showActionsColumn: boolean;
  canManage: (role: string, user: any) => boolean;
  sort: { key: string; dir: 'asc' | 'desc' };
  onToggleSort: (key: string) => void;
  onActivateClick: (user: any) => void; // Prop para abrir el modal de activación del docente
  onResetPassword: (user: any) => void;
  onDeleteUser: (user: any) => void;
  onEditClick: (user: any) => void; // Prop para abrir el modal de edición de un usuario
  onViewClick: (user: any) => void; // Prop para ver los detalles del usuario
}

/**
 * Componente que renderiza el listado de usuarios en una tabla interactiva y moderna.
 * Muestra el email con las iniciales, badges de roles y estados, y un menú de acciones dropdown (⋮).
 */
const UserTable: React.FC<UserTableProps> = ({
  users,
  showActionsColumn,
  canManage,
  sort,
  onToggleSort,
  onActivateClick,
  onResetPassword,
  onDeleteUser,
  onEditClick,
  onViewClick,
}) => {
  // Estado local para abrir el dropdown del usuario correspondiente
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Obtiene las iniciales de un usuario a partir de su nombre, apellido o email
  const getInitials = (nombre?: string, apellido?: string, email?: string) => {
    if (nombre && apellido) {
      return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
    }
    if (nombre) return nombre.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return 'US';
  };

  // Helper para renderizar los badges de Rol con sus respectivos colores
  const renderRoleBadge = (rol: string) => {
    let styles = {
      backgroundColor: '#f3f4f6',
      color: '#4b5563',
    };
    if (rol === 'ESTUDIANTE') {
      styles = { backgroundColor: '#fae8ff', color: '#a21caf' }; // Rosa/Morado
    } else if (rol === 'DOCENTE') {
      styles = { backgroundColor: '#e0f2fe', color: '#0369a1' }; // Azul
    } else if (rol === 'ADMIN') {
      styles = { backgroundColor: '#dcfce7', color: '#15803d' }; // Verde
    }

    return (
      <span
        className="badge role-badge-custom"
        style={styles}
      >
        {rol}
      </span>
    );
  };

  // Helper para renderizar los badges de Estado con circulo de color
  const renderStatusBadge = (estado: string) => {
    let dotColor = '#9ca3af';
    let bgColor = '#f3f4f6';
    let textColor = '#4b5563';
    let label = estado;

    switch (estado) {
      case 'active':
        dotColor = '#15803d';
        bgColor = '#dcfce7';
        textColor = '#15803d';
        label = 'Activo';
        break;
      case 'pending':
        dotColor = '#b45309';
        bgColor = '#fef3c7';
        textColor = '#b45309';
        label = 'Pendiente';
        break;
      case 'invited':
        dotColor = '#0369a1';
        bgColor = '#e0f2fe';
        textColor = '#0369a1';
        label = 'Invitado';
        break;
      case 'disabled':
        dotColor = '#be123c';
        bgColor = '#ffe4e6';
        textColor = '#be123c';
        label = 'Inactivo';
        break;
      case 'rejected':
        dotColor = '#be123c';
        bgColor = '#ffe4e6';
        textColor = '#be123c';
        label = 'Rechazado';
        break;
      case 'papelera':
        dotColor = '#4b5563';
        bgColor = '#e5e7eb';
        textColor = '#4b5563';
        label = 'Papelera';
        break;
    }

    return (
      <span
        className="badge status-badge-custom d-inline-flex align-items-center gap-1.5"
        style={{
          backgroundColor: bgColor,
          color: textColor
        }}
      >
        <span
          className="status-badge-dot"
          style={{
            backgroundColor: dotColor
          }}
        />
        {label}
      </span>
    );
  };

  // Helper para renderizar los indicadores de ordenación
  const renderSortIndicator = (key: string) => {
    if (sort.key !== key) return null;
    return sort.dir === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div style={{ overflow: 'visible', background: '#fff', borderRadius: '8px', border: '1px solid var(--unla-border)' }}>
      <table className="table table-striped table-hover m-0 align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => onToggleSort('email')}>
              Email{renderSortIndicator('email')}
            </th>
            <th style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => onToggleSort('nombreCompleto')}>
              Nombre{renderSortIndicator('nombreCompleto')}
            </th>
            <th style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => onToggleSort('rol')}>
              Rol{renderSortIndicator('rol')}
            </th>
            <th>DNI</th>
            <th>Legajo</th>
            {showActionsColumn && <th style={{ textAlign: 'center' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={showActionsColumn ? 6 : 5} className="text-center py-4 text-muted">
                No hay usuarios para mostrar.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                {/* Celda del Email con Iniciales */}
                <td style={{ padding: '12px 16px' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="user-avatar-initials">
                      {getInitials(u.nombre, u.apellido, u.email)}
                    </div>
                    <span style={{ fontWeight: 500 }}>{u.email}</span>
                  </div>
                </td>

                {/* Celda de Nombre Completo */}
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                  {[u.nombre, u.apellido].filter(Boolean).join(' ') || '-'}
                </td>

                {/* Celda del Rol (Badge) */}
                <td style={{ padding: '12px 16px' }}>
                  {renderRoleBadge(u.rol)}
                </td>

                {/* Celda del DNI */}
                <td style={{ padding: '12px 16px' }}>{u.dni ?? '-'}</td>

                {/* Celda del Legajo */}
                <td style={{ padding: '12px 16px' }}>{u.legajo ?? '-'}</td>

                {/* Columna de Acciones Unificadas en un Botón Dropdown (⋮) */}
                {showActionsColumn && (
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {canManage(u.rol, u) && (
                      <div className="actions-dropdown-wrapper">
                        <button
                          type="button"
                          className={`btn-actions-trigger d-flex align-items-center justify-content-center ${openDropdownId === u.id ? 'active' : ''}`}
                          onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)}
                        >
                          ⋮
                        </button>
                        {openDropdownId === u.id && (
                          <>
                            {/* Backdrop invisible para capturar el click afuera y cerrar el dropdown */}
                            <div
                              className="dropdown-click-outside-backdrop"
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <ul className="custom-dropdown-menu dropdown-menu-end">
                              {/* Acción: Ver usuario */}
                              <li>
                                <button
                                  type="button"
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onViewClick(u);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ minWidth: '14px' }}>
                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                                  </svg>
                                  Ver usuario
                                </button>
                              </li>

                              {/* Acción: Editar */}
                              <li>
                                <button
                                  type="button"
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onEditClick(u);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                                  </svg>
                                  Editar usuario
                                </button>
                              </li>

                              {/* Acción especial: Activar docente invitado */}
                              {u.rol === 'DOCENTE' && u.estado === 'invited' && (
                                <li>
                                  <button
                                    type="button"
                                    className="custom-dropdown-item text-success"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onActivateClick(u);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M12.03 5.97a.75.75 0 0 0-1.08-1.05l-3.97 4.09-1.9-1.9a.75.75 0 1 0-1.06 1.06l2.44 2.44a.75.75 0 0 0 1.08-.02z" />
                                    </svg>
                                    Activar docente
                                  </button>
                                </li>
                              )}

                              {/* Acción: Resetear Contraseña (solo si el usuario tiene DNI registrado) */}
                              {u.dni && u.estado !== 'papelera' && (
                                <li>
                                  <button
                                    type="button"
                                    className="custom-dropdown-item"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onResetPassword(u);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                                    </svg>
                                    Resetear contraseña
                                  </button>
                                </li>
                              )}



                              {/* Division y Acciones de eliminación */}
                              <li className="dropdown-divider" style={{ margin: '4px 0' }} />
                              <li>
                                <button
                                  type="button"
                                  className="custom-dropdown-item text-danger"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onDeleteUser(u);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                  </svg>
                                  Eliminar
                                </button>
                              </li>
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;

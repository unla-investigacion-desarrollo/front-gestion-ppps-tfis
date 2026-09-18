import React, { useState } from 'react';
import {
  FaEllipsisVertical,
  FaEye,
  FaPencil,
  FaCircleCheck,
  FaKey,
  FaBan,
  FaTrashCan,
} from 'react-icons/fa6';

// Interfaz que define las propiedades del componente de la tabla de usuarios
interface UserTableProps {
  users: any[];
  showActionsColumn: boolean;
  canManage: (role: string, user: any) => boolean;
  sort: { key: string; dir: 'asc' | 'desc' };
  onToggleSort: (key: string) => void;
  onActivateClick: (user: any) => void; // Prop para abrir el modal de activación del docente
  onResetPassword: (user: any) => void;
  onToggleActivation: (user: any, enable: boolean) => void;
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
  onToggleActivation,
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
            <th style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => onToggleSort('estado')}>
              Estado{renderSortIndicator('estado')}
            </th>
            <th>DNI</th>
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
                
                {/* Celda del Estado (Badge de color con punto) */}
                <td style={{ padding: '12px 16px' }}>
                  {renderStatusBadge(u.estado)}
                </td>

                {/* Celda del DNI */}
                <td style={{ padding: '12px 16px' }}>{u.dni ?? '-'}</td>

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
                          <FaEllipsisVertical />
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
                                  <FaEye size={14} style={{ minWidth: '14px' }} />
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
                                  <FaPencil size={14} />
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
                                    <FaCircleCheck size={14} />
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
                                    <FaKey size={14} />
                                    Resetear contraseña
                                  </button>
                                </li>
                              )}

                              {/* Acción: Desactivar o Activar cuenta (toggle estado active/disabled) */}
                              {u.estado === 'active' && (
                                <li>
                                  <button
                                    type="button"
                                    className="custom-dropdown-item text-warning"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onToggleActivation(u, false);
                                    }}
                                  >
                                    <FaBan size={14} />
                                    Desactivar cuenta
                                  </button>
                                </li>
                              )}
                              {(u.estado === 'disabled' || u.estado === 'rejected') && (
                                <li>
                                  <button
                                    type="button"
                                    className="custom-dropdown-item text-success"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onToggleActivation(u, true);
                                    }}
                                  >
                                    <FaCircleCheck size={14} />
                                    Activar cuenta
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
                                  <FaTrashCan size={14} />
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

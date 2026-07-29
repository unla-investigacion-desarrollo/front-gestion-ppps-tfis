import React, { useState } from 'react';

// Interfaz que define las propiedades del componente de la tabla de usuarios
interface UserTableProps {
  users: any[];
  isSuperAdmin: boolean;
  showActionsColumn: boolean;
  canManage: (role: string) => boolean;
  sort: { key: string; dir: 'asc' | 'desc' };
  onToggleSort: (key: string) => void;
  onRestoreUser: (user: any) => void;
  onDeletePermanently: (user: any) => void;
  onActivateTeacher: (id: string, password: string, clearPassword: () => void) => void;
  onResetPassword: (user: any) => void;
  onToggleActivation: (id: string, enable: boolean) => void;
  onDeleteUser: (id: string) => void;
  onEditClick: (user: any) => void; // Prop para abrir el modal de edición de un usuario
  filtersEstado: string;
}

/**
 * Componente que renderiza el listado de usuarios en una tabla interactiva y moderna.
 * Muestra el email con las iniciales, badges de roles y estados, y un menú de acciones dropdown (⋮).
 */
const UserTable: React.FC<UserTableProps> = ({
  users,
  isSuperAdmin,
  showActionsColumn,
  canManage,
  sort,
  onToggleSort,
  onRestoreUser,
  onDeletePermanently,
  onActivateTeacher,
  onResetPassword,
  onToggleActivation,
  onDeleteUser,
  onEditClick,
  filtersEstado,
}) => {
  // Estado local para abrir el dropdown del usuario correspondiente
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Estado local para guardar las contraseñas temporales al activar docentes invitados
  const [activatePw, setActivatePw] = useState<Record<string, string>>({});

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
    } else if (rol === 'SUPER_ADMIN') {
      styles = { backgroundColor: '#fef3c7', color: '#b45309' }; // Naranja
    }

    return (
      <span 
        className="badge" 
        style={{ 
          ...styles, 
          padding: '5px 12px', 
          borderRadius: '16px', 
          fontSize: '11px', 
          fontWeight: 600,
          textTransform: 'uppercase'
        }}
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
        className="badge d-inline-flex align-items-center gap-1.5"
        style={{
          backgroundColor: bgColor,
          color: textColor,
          padding: '6px 12px',
          borderRadius: '16px',
          fontWeight: 600,
          fontSize: '12px',
          border: 'none',
          lineHeight: '1.2'
        }}
      >
        <span 
          style={{ 
            width: '6px', 
            height: '6px', 
            backgroundColor: dotColor, 
            borderRadius: '50%',
            display: 'inline-block'
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
            <th>Legajo</th>
            {isSuperAdmin && <th>Contraseña</th>}
            {showActionsColumn && <th style={{ textAlign: 'center' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={isSuperAdmin ? 8 : 7} className="text-center py-4 text-muted">
                {filtersEstado === 'papelera' ? 'La papelera está vacía.' : 'No hay usuarios para mostrar.'}
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                {/* Celda del Email con Iniciales */}
                <td style={{ padding: '12px 16px' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        backgroundColor: '#fae8ff', 
                        color: '#a21caf', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 600,
                        fontSize: '13px',
                        flexShrink: 0
                      }}
                    >
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
                
                {/* Celda del Legajo */}
                <td style={{ padding: '12px 16px' }}>{u.legajo ?? '-'}</td>

                {/* Celda de Contraseña (Solo para Super Admin, revelable en hover/clic) */}
                {isSuperAdmin && (
                  <td
                    style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 16px', fontFamily: 'monospace' }}
                    onClick={e => {
                      const el = e.currentTarget;
                      el.textContent = u.password ?? '-';
                      el.dataset.revealed = 'true';
                      el.style.userSelect = 'text';
                    }}
                    onContextMenu={e => {
                      e.preventDefault();
                      const el = e.currentTarget;
                      if (el.dataset.revealed !== 'true') {
                        el.textContent = u.password ?? '-';
                        el.dataset.revealed = 'true';
                        el.style.userSelect = 'text';
                      }
                      const range = document.createRange();
                      range.selectNodeContents(el);
                      const sel = window.getSelection();
                      if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(range);
                      }
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget;
                      el.textContent = '••••••••';
                      el.dataset.revealed = 'false';
                      el.style.userSelect = 'none';
                      const sel = window.getSelection();
                      if (sel) sel.removeAllRanges();
                    }}
                    data-revealed="false"
                  >
                    ••••••••
                  </td>
                )}
                
                {/* Columna de Acciones Unificadas en un Botón Dropdown (⋮) */}
                {showActionsColumn && (
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {canManage(u.rol) && (
                      <div className="dropdown" style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          type="button"
                          className="btn btn-light d-flex align-items-center justify-content-center"
                          onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            padding: 0,
                            border: 'none',
                            fontSize: '18px',
                            color: '#666',
                            background: openDropdownId === u.id ? '#e9ecef' : 'transparent'
                          }}
                        >
                          ⋮
                        </button>
                        {openDropdownId === u.id && (
                          <>
                            {/* Backdrop invisible para capturar el click afuera y cerrar el dropdown */}
                            <div 
                              onClick={() => setOpenDropdownId(null)}
                              style={{ 
                                position: 'fixed', 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                bottom: 0, 
                                zIndex: 998,
                                background: 'transparent'
                              }}
                            />
                            <ul 
                              className="dropdown-menu show dropdown-menu-end" 
                              style={{ 
                                position: 'absolute', 
                                top: '100%', 
                                right: 0, 
                                zIndex: 999, 
                                display: 'block',
                                minWidth: '180px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                padding: '6px 0',
                                margin: '4px 0 0'
                              }}
                            >
                              {/* Acción: Editar */}
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center gap-2 py-2"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onEditClick(u);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                  </svg>
                                  Editar usuario
                                </button>
                              </li>

                              {/* Acción especial: Activar docente invitado con ingreso de contraseña */}
                              {u.rol === 'DOCENTE' && u.estado === 'invited' && (
                                <li className="px-3 py-2 border-bottom border-top my-1 bg-light">
                                  <div className="d-flex flex-column gap-1.5">
                                    <input
                                      type="password"
                                      className="form-control form-control-sm"
                                      placeholder="Contraseña inicial"
                                      value={activatePw[u.id] || ''}
                                      onChange={(e) => setActivatePw(prev => ({ ...prev, [u.id]: e.target.value }))}
                                      style={{ fontSize: '12px' }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm w-100"
                                      style={{ fontSize: '11px', padding: '2px 8px' }}
                                      onClick={() => {
                                        const pwd = (activatePw[u.id] || '').trim();
                                        onActivateTeacher(u.id, pwd, () => {
                                          setActivatePw(prev => ({ ...prev, [u.id]: '' }));
                                          setOpenDropdownId(null);
                                        });
                                      }}
                                    >
                                      Activar Docente
                                    </button>
                                  </div>
                                </li>
                              )}

                              {/* Acción: Resetear Contraseña (solo si el usuario tiene DNI registrado) */}
                              {u.dni && u.estado !== 'papelera' && (
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item d-flex align-items-center gap-2 py-2"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onResetPassword(u);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                                    </svg>
                                    Resetear contraseña
                                  </button>
                                </li>
                              )}

                              {/* Acción: Desactivar o Activar cuenta (toggle estado active/disabled) */}
                              {u.estado === 'active' && (
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item d-flex align-items-center gap-2 py-2 text-warning"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onToggleActivation(u.id, false);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M5.5 3.5A.5.5 0 0 1 6 4v4a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5m3 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5m-1.5 5.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1"/>
                                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                    </svg>
                                    Desactivar cuenta
                                  </button>
                                </li>
                              )}
                              {(u.estado === 'disabled' || u.estado === 'rejected') && (
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item d-flex align-items-center gap-2 py-2 text-success"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onToggleActivation(u.id, true);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                      <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                                    </svg>
                                    Activar cuenta
                                  </button>
                                </li>
                              )}

                              {/* Division y Acciones de eliminación */}
                              <li className="dropdown-divider" style={{ margin: '4px 0' }} />
                              {u.estado === 'papelera' ? (
                                <>
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center gap-2 py-2 text-success"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        onRestoreUser(u);
                                      }}
                                    >
                                      ♻️ Restaurar
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        onDeletePermanently(u);
                                      }}
                                    >
                                      🗑️ Eliminar definitivo
                                    </button>
                                  </li>
                                </>
                              ) : (
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      onDeleteUser(u.id);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                                    </svg>
                                    Eliminar
                                  </button>
                                </li>
                              )}
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

import React, { useState } from 'react';

// Interfaz que especifica las props del componente de tabla de usuarios.
interface UserTableProps {
  users: any[]; // Listado de usuarios filtrados y paginados que se van a mostrar.
  isSuperAdmin: boolean; // Flag para determinar permisos avanzados (como ver contraseñas).
  showActionsColumn: boolean; // Flag para mostrar u ocultar la columna de acciones.
  canManage: (role: string) => boolean; // Función para verificar si el usuario logueado puede gestionar un determinado rol.
  sort: { key: string; dir: 'asc' | 'desc' }; // Estado actual de la ordenación de las columnas.
  onToggleSort: (key: string) => void; // Función callback para cambiar el orden de una columna al hacer clic.
  onRestoreUser: (user: any) => void; // Callback para restaurar un usuario de la papelera.
  onDeletePermanently: (user: any) => void; // Callback para eliminar definitivamente de la base de datos (localStorage).
  onActivateTeacher: (id: string, password: string, clearPassword: () => void) => void; // Callback para activar un docente invitado.
  onResetPassword: (user: any) => void; // Callback para resetear la contraseña del usuario.
  onToggleActivation: (id: string, enable: boolean) => void; // Callback para cambiar el estado de activación (habilitar/deshabilitar).
  onDeleteUser: (id: string) => void; // Callback para mandar un usuario a la papelera (soft delete).
  filtersEstado: string; // Estado del filtro para saber si estamos visualizando la papelera u otra vista.
}

/**
 * Componente que renderiza el listado de usuarios en una tabla interactiva de Bootstrap.
 * Incluye cabeceras ordenables, control de acciones avanzadas según rol,
 * campo de contraseña seguro para Super Admin con revelado y soporte para papelera de reciclaje.
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
  filtersEstado,
}) => {
  // Estado local para los campos de contraseña de activación de docentes (Key: user.id, Value: contraseña tipeada)
  const [activatePw, setActivatePw] = useState<Record<string, string>>({});

  // Maneja el cambio de input de contraseña para activar un docente
  const handlePasswordChange = (userId: string, value: string) => {
    setActivatePw((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  // Función interna para renderizar las flechas indicadoras de ordenación
  const renderSortIndicator = (key: string) => {
    if (sort.key !== key) return null;
    return sort.dir === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <table className="table table-striped table-hover table-bordered">
      <thead className="table-dark">
        <tr>
          {/* Cabeceras de tabla con soporte para clic y ordenamiento */}
          <th style={{ cursor: 'pointer' }} onClick={() => onToggleSort('email')}>
            Email{renderSortIndicator('email')}
          </th>
          <th style={{ cursor: 'pointer' }} onClick={() => onToggleSort('nombreCompleto')}>
            Nombre{renderSortIndicator('nombreCompleto')}
          </th>
          <th style={{ cursor: 'pointer' }} onClick={() => onToggleSort('rol')}>
            Rol{renderSortIndicator('rol')}
          </th>
          <th style={{ cursor: 'pointer' }} onClick={() => onToggleSort('estado')}>
            Estado{renderSortIndicator('estado')}
          </th>
          {showActionsColumn && <th>Acciones</th>}
          {isSuperAdmin && <th>Contraseña</th>}
          <th>DNI</th>
          <th>Legajo</th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            {/* Mensaje cuando la tabla está vacía */}
            <td colSpan={isSuperAdmin ? 9 : 8} style={{ textAlign: 'center', color: '#888' }}>
              {filtersEstado === 'papelera' ? 'La papelera está vacía.' : 'No hay usuarios para mostrar.'}
            </td>
          </tr>
        ) : (
          users.map((u) => (
            <tr key={u.id}>
              {/* Celda del Email */}
              <td>{u.email}</td>
              
              {/* Celda de Nombre Completo */}
              <td>{[u.nombre, u.apellido].filter(Boolean).join(' ')}</td>
              
              {/* Celda del Rol */}
              <td>{u.rol}</td>
              
              {/* Celda del Estado */}
              <td>{u.estado}</td>
              
              {/* Celda de Acciones de Administración */}
              {showActionsColumn && (
                <td>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    {canManage(u.rol) && (
                      <React.Fragment>
                        {u.estado === 'papelera' ? (
                          // Acciones para usuarios que están en la papelera
                          <>
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => onRestoreUser(u)}
                            >
                              Restaurar
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => onDeletePermanently(u)}
                            >
                              Eliminar definitivamente
                            </button>
                          </>
                        ) : (
                          // Acciones para usuarios activos
                          <>
                            {/* Activar docente invitado que no tiene contraseña */}
                            {u.rol === 'DOCENTE' && u.estado === 'invited' && (
                              <React.Fragment>
                                <input
                                  className="form-control"
                                  placeholder="Contraseña inicial"
                                  value={activatePw[u.id] || ''}
                                  onChange={(e) => handlePasswordChange(u.id, e.target.value)}
                                  style={{ maxWidth: 200 }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-success"
                                  onClick={() => {
                                    const pwd = (activatePw[u.id] || '').trim();
                                    onActivateTeacher(u.id, pwd, () => {
                                      setActivatePw((m) => ({ ...m, [u.id]: '' }));
                                    });
                                  }}
                                >
                                  Activar
                                </button>
                              </React.Fragment>
                            )}

                            {/* Resetear contraseña (requiere que el usuario tenga DNI registrado) */}
                            {u.dni && (
                              <button
                                type="button"
                                className="btn btn-warning"
                                onClick={() => onResetPassword(u)}
                              >
                                Resetear
                              </button>
                            )}

                            {/* Habilitar / Deshabilitar cuenta */}
                            {u.estado === 'active' ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => onToggleActivation(u.id, false)}
                              >
                                Desactivar
                              </button>
                            ) : (u.estado === 'disabled' || u.estado === 'rejected') ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => onToggleActivation(u.id, true)}
                              >
                                Activar
                              </button>
                            ) : null}

                            {/* Enviar usuario a la papelera (Soft delete) */}
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => onDeleteUser(u.id)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </React.Fragment>
                    )}
                  </div>
                </td>
              )}

              {/* Columna de contraseña oculta y revelable en hover/context-menu (solo para Super Admin) */}
              {isSuperAdmin && (
                <td
                  style={{ cursor: 'pointer', userSelect: 'none' }}
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
                    // Seleccionar todo el texto para facilitar el copiado
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

              {/* Celda del DNI */}
              <td>{u.dni ?? '-'}</td>
              
              {/* Celda del Legajo */}
              <td>{u.legajo ?? '-'}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default UserTable;

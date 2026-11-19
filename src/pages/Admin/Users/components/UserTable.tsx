import React from 'react';
import {
  FaEye,
  FaPencil,
  FaKey,
  FaBan,
  FaTrashCan,
  FaCircleCheck,
} from 'react-icons/fa6';

// Interfaz que define las propiedades del componente de la tabla de usuarios
interface UserTableProps {
  users: any[];
  showActionsColumn: boolean;
  canManage: (role: string, user: any) => boolean;
  canEditUser: (user: any) => boolean;
  canDeleteUser: (user: any) => boolean;
  canDeactivateUser: (user: any) => boolean;
  sort: { key: string; dir: 'asc' | 'desc' };
  onToggleSort: (key: string) => void;
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
  canEditUser,
  canDeleteUser,
  canDeactivateUser,
  sort,
  onToggleSort,
  onToggleActivation,
  onDeleteUser,
  onEditClick,
  onViewClick,
}) => {
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
    } else if (rol === 'ADMIN' || rol === 'SUPERADMIN') {
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
            users.map((userItem) => (
              <tr key={userItem.id}>
                {/* Celda del Email con Iniciales */}
                <td style={{ padding: '12px 16px' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="user-avatar-initials">
                      {getInitials(userItem.nombre, userItem.apellido, userItem.email)}
                    </div>
                    <span style={{ fontWeight: 500 }}>{userItem.email}</span>
                  </div>
                </td>
                
                {/* Celda de Nombre Completo */}
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                  {[userItem.nombre, userItem.apellido].filter(Boolean).join(' ') || '-'}
                </td>
                
                {/* Celda del Rol (Badge) */}
                <td style={{ padding: '12px 16px' }}>
                  {renderRoleBadge(userItem.rol)}
                </td>
                
                {/* Celda del Estado (Badge de color con punto) */}
                <td style={{ padding: '12px 16px' }}>
                  {renderStatusBadge(userItem.estado)}
                </td>

                {/* Celda del DNI */}
                <td style={{ padding: '12px 16px' }}>{userItem.dni ?? '-'}</td>

                {/* Columna de Acciones directas con íconos */}
                {showActionsColumn && (
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {canManage(userItem.rol, userItem) && (
                      <div className="user-actions-group">
                        <button
                          type="button"
                          className="btn-user-icon-action btn-user-view"
                          onClick={() => onViewClick(userItem)}
                          title="Ver usuario"
                          aria-label="Ver usuario"
                        >
                          <FaEye size={14} />
                        </button>

                        {canEditUser(userItem) && (
                          <button
                            type="button"
                            className="btn-user-icon-action btn-user-view"
                            onClick={() => onEditClick(userItem)}
                            title="Editar usuario"
                            aria-label="Editar usuario"
                          >
                            <FaPencil size={13} />
                          </button>
                        )}

                        {userItem.estado === 'active' && canDeactivateUser(userItem) && (
                          <button
                            type="button"
                            className="btn-user-icon-action btn-user-warn"
                            onClick={() => onToggleActivation(userItem, false)}
                            title="Desactivar cuenta"
                            aria-label="Desactivar cuenta"
                          >
                            <FaBan size={13} />
                          </button>
                        )}

                        {(userItem.estado === 'disabled' || userItem.estado === 'rejected') && (
                          <button
                            type="button"
                            className="btn-user-icon-action btn-user-activate"
                            onClick={() => onToggleActivation(userItem, true)}
                            title="Activar cuenta"
                            aria-label="Activar cuenta"
                          >
                            <FaCircleCheck size={13} />
                          </button>
                        )}

                        {canDeleteUser(userItem) && (
                          <button
                            type="button"
                            className="btn-user-icon-action btn-user-delete"
                            onClick={() => onDeleteUser(userItem)}
                            title="Eliminar"
                            aria-label="Eliminar"
                          >
                            <FaTrashCan size={13} />
                          </button>
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

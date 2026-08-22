import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectPendingUsers, approveUser, rejectUser } from '../../../../redux/slices/usersSlice';
import '../../../styles/unla.css';
import bgImage from '../../../assets/fondo-rojo.jpg';
import { showToast } from '../../../utils/toast';

const ApprovalQueue: React.FC = () => {
  const dispatch = useDispatch();
  const pending = useSelector(selectPendingUsers);

  useEffect(() => {
    dispatch<any>(fetchUsers());
  }, [dispatch]);

  const onApprove = async (id: string) => {
    const result = await dispatch<any>(approveUser({ id }));
    if (result && result.payload) {
      // Mostrar contraseña temporal para estudiantes aprobados
      const u = result.payload as any;
      if (u.password) {
        showToast(`Aprobado. Contraseña temporal: ${u.password}`, 'success');
      }
    }
  };

  const onReject = async (id: string) => {
    await dispatch<any>(rejectUser({ id }));
  };

  return (
    <div
      className="unla-page"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '16px'
      }}
    >
      <div className="unla-card" style={{ maxWidth: 920, margin: '0 auto' }}>
        <h1>Solicitudes Pendientes</h1>
        {pending.length === 0 ? (
          <p>No hay usuarios pendientes de aprobación.</p>
        ) : (
          <table className="table table-striped table-hover table-bordered">
            <thead className="table-dark">
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{[u.nombre, u.apellido].filter(Boolean).join(' ')}</td>
                  <td>{u.rol}</td>
                  <td>
                    <button className="btn btn-success btn-sm" onClick={() => onApprove(u.id)} style={{ marginRight: 8 }}>Aprobar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onReject(u.id)}>Rechazar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ApprovalQueue;

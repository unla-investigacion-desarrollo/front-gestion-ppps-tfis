import React, { useMemo } from 'react';
import '../../styles/unla.css';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { selectProjects } from '../../../redux/slices/projectsSlice';
import { selectUsers } from '../../../redux/slices/usersSlice';
import { Link } from 'react-router-dom';

const MyProjects: React.FC = () => {
  const me = useSelector(selectCurrentUser) as any;
  const allProjects = useSelector(selectProjects);
  const allUsers = useSelector(selectUsers);

  const myProjects = useMemo(() => {
    if (!me?.id) return [] as any[];
    return allProjects.filter(p => (p.students || []).includes(me.id));
  }, [allProjects, me]);

  const userNameOrEmail = (id: string) => {
    const u = allUsers.find(u => String(u.id) === String(id));
    return u ? ([u.nombre, u.apellido].filter(Boolean).join(' ') || u.email || id) : id;
  };

  if (!me) return null;

  return (
    <div className="unla-page">
      <div className="unla-card" style={{ width: '100%', margin: '0 auto' }}>
        <h1>Mis Proyectos</h1>
        {myProjects.length === 0 ? (
          <div className="unla-hint" style={{ marginTop: 8 }}>
            Aún no fuiste asignado a ningún proyecto.
          </div>
        ) : (
          <div className="unla-table-container" style={{ marginTop: 12 }}>
            <table className="unla-table wide">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Docente asignador</th>
                  <th>Compañeros</th>
                </tr>
              </thead>
              <tbody>
                {myProjects.map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/alumno/entregas?projectId=${encodeURIComponent(p.id)}`}>{p.titulo}</Link>
                    </td>
                    <td style={{ maxWidth: 400, whiteSpace: 'pre-wrap' }}>{p.descripcion}</td>
                    <td>{p.categoria || '-'}</td>
                    <td>{userNameOrEmail(p.teacherId)}</td>
                    <td>
                      {p.students.filter((sid: string) => String(sid) !== String(me.id)).length === 0 && (
                        <div className="unla-hint">Sin compañeros asignados</div>
                      )}
                      {p.students.filter((sid: string) => String(sid) !== String(me.id)).length > 0 && (
                        <ul className="unla-list">
                          {p.students.filter((sid: string) => String(sid) !== String(me.id)).map((sid: string) => (
                            <li key={sid}>{userNameOrEmail(sid)}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;

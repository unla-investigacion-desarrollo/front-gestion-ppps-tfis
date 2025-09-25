import React, { useMemo } from 'react';
import '../../styles/unla.css';
import { useDispatch, useSelector } from 'react-redux';
import { restoreProject, purgeProject, Project } from '../../../redux/slices/projectsSlice';
import { selectCurrentUser } from '../../../redux/slices/authSlice';

const TRASH_KEY = 'projectsTrash';

type TrashItem = Project & { deletedAt: string };

function readTrash(): TrashItem[] {
  try {
    const raw = localStorage.getItem(TRASH_KEY);
    return raw ? JSON.parse(raw) as TrashItem[] : [];
  } catch {
    return [];
  }
}
function writeTrash(items: TrashItem[]) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(items));
}

const ProjectsTrash: React.FC = () => {
  const dispatch = useDispatch<any>();
  const me = useSelector(selectCurrentUser);
  const items = useMemo(() => readTrash().sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || '')), []);

  return (
    <div className="unla-page">
      <div className="unla-card" style={{ width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Papelera de Proyectos</h1>
          <div className="spacer" />
        </div>

        {items.length === 0 ? (
          <div className="unla-hint" style={{ marginTop: 10 }}>La Papelera está vacía.</div>
        ) : (
          <div className="unla-table-container" style={{ marginTop: 12 }}>
            <table className="unla-table wide">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Docente</th>
                  <th>Fecha eliminación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id}>
                    <td>{p.titulo}</td>
                    <td>{p.teacherId}</td>
                    <td>{new Date(p.deletedAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="unla-btn"
                          type="button"
                          onClick={async () => {
                            const res = await dispatch(restoreProject({ projectId: p.id }));
                            if (!(res as any).error) {
                              // Remove from local view
                              writeTrash(readTrash().filter(x => x.id !== p.id));
                              try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Proyecto restaurado', type: 'success' } })); } catch {}
                            }
                          }}
                        >
                          Restaurar
                        </button>
                        <button
                          className="unla-btn"
                          type="button"
                          style={{ background: '#c62828' }}
                          onClick={async () => {
                            const ok = window.confirm('¿Eliminar definitivamente este proyecto? Esta acción no se puede deshacer.');
                            if (!ok) return;
                            const res = await dispatch(purgeProject({ projectId: p.id }));
                            if (!(res as any).error) {
                              writeTrash(readTrash().filter(x => x.id !== p.id));
                              try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Proyecto eliminado definitivamente', type: 'success' } })); } catch {}
                            }
                          }}
                        >
                          Eliminar definitivamente
                        </button>
                      </div>
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

export default ProjectsTrash;

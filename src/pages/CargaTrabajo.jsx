import './CargaProyecto.css';
import BackButton from '../components/BackButton';

const CargaTrabajo = () => {
  return (
    <div className="carga-trabajo-page">
      <header className="carga-trabajo-header">
        <h1>Subir Entregas y Seguimiento del Proyecto</h1>
        <div style={{ textAlign: 'left' }}>
          <BackButton />
        </div>
      </header>

      <section className="upload-section">
        <h2>Subida de Archivos</h2>
        <input type="file" accept=".pdf" />
        <button>Subir PDF</button>
      </section>

      <section className="estado-section">
        <h2>Estado del Proyecto</h2>
        <p>Estado actual: <strong>En revisión</strong></p>
      </section>

      <section className="historial-section">
        <h2>Historial de Comentarios</h2>
        <ul>
          <li>[15/06/2025] - Docente: Revisar los objetivos.</li>
          <li>[10/06/2025] - Propuesta recibida.</li>
        </ul>
      </section>
    </div>
  );
};

export default CargaTrabajo;

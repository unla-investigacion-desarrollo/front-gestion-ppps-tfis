import './CargaProyecto.css';

const CargaProyecto = () => {
  return (
    <div className="carga-proyecto-page">
      <header className="carga-proyecto-header">
        <h1>Cargar Propuesta de Trabajo Final Integrador</h1>
      </header>

      <form className="carga-proyecto-form">
        <label htmlFor="titulo">Título del Proyecto</label>
        <input type="text" id="titulo" name="titulo" placeholder="Ingrese el título del proyecto" />

        <label htmlFor="descripcion">Descripción</label>
        <textarea id="descripcion" name="descripcion" rows="5" placeholder="Descripción del proyecto"></textarea>

        <label htmlFor="categoria">Categoría</label>
        <select id="categoria" name="categoria">
          <option value="">Seleccione una categoría</option>
          <option value="desarrollo">Desarrollo</option>
          <option value="investigacion">Investigación</option>
          <option value="extension">Extensión</option>
        </select>

        <button type="submit">Enviar Propuesta</button>
      </form>

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

export default CargaProyecto;
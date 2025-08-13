import './CargaProyecto.css';

const CargaPropuesta = () => {
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

        <label htmlFor="responsable">Responsable</label>
        <input type="text" id="responsable" name="responsable" placeholder="Nombre del responsable" />

        <label htmlFor="categoria">Categoría</label>
        <select id="categoria" name="categoria">
          <option value="">Seleccione una categoría</option>
          <option value="desarrollo">Desarrollo</option>
          <option value="investigacion">Investigación</option>
          <option value="extension">Extensión</option>
        </select>

        <label htmlFor="estado">Estado</label>
        <select id="estado" name="estado">
          <option value="en_curso">En curso</option>
          <option value="en_curso">En estudio</option>
          <option value="en_curso">Finalizado</option>
          <option value="en_curso">Rechazado</option>


        </select>

        <button type="submit">Enviar Propuesta</button>
      </form>
    </div>
  );
};

export default CargaPropuesta;

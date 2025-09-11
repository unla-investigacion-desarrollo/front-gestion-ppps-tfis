import './Register.css';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../redux/states/store';
import { setField, resetForm } from '../../../redux/slices/registerSlice';

const Register = () => {
    
    const dispatch = useAppDispatch();
    const register = useSelector((state) => state.register);
  
    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      dispatch(setField({ field: name, value: type === 'checkbox' ? checked : value }));
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log(register);
      //mandar al back los datos, yo me quedo temporalmente los datos del registro evaluar cambiar 
      // nombre a usuario en ves de registerslice
      dispatch(resetForm());
    };

    return (
      <div className="background d-flex justify-content-center align-items-center vh-100">

        
        <div className="col-12 col-md-6 col-lg-4 text-center bg-white p-4 rounded-3" style={{opacity: 0.95}}>
         
  
          <h3 className="mb-4">Creá tu cuenta</h3>
  
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="Nombre" className="form-label">
                Nombres
              </label>
              <input type="text" className="form-control" id="Nombre" name="nombre" onChange={handleChange} required />
            </div>
  
            <div className="mb-3">
              <label htmlFor="Apellido" className="form-label">
                Apellidos
              </label>
              <input type="text" className="form-control" id="Apellido" name="apellido" onChange={handleChange} required />
            </div>
  
            <div className="mb-3">
              <label htmlFor="Email" className="form-label">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="Email"
                name="email"
                onChange={handleChange}
                aria-describedby="emailHelp"
                required
              />
              <div id="emailHelp" className="form-text">
                Nunca compartiremos tu email con nadie más.
              </div>
            </div>
  
            <div className="mb-3">
              <label htmlFor="Password" className="form-label">
                Password
              </label>
              <input type="password" className="form-control" id="Password" name="password" onChange={handleChange} required />
            </div>
  
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="exampleCheck1"
              />
              <label className="form-check-label" htmlFor="exampleCheck1">
                Recordarme
              </label>
            </div>
  
            <button type="submit" className="btn btn-danger w-100 py-2">
              Registrarse
            </button>
          </form>
          
        </div>
      </div>
    );
  };
  
  export default Register;
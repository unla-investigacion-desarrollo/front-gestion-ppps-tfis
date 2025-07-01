import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFound from '../pages/NotFound/NotFound';
import './App.css'
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard'; 
import CargaProyecto from '../pages/CargaProyecto'; 
import CargaPropuesta from '../pages/CargaPropuesta'; 
import CargaTrabajo from '../pages/CargaTrabajo';
import PrivateRoute from '../auth/PrivateRoute';

const App = () => {
  const [isAuthenticated, setIsAuth] = useState(true); // verificación autenticación para más adelante

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route exact path='/' element={<Login />} />
          <Route exact path='/login' element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/carga-proyecto" element={
            <PrivateRoute>
              <CargaProyecto />
            </PrivateRoute>
          } />
          
          <Route path="/carga-propuesta" element={
            <PrivateRoute>
              <CargaPropuesta />
            </PrivateRoute>
          } />
          
          <Route path="/carga-trabajo" element={
            <PrivateRoute>
              <CargaTrabajo />
            </PrivateRoute>
          } />
          
          <Route exact path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  )
};

export default App;

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFound from '../pages/NotFound/NotFound';
import './App.css'
import Login from '../pages/Login/Login';

import Dashboard from '../pages/Dashboard/Dashboard'; // Asegurate que la ruta esté bien

// dentro del componente App, dentro de <Routes>...
<Route path="/dashboard" element={<Dashboard />} />


const App= ()=> {
  const [isAuthenticated, setIsAuth]=useState(true); // verificacion autenticacion para mas adelante.
  
  return (
    <>
       <BrowserRouter>
      
          <Routes>
            {/* <Route exact path='/' element={<Main carrito={carrito} setCarrito={setCarrito}/>} /> */}
            <Route exact path='/' element={<Login />} /> 
            <Route exact path='/login' element={<Login />} /> 
            <Route path="/dashboard" element={<Dashboard />} />
            <Route exact path='*' element={<NotFound/>} />
            
          </Routes>
      </BrowserRouter>
    </>
  )
};

export default App

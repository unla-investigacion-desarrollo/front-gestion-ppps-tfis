import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFound from '../pages/NotFound/NotFound';
import './App.css'
import Login from '../pages/Login/Login';

const App= ()=> {
  const [isAuthenticated, setIsAuth]=useState(true); // verificacion autenticacion para mas adelante.
  
  return (
    <>
       <BrowserRouter>
      
          <Routes>
            {/* <Route exact path='/' element={<Main carrito={carrito} setCarrito={setCarrito}/>} /> */}
            <Route exact path='/' element={<Login />} /> 
            <Route exact path='/login' element={<Login />} /> 
            <Route exact path='*' element={<NotFound/>} />
            
          </Routes>
      </BrowserRouter>
    </>
  )
};

export default App

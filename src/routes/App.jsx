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
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import AdminRoute from '../auth/AdminRoute';
import Register from '../pages/Register/Register';
import UsersList from '../pages/Admin/Users/UsersList';
import ApprovalQueue from '../pages/Admin/Approvals/ApprovalQueue';
import Help from '../pages/Help/Help';

const App = () => {
  const [isAuthenticated, setIsAuth] = useState(true); // verificación autenticación para más adelante

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route exact path='/' element={<Login />} />
          <Route exact path='/login' element={<Login />} />
          <Route exact path='/register' element={<Register />} />
          <Route exact path='/help' element={<Help />} />
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />

          <Route path="/carga-proyecto" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <CargaProyecto />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/carga-propuesta" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <CargaPropuesta />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/carga-trabajo" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <CargaTrabajo />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />

          {/* Rutas de administración */}
          <Route path="/admin/users" element={
            <PrivateRoute>
              <AdminRoute>
                <AuthenticatedLayout>
                  <UsersList />
                </AuthenticatedLayout>
              </AdminRoute>
            </PrivateRoute>
          } />
          <Route path="/admin/approvals" element={
            <PrivateRoute>
              <AdminRoute>
                <AuthenticatedLayout>
                  <ApprovalQueue />
                </AuthenticatedLayout>
              </AdminRoute>
            </PrivateRoute>
          } />
          
          
         {/*  <Route path="/carga-proyecto" element={
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
          } /> */}
          
          <Route exact path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  )
};

export default App;

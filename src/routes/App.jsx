import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFound from '../pages/NotFound/NotFound';
import './App.css'
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard'; 
import CargaProyecto from '../pages/CargaProyecto'; 
import CargaPropuesta from '../pages/CargaPropuesta'; 
import PrivateRoute from '../auth/PrivateRoute';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import AdminRoute from '../auth/AdminRoute';
import TeacherRoute from '../auth/TeacherRoute';
import StudentRoute from '../auth/StudentRoute';
import Register from '../pages/Register/Register';
import UsersList from '../pages/Admin/Users/UsersList';
import ApprovalQueue from '../pages/Admin/Approvals/ApprovalQueue';
import Help from '../pages/Help/Help';
import ChangePassword from '../pages/Auth/ChangePassword';
import ProposalsList from '../pages/Admin/Proposals/ProposalsList';
import EstadoGeneral from '../pages/Estado/EstadoGeneral';

const App = () => {
  

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path='/' element={<Login />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/help' element={<Help />} />
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

          <Route path="/change-password" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <ChangePassword />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/carga-propuesta" element={
            <PrivateRoute>
              <StudentRoute>
                <AuthenticatedLayout>
                  <CargaPropuesta />
                </AuthenticatedLayout>
              </StudentRoute>
            </PrivateRoute>
          } />
          

          <Route path="/estado" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <EstadoGeneral />
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

          <Route path="/admin/proposals" element={
            <PrivateRoute>
              <TeacherRoute>
                <AuthenticatedLayout>
                  <ProposalsList />
                </AuthenticatedLayout>
              </TeacherRoute>
            </PrivateRoute>
          } />
          
          
          <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  )
};

export default App;

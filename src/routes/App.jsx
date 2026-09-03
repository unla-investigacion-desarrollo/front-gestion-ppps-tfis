import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFound from '../pages/NotFound/NotFound';
import './App.css'
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import CargaPropuesta from '../pages/CargaPropuesta';
import PrivateRoute from '../auth/PrivateRoute';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import AdminRoute from '../auth/AdminRoute';
import TeacherRoute from '../auth/TeacherRoute';
import Register from '../pages/Register/Register';
import UsersList from '../pages/Admin/Users/UsersList';
import ApprovalQueue from '../pages/Admin/Approvals/ApprovalQueue';
import Help from '../pages/Help/Help';
import ChangePassword from '../pages/Auth/ChangePassword';
import ProposalsList from '../pages/Admin/Proposals/ProposalsList';
import ProposalDetail from '../pages/Admin/Proposals/ProposalDetail';
import EstadoGeneral from '../pages/Estado/EstadoGeneral';
import TeacherProjectsList from '../pages/Teacher/TeacherProjectsList';
import MyProjects from '../pages/Student/MyProjects';
import StudentDeliveries from '../pages/Student/Deliveries';
import TeacherProjectCreate from '../pages/Teacher/TeacherProjectCreate';
import DeliveriesReview from '../pages/Teacher/DeliveriesReview';
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



          <Route path="/change-password" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <ChangePassword />
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
              <TeacherRoute>
                <AuthenticatedLayout>
                  <ApprovalQueue />
                </AuthenticatedLayout>
              </TeacherRoute>
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

          <Route path="/admin/proposals/:id" element={
            <PrivateRoute>
              <TeacherRoute>
                <AuthenticatedLayout>
                  <ProposalDetail />
                </AuthenticatedLayout>
              </TeacherRoute>
            </PrivateRoute>
          } />

          <Route path="/docente/entregas" element={
            <PrivateRoute>
              <TeacherRoute>
                <AuthenticatedLayout>
                  <DeliveriesReview />
                </AuthenticatedLayout>
              </TeacherRoute>
            </PrivateRoute>
          } />

          {/* Rutas Proyectos - accesibles para cualquier usuario autenticado */}
          <Route path="/docente/proyectos" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <TeacherProjectsList />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />
          <Route path="/docente/proyectos/nuevo" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <TeacherProjectCreate />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />

          <Route path="/alumno/mis-proyectos" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <MyProjects />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />
          <Route path="/alumno/entregas" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <StudentDeliveries />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />
          {/* Fallback */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  )
};

export default App;

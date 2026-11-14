import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFound from '../pages/NotFound/NotFound';
import './App.css'
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import TeacherDashboard from '../pages/Dashboard/Teacher/TeacherDashboard';
import PrivateRoute from '../auth/PrivateRoute';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import AdminRoute from '../auth/AdminRoute';
import TeacherRoute from '../auth/TeacherRoute';
import Register from '../pages/Register/Register';
import UsersList from '../pages/Admin/Users/UsersList';
import ApprovalQueue from '../pages/Admin/Approvals/ApprovalQueue';
import Help from '../pages/Help/Help';
import ChangePassword from '../pages/Auth/ChangePassword';
import TeacherProjectsList from '../pages/Teacher/TeacherProjectsList';
import MyProjects from '../pages/Student/MyProjects';
import StudentDeliveries from '../pages/Student/Deliveries';
import TeacherProjectCreate from '../pages/Teacher/TeacherProjectCreate';
import Trabajo from '../pages/Trabajo/Trabajo';
import PPPProposalsCatalog from '../pages/PPP/PPPProposalsCatalog';
import PPPExpedientesList from '../pages/PPP/PPPExpedientesList';
import PPPTramiteDetail from '../pages/PPP/PPPTramiteDetail';
import PPPStudentMyTramite from '../pages/PPP/PPPStudentMyTramite';
import PPPProposalApplicantsPage from '../pages/PPP/PPPProposalApplicantsPage';
import { useUserProfile } from '../hooks/useUserProfile';

const TeacherProjectsRoute = () => {
  const { user, isProfessor, teacherType } = useUserProfile();

  if (isProfessor) {
    return <TeacherDashboard user={user} teacherType={teacherType} initialView="convocatoria-tfi" />;
  }

  return <TeacherProjectsList />;
};

const TeacherApprovalsRoute = () => {
  const { user, isProfessor, teacherType } = useUserProfile();

  if (isProfessor) {
    return <TeacherDashboard user={user} teacherType={teacherType} initialView="solicitudes" />;
  }

  return <ApprovalQueue />;
};

const TeacherPPPProposalsRoute = () => {
  const { user, isProfessor, teacherType } = useUserProfile();

  if (isProfessor) {
    return <TeacherDashboard user={user} teacherType={teacherType} initialView="convocatorias-ppp" />;
  }

  return <PPPProposalsCatalog />;
};

const TeacherPPPLayoutRoute = ({ view = 'ppp', children }) => {
  const { user, isProfessor, teacherType } = useUserProfile();

  if (isProfessor) {
    return (
      <TeacherDashboard user={user} teacherType={teacherType} initialView={view}>
        {children}
      </TeacherDashboard>
    );
  }

  return children;
};

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
                  <TeacherApprovalsRoute />
                </AuthenticatedLayout>
              </TeacherRoute>
            </PrivateRoute>
          } />
          {/* Rutas Proyectos - accesibles para cualquier usuario autenticado */}
          <Route path="/docente/proyectos" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <TeacherProjectsRoute />
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
          <Route path="/proyectos/:projectId/trabajo" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <Trabajo />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />
          <Route path="/docente/proyectos/:projectId/trabajo" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <Trabajo />
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
          {/* Rutas Módulo PPP (Prácticas Profesionales Supervisadas) */}
          <Route path="/ppp/convocatorias" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <TeacherPPPProposalsRoute />
              </AuthenticatedLayout>
            </PrivateRoute>
          } />
          <Route path="/ppp/convocatorias/:id/postulaciones" element={
            <PrivateRoute>
              <TeacherRoute>
                <AuthenticatedLayout>
                  <TeacherPPPLayoutRoute view="convocatorias-ppp">
                    <PPPProposalApplicantsPage />
                  </TeacherPPPLayoutRoute>
                </AuthenticatedLayout>
              </TeacherRoute>
            </PrivateRoute>
          } />
          <Route path="/ppp/proposals/:id" element={
            <PrivateRoute>
              <TeacherRoute>
                <AuthenticatedLayout>
                  <TeacherPPPLayoutRoute view="convocatorias-ppp">
                    <PPPProposalApplicantsPage />
                  </TeacherPPPLayoutRoute>
                </AuthenticatedLayout>
              </TeacherRoute>
            </PrivateRoute>
          } />
          <Route path="/ppp/expedientes" element={
            <PrivateRoute>
              <TeacherRoute>
                <AuthenticatedLayout>
                  <TeacherPPPLayoutRoute view="ppp">
                    <PPPExpedientesList />
                  </TeacherPPPLayoutRoute>
                </AuthenticatedLayout>
              </TeacherRoute>
            </PrivateRoute>
          } />
          <Route path="/ppp" element={
            <PrivateRoute>
              <TeacherRoute>
                <AuthenticatedLayout>
                  <TeacherPPPLayoutRoute view="ppp">
                    <PPPExpedientesList />
                  </TeacherPPPLayoutRoute>
                </AuthenticatedLayout>
              </TeacherRoute>
            </PrivateRoute>
          } />
          <Route path="/ppp/:id" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <TeacherPPPLayoutRoute view="ppp">
                  <PPPTramiteDetail />
                </TeacherPPPLayoutRoute>
              </AuthenticatedLayout>
            </PrivateRoute>
          } />
          <Route path="/alumno/ppp" element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <PPPStudentMyTramite />
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

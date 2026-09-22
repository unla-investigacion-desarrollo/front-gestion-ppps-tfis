import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, updateUserProfile } from '../redux/features/auth';
import { userService } from '../services/userService';

export interface UserProfileData {
  id: string | number;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  nombre?: string;
  apellido?: string;
  role?: string;
  isTutor?: boolean;
  [key: string]: any;
}

export const useUserProfile = () => {
  const dispatch = useDispatch<any>();
  const reduxUser = useSelector(selectCurrentUser);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener usuario local si no está en Redux aún
  const user: UserProfileData | null = useMemo(() => {
    if (reduxUser && Object.keys(reduxUser).length > 0) return reduxUser;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [reduxUser]);

  // Extraer token de autenticación
  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }, []);

  // Consultar directamente a la base de datos: GET /users/:id/profile
  const refreshProfile = useCallback(async () => {
    const userId = user?.id || (user as any)?.sub;
    const authToken = token || localStorage.getItem('token');

    if (!userId || !authToken) return;

    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUserProfile(userId, authToken);
      if (data) {
        dispatch(updateUserProfile(data));
      }
    } catch (err: any) {
      console.warn('Error al consultar perfil desde la BD en useUserProfile:', err?.message);
      setError(err?.message || 'Error al consultar perfil');
    } finally {
      setLoading(false);
    }
  }, [user?.id, token, dispatch]);

  // Cargar perfil al montar o cambiar de usuario
  useEffect(() => {
    refreshProfile();
  }, [user?.id]);

  // Normalizar todos los roles posibles sin harcodeos
  const allRoles = useMemo(() => {
    const list: string[] = [];
    if (user?.role) list.push(String(user.role).toLowerCase().trim());
    if (user?.rol) list.push(String(user.rol).toLowerCase().trim());
    if (Array.isArray(user?.roles)) {
      user.roles.forEach((r: any) => {
        if (r) {
          const s = typeof r === 'string' ? r : r.authority || r.name || '';
          list.push(String(s).toLowerCase().trim());
        }
      });
    }
    return list;
  }, [user?.role, user?.rol, user?.roles]);

  const isAdmin = allRoles.some((r) =>
    r === 'admin' || r === 'administrador' || r === 'role_admin'
  );
  const isProfessor = !isAdmin && allRoles.some((r) =>
    r === 'professor' || r === 'docente' || r === 'teacher' || r === 'profesor' || r === 'role_professor' || r === 'role_teacher' || r === 'role_docente'
  );
  const isStudent = !isAdmin && !isProfessor && allRoles.some((r) =>
    r === 'student' || r === 'estudiante' || r === 'alumno' || r === 'alumna' || r === 'role_student'
  );

  const role = isAdmin ? 'admin' : isProfessor ? 'professor' : 'student';

  const isTutor = Boolean(user?.isTutor);

  let teacherType: 'tutor' | 'evaluador' = 'evaluador';
  if (isProfessor) {
    teacherType = isTutor ? 'tutor' : 'evaluador';
  }

  return {
    user,
    role,
    isTutor,
    isAdmin,
    isStudent,
    isProfessor,
    teacherType,
    loading,
    error,
    refreshProfile,
  };
};

export default useUserProfile;

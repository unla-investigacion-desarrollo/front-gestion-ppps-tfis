import { useEffect, createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  logout as logoutAction, 
  loginUser,
  selectIsAuthenticated 
} from '../../redux/slices/authSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const token = useSelector((state) => state.auth.token);

  // Sincroniza logout entre pestañas probar que funcione cuando cierra sesion no debe verse dashboard
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'token' && event.newValue === null) {
        dispatch(logoutAction());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [dispatch]);

  // Maneja la expiración automática basada en el token JWT del backend
  useEffect(() => {
    if (!token) return;

    const decodeJwt = (tokenStr) => {
      try {
        const base64Url = tokenStr.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (error) {
        console.error('Error decoding JWT token:', error);
        return null;
      }
    };

    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return;

    const expirationTimeMs = decoded.exp * 1000;
    const timeLeft = expirationTimeMs - Date.now();

    if (timeLeft <= 0) {
      dispatch(logoutAction());
      return;
    }

    const timer = setTimeout(() => {
      dispatch(logoutAction());
      const event = new CustomEvent('toast', {
        detail: { message: 'Tu sesión ha expirado por límite de tiempo.', type: 'error' }
      });
      window.dispatchEvent(event);
    }, timeLeft);

    return () => clearTimeout(timer);
  }, [token, dispatch]);

  const login = async (credentials) => {
    // Devolvemos el resultado del thunk (o lanza si falla)
    return dispatch(loginUser(credentials)).unwrap();
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;

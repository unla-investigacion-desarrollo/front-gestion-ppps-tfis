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

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './routes/App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

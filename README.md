# 🎓 Sistema de Gestión de TFI y PPP (Frontend)

Aplicación web para la gestión integral de **Trabajos Finales Integradores (TFI)** y **Prácticas Profesionales Supervisadas (PPP)** de la Universidad Nacional de Lanús (UNLa), con vistas diferenciadas según el rol del usuario.

---

## 🛠️ Tecnologías Principales

-  **React 19** (`19.1.0`) + **TypeScript**
-  **Vite 6** (`6.3.5`)
-  **React Router DOM 7** (`7.6.2`)
-  **Redux Toolkit** (`2.9.0`) & **React Redux** (`9.2.0`)
-  **React Icons** (`5.7.0`)
-  **Vitest** + **Testing Library**
-  **ESLint**

---

## 📁 Estructura del Proyecto

```text
src/
├── assets/          # Imágenes y recursos estáticos
├── auth/            # Guards de rutas (PrivateRoute, AdminRoute, TeacherRoute)
├── components/      # Layout autenticado, explorador de proyectos, ThemeToggle, paginación
├── hooks/           # Custom hooks (useAuth, useUserProfile, useProjectExplorer, usePPPProposals)
├── pages/
│   ├── Admin/       # Gestión de usuarios y cola de solicitudes (Approvals)
│   ├── Auth/        # Cambio y restablecimiento de contraseña (/change-password, /reset-password/:token)
│   ├── Dashboard/   # Paneles de Estudiante, Docente Evaluador y Docente Tutor
│   ├── Login/       # Inicio de sesión y recuperación de contraseña
│   ├── PPP/         # Convocatorias, postulaciones, trámites y detalle de expedientes PPP
│   ├── Projects/    # Alta de proyectos TFI
│   ├── Register/    # Registro de estudiantes
│   ├── Student/     # Ficha "Mi TFI" y entregas del estudiante
│   ├── Teacher/     # Gestión de TFI y listado de proyectos
│   └── Trabajo/     # Seguimiento de entregas, revisiones, calificaciones y tutorías
├── redux/           # Store, slices y asyncActions (auth, projects, ppp, users)
├── routes/          # Definición de rutas (App.jsx)
├── services/        # Clientes HTTP contra la API (/api/sg-ppp-tfi/v1)
├── styles/          # Estilos globales UNLa y soporte de tema oscuro (unla.css)
└── utils/           # Utilidades y notificaciones toast
```

---

## 🚀 Instalación y Desarrollo Local

### Requisitos Previos
- **Node.js** `18.x` o superior (recomendado `20.x` LTS)
- **npm** `9.x` o superior

### Pasos

1. Clonar el repositorio e ingresar a la carpeta:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd front-gestion-ppps-tfis
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Verificar variables de entorno en `.env`:
   ```env
   VITE_API_URL=/api/sg-ppp-tfi/v1
   ```
   En desarrollo (`npm run dev`), `vite.config.js` redirige automáticamente las peticiones `/api` hacia `http://localhost:3000`.

4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## 📜 Scripts Disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta el servidor de desarrollo de Vite con proxy a `localhost:3000` |
| `npm run build` | Compila la aplicación estática para producción en `dist/` |
| `npm run preview` | Previsualiza localmente el build de `dist/` |
| `npm run lint` | Ejecuta ESLint sobre el proyecto |
| `npm test` | Ejecuta los tests con Vitest (`vitest run`) |

---

## 🌐 Despliegue en Producción

El frontend genera archivos estáticos en la carpeta `dist/`. Antes de compilar para servidor, revisar:
- **[.env.production](.env.production)** para configurar `VITE_API_URL` si el backend está en un dominio distinto.
- **[DEPLOY.md](DEPLOY.md)** con el relevamiento técnico completo, configuración de proxy/CORS, regla de fallback SPA (`try_files $uri $uri/ /index.html`) y checklist para el equipo de Backend / Infraestructura.

---

## 👥 Funcionalidades por Rol

- **Estudiante:** Exploración y postulación a proyectos TFI y convocatorias PPP, seguimiento de entregas (*Mi TFI*, *Entrega de Trabajo*), solicitud de tutorías y gestión de trámite PPP (*Mi trámite*).
- **Profesor Tutor:** Panel de proyectos a cargo (*Mis proyectos*), confirmación de tutorías solicitadas, postulación a proyectos TFI disponibles y seguimiento de avances.
- **Profesor Evaluador:** Creación y edición de proyectos TFI, desvinculación de integrantes, revisión/observación/calificación de entregas, aprobación de solicitudes y gestión de convocatorias y expedientes PPP.
- **Administrador / Superadmin:** Gestión completa de usuarios (alta de docentes, edición de perfiles, activación/desactivación), eliminación de proyectos/propuestas y control integral de TFI y PPP.
- **General:** Autenticación JWT, recuperación y restablecimiento de contraseña (`/reset-password/:token`), y selector global de **Modo Claro / Oscuro**.

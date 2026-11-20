# Relevamiento y Guía de Despliegue — Frontend (Sistema de Gestión TFI y PPP)

Este documento resume los requisitos técnicos para desplegar el frontend en un servidor y los datos que debe completar el equipo de **Backend / Infraestructura**.

---

## 1. Información técnica del Frontend

- **Stack:** React 19 + Vite 6 + React Router 7 + Redux Toolkit + Bootstrap 5 (SPA estática).
- **Script de instalación:** `npm install` (o `npm ci`)
- **Script de compilación:** `npm run build`
- **Carpeta de salida (artefacto a servir):** `dist/` (archivos estáticos HTML/JS/CSS; **no** requiere Node.js corriendo en producción una vez compilado).
- **Prefijo base de la API esperado por el frontend:** `/api/sg-ppp-tfi/v1`

---

## 2. Requisitos previos del servidor

1. **Para compilar el proyecto (en CI o en el servidor de build):**
   - Node.js (v18+ o v20+ LTS) y `npm`.
2. **Para servir la aplicación compilada (`dist/`):**
   - Un servidor web estático o proxy reverso (por ejemplo **Nginx**, **Apache**, **Caddy**, o plataforma tipo Vercel/Netlify).
   - **Regla obligatoria de SPA (Fallback a `index.html`):** Todas las rutas del frontend (`/login`, `/dashboard`, `/reset-password/:token`, `/ppp/...`, `/docente/...`, etc.) son manejadas por `react-router-dom`. El servidor debe redirigir cualquier ruta que no sea un archivo estático ni `/api/` hacia `index.html` (código `200`).
     - Ejemplo en **Nginx**:
       ```nginx
       location / {
           try_files $uri $uri/ /index.html;
       }
       ```
3. **Certificado HTTPS (SSL/TLS):** Recomendado en producción para proteger credenciales y tokens JWT.

---

## 3. Cómo se conecta con el Backend (`VITE_API_URL`)

En Vite, la variable `VITE_API_URL` se **incrusta en tiempo de compilación** (`npm run build`). Hay dos esquemas posibles:

### Esquema A — Mismo dominio detrás de Proxy Reverso (recomendado)
- Se mantiene `VITE_API_URL=/api/sg-ppp-tfi/v1` (valor actual en `.env`).
- El servidor web (Nginx/Apache) redirige `/api/` al puerto interno del backend (ej. `http://127.0.0.1:3000`).
- **Ventaja:** No hay problemas de CORS y el mismo `dist/` sirve para cualquier dominio.
- Ejemplo en **Nginx**:
  ```nginx
  location /api/ {
      proxy_pass http://127.0.0.1:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

### Esquema B — Frontend y Backend en dominios distintos
- Antes de correr `npm run build`, descomentar y completar `.env.production`:
  ```env
  VITE_API_URL=https://api.tudominio.com/api/sg-ppp-tfi/v1
  ```
- El backend **debe habilitar CORS** permitiendo el origen del frontend (`https://<dominio-frontend>`), los métodos `GET, POST, PUT, PATCH, DELETE, OPTIONS` y el header `Authorization`.

---

## 4. Checklist para completar por el equipo de Backend / Infraestructura

Por favor completar estos puntos antes del despliegue:

- [ ] **URL pública del Frontend:** `________________________________________`
- [ ] **URL pública del Backend / API (con prefijo `/api/sg-ppp-tfi/v1`):** `________________________________________`
- [ ] **Esquema elegido:** `[ ] Mismo dominio con proxy /api`  |  `[ ] Dominios separados (requiere CORS + .env.production)`
- [ ] **CORS en Backend:** Confirmar que `origin` incluya la URL pública del Frontend y permita el header `Authorization`.
- [ ] **URL de recuperación de contraseña en emails (`forgot-password`):**
  - El enlace enviado por mail desde el backend debe apuntar a:
    `<URL_PUBLICA_FRONTEND>/reset-password/<token>`
  - *(El frontend ya tiene la ruta pública `/reset-password/:token` que llama a `POST /api/sg-ppp-tfi/v1/auth/reset-password/:token` con `{ newPassword }`.)*
- [ ] **Regla SPA en el servidor web:** Confirmado `try_files $uri $uri/ /index.html` (o equivalente) para que no dé `404` al recargar rutas internas.
- [ ] **Puertos y SSL:** Certificado HTTPS configurado y backend accesible desde el proxy/público.

---

## 5. Pasos de despliegue (resumen)

1. Ajustar `.env.production` si corresponde al **Esquema B**.
2. Ejecutar:
   ```bash
   npm ci
   npm run build
   ```
3. Publicar el contenido de la carpeta `dist/` en el servidor web.
4. Verificar que `GET <URL_FRONTEND>/` cargue la pantalla de Login y que `POST <VITE_API_URL>/auth/login` responda correctamente.

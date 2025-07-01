# 🎓 Sistema de Gestión de TFI

Sistema de gestión de Trabajos Finales de Investigación (TFI) desarrollado con React y Vite. Esta aplicación facilita la gestión de trabajos finales, permitiendo a los usuarios interactuar con diferentes funcionalidades según su rol.

## Tecnologías Principales

- ⚛️ React 19.1.0
- 🛣️ React Router DOM 7.6.2
- ⚡ Vite 6.3.5
- 🛠️ TypeScript
- 🔍 ESLint + Prettier
- 🎨 CSS Modules

## Estructura del Proyecto

```
src/
├── assets/         # Recursos estáticos (imágenes, fuentes, etc.)
├── auth/           # Lógica de autenticación y rutas protegidas
│   └── PrivateRoute.jsx  # Componente para rutas que requieren autenticación
├── components/     # Componentes reutilizables
├── hooks/          # Custom hooks personalizados
│   └── useAuth.jsx # Hook para manejar la autenticación
├── pages/          # Componentes de páginas
│   ├── Login/      # Página de inicio de sesión
│   ├── Dashboard/  # Panel principal
│   └── ...         # Otras páginas
├── routes/         # Configuración de enrutamiento
└── utils/          # Utilidades y helpers
```

## Instalación y Configuración

### Requisitos Previos
- Node.js 18.x o superior
- npm 9.x o superior

### Pasos de Instalación

1. Clonar el repositorio:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd Sistema-Gestion-TFI
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Para producción:
   ```bash
   npm run build
   npm run preview
   ```

## Sistema de Autenticación

- **Login/Logout**: Autenticación de usuarios con validación de credenciales
- **Rutas Protegidas**: Acceso restringido a usuarios autenticados
- **Persistencia de Sesión**: Los usuarios permanecen autenticados al recargar la página
- **Manejo de Tokens**: Almacenamiento seguro de tokens de autenticación

## Estructura de Componentes

- **Componentes Modulares**: Diseño basado en componentes reutilizables
- **Estilos con CSS Modules**: Estilos encapsulados para cada componente
- **Diseño Responsive**: Adaptable a diferentes tamaños de pantalla

## Características Principales

### Para Estudiantes
- Gestión de trabajos finales
- Seguimiento de avances
- Entrega de documentos

### Para Docentes
- Revisión de trabajos
- Asignación de calificaciones
- Comentarios y retroalimentación

### Para Administradores
- Gestión de usuarios
- Configuración del sistema
- Reportes y estadísticas

## Testing

Para ejecutar las pruebas:
```bash
npm test
```

## 🤝 Contribución

1. Haz un Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

[Tu Nombre] - [tu@email.com]

[![LinkedIn][linkedin-shield]][linkedin-url]

[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/tu-perfil

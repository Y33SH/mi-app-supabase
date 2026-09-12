# Climas Torres by YESH!

Prototipo de sistema web desarrollado para **Climas Torres**, un negocio dedicado a la instalación, mantenimiento, diagnóstico y reparación de equipos de aire acondicionado.

El proyecto fue creado como un avance funcional del sistema, integrando autenticación de usuarios, base de datos, solicitudes de servicio y un asistente virtual con inteligencia artificial.

## Sitio web

El prototipo puede visualizarse en:

https://y33sh.github.io/mi-app-supabase/

## Funcionalidades

- Registro de usuarios.
- Inicio y cierre de sesión.
- Inicio de sesión mediante correo y contraseña.
- Inicio de sesión mediante Google.
- Acceso mediante enlace enviado por correo.
- Cierre automático de sesión después de un periodo de inactividad.
- Dashboard principal.
- Menú de navegación.
- Formulario para solicitar servicios.
- Registro de solicitudes.
- Consulta del historial de solicitudes.
- Chat con asistente virtual.
- Respuestas mediante inteligencia artificial.
- Historial de mensajes.
- Diseño adaptable para diferentes pantallas.

## Servicios disponibles

El sistema permite solicitar:

- Mantenimiento.
- Reparación.
- Diagnóstico.
- Instalación de equipos de aire acondicionado.

## Autenticación

El sistema permite diferentes métodos de acceso para facilitar el uso de la plataforma.

```text
Correo y contraseña
        │
        ├── Google
        │
        └── Enlace por correo
                ↓
             Dashboard
```

También cuenta con cierre automático de sesión después de un periodo de inactividad.

## Inteligencia Artificial

El sistema incluye un asistente virtual de **Climas Torres** capaz de responder consultas de manera natural.

El asistente está orientado principalmente a temas como:

- Mantenimiento.
- Reparaciones.
- Instalaciones.
- Problemas comunes en equipos.
- Solicitudes de servicio.
- Información general relacionada con Climas Torres.

## Base de datos

El sistema utiliza una base de datos para administrar información relacionada con:

- Usuarios.
- Solicitudes de servicio.
- Datos de contacto.
- Tipo de servicio.
- Descripción del problema.
- Fecha solicitada.
- Estado de la solicitud.
- Mensajes del chat.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- Node.js
- Supabase
- Git
- GitHub
- GitHub Pages
- Visual Studio Code
- Inteligencia Artificial

## Estructura del proyecto

```text
mi-app-supabase/
│
├── css/
│   └── estilos.css
│
├── js/
│   ├── chat.js
│   ├── dashboard.js
│   ├── login.js
│   ├── registro.js
│   ├── servicios.js
│   ├── session-timeout.js
│   └── supabase.js
│
├── chat.html
├── dashboard.html
├── index.html
├── registro.html
├── servicios.html
│
├── index.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/Y33SH/mi-app-supabase.git
```

Entrar a la carpeta:

```bash
cd mi-app-supabase
```

Instalar las dependencias:

```bash
npm install
```

## Ejecución local

Para ejecutar el proyecto localmente:

```bash
npx live-server . --port=5500
```

Después abrir:

```text
http://127.0.0.1:5500/
```

También puede utilizarse la extensión **Live Server** de Visual Studio Code.

## Flujo principal

```text
Registro / Inicio de sesión
          ↓
       Dashboard
          ↓
   Solicitar servicio
          ↓
  Registrar solicitud
          ↓
 Consultar solicitudes
          ↓
      Chat con IA
```

## Seguridad

El sistema utiliza mecanismos de autenticación y control de acceso para proteger las funciones principales de la aplicación.

Las credenciales privadas y configuraciones sensibles no forman parte del código público del repositorio.

## Estado del proyecto

Este sistema corresponde a un **prototipo funcional**.

Actualmente cuenta con las funciones principales necesarias para demostrar el funcionamiento del sistema.

Puede ampliarse posteriormente con características como:

- Panel administrativo.
- Asignación de técnicos.
- Cambio de estado de servicios.
- Cotizaciones.
- Notificaciones.
- Recuperación de contraseña.
- Gestión de perfiles.
- Galería de trabajos realizados.
- Historial de servicios.
- Roles de usuario.

## Autor

**Y33SH**

Proyecto académico desarrollado como prototipo de un sistema web para **Climas Torres**.
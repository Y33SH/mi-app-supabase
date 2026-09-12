# Climas Torres

Prototipo de sistema web desarrollado para **Climas Torres**, un negocio dedicado a la instalación, mantenimiento, diagnóstico y reparación de equipos de aire acondicionado.

El proyecto fue creado como un avance funcional del sistema, integrando autenticación, base de datos, solicitudes de servicio y un asistente virtual con inteligencia artificial.

## Funcionalidades

- Registro de usuarios.
- Inicio y cierre de sesión.
- Autenticación mediante Supabase Auth.
- Dashboard principal.
- Menú de navegación.
- Formulario para solicitar servicios.
- Registro de solicitudes en la base de datos.
- Consulta del historial de solicitudes.
- Chat con asistente virtual.
- Respuestas generadas mediante inteligencia artificial.
- Historial de mensajes almacenado en Supabase.
- Diseño adaptable y organizado para las diferentes interfaces.

## Servicios disponibles

El sistema permite solicitar:

- Mantenimiento.
- Reparación.
- Diagnóstico.
- Instalación de equipos de aire acondicionado.

## Inteligencia Artificial

El sistema cuenta con un asistente virtual de **Climas Torres** que puede responder preguntas de los usuarios de manera natural.

La comunicación funciona mediante:

```text
Usuario
   ↓
chat.html
   ↓
chat.js
   ↓
Supabase Edge Function
   ↓
Groq API
   ↓
Modelo de IA
   ↓
Respuesta al usuario
```

La clave privada de la API se almacena mediante **Supabase Edge Function Secrets**, por lo que no se encuentra expuesta dentro del código público del proyecto.

## Base de datos

El proyecto utiliza **Supabase** como plataforma de base de datos y autenticación.

Entre la información almacenada se encuentran:

- Usuarios autenticados.
- Solicitudes de servicio.
- Datos del cliente.
- Tipo de servicio.
- Fecha solicitada.
- Estado de la solicitud.
- Mensajes del chat.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- Node.js
- Supabase
- Supabase Auth
- Supabase Edge Functions
- Groq API
- Git
- GitHub
- Visual Studio Code

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

## Ejecución

Para visualizar el proyecto se recomienda utilizar **Live Server** desde Visual Studio Code.

Abrir:

```text
index.html
```

y seleccionar:

```text
Open with Live Server
```

## Flujo principal

```text
Registro
   ↓
Inicio de sesión
   ↓
Dashboard
   ↓
Solicitar servicio
   ↓
Guardar en Supabase
   ↓
Consultar solicitudes
   ↓
Chat con IA
```

## Seguridad

Las claves privadas utilizadas por servicios externos no se almacenan en el repositorio.

Las credenciales privadas se configuran mediante:

```text
Supabase
→ Edge Functions
→ Secrets
```

La aplicación utiliza las políticas de seguridad de Supabase para controlar el acceso a la información.

## Estado del proyecto

Este sistema corresponde a un **prototipo funcional**.

Actualmente cuenta con las funciones principales necesarias para demostrar el funcionamiento del sistema, pero todavía puede ampliarse con características como:

- Panel para administradores.
- Asignación de técnicos.
- Cambio de estado de los servicios.
- Cotizaciones.
- Notificaciones.
- Recuperación de contraseña.
- Gestión de perfiles.
- Galería de trabajos realizados.
- Panel administrativo para responder conversaciones.

## Autor

**Y33SH**

Proyecto académico desarrollado como prototipo de un sistema web para **Climas Torres**.
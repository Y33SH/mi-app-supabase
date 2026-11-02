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

## Roles y permisos

El sistema conserva el rol `user` para las cuentas normales, incluido el acceso mediante Google y enlace mágico. Hay dos roles de gestión:

- **Editor:** consulta, busca y filtra todas las solicitudes; puede corregir los datos de contacto/servicio y actualizar su estado. No puede administrar roles ni eliminar solicitudes.
- **Administrador:** tiene las funciones del editor, un resumen de actividad, consulta de usuarios, asignación de roles y eliminación de solicitudes. Puede generar un reporte imprimible de las solicitudes filtradas y guardarlo como PDF desde el diálogo de impresión del navegador, y administrar un directorio privado de proveedores y contratistas.
- **Admin y editor:** pueden cambiar su nombre visible en **Mi perfil**. El correo que utilizan para iniciar sesión no cambia.
- **Usuarios, editores y administradores:** pueden cargar una foto de perfil JPG, PNG o WebP de hasta 10 MB. Se muestra en su panel y los administradores también pueden verla en el listado de usuarios.

El directorio de proveedores/contratistas incluye tipo, contacto, empresa, teléfono, correo, dirección, productos/servicios y notas. Solo los administradores pueden consultarlo o modificarlo.

### Configuración en Supabase

1. Ejecuta el archivo [`supabase/roles.sql`](./supabase/roles.sql) en **Supabase → SQL Editor**. Si ya ejecutaste una versión anterior, vuelve a ejecutar el archivo actualizado para agregar estas funciones. Este asigna automáticamente `user` a cuentas nuevas, crea o actualiza el bucket privado `avatars` con límite de 10 MB y configura las políticas para que cada cuenta solo pueda cambiar su propia foto; solo el admin puede ver las fotos de los usuarios desde su panel.
2. Inicia sesión o registra la cuenta que será el primer administrador. En el SQL Editor, ejecuta la siguiente consulta sustituyendo el correo:

   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE lower(email) = lower('admin@ejemplo.com');
   ```

   Confirma que la consulta actualizó una fila. Después, cierra sesión y vuelve a entrar para abrir el panel de administración.
3. Para dar acceso de editor, la persona primero debe registrarse/iniciar sesión. Un administrador puede cambiar su rol desde **Usuarios y roles**.

La asignación inicial es manual para impedir que alguien se convierta en administrador desde el formulario público. Los permisos se verifican también en Supabase; ocultar una sección del panel no es la única protección.

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
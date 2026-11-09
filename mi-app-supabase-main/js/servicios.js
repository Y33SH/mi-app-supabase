import { supabase } from './supabase.js'
import { obtenerAccesoActual } from './roles.js'
import './session-timeout.js'

const formulario = document.getElementById('servicioForm')
const mensaje = document.getElementById('mensajeServicio')
const listaServicios = document.getElementById('listaServicios')
const cerrarSesion = document.getElementById('cerrarSesion')
const navSolicitarServicio = document.getElementById('navSolicitarServicio')
const navMisServicios = document.getElementById('navMisServicios')

let usuarioActual = null

function actualizarNavegacionActiva() {
    const mostrandoHistorial = window.location.hash === '#mis-servicios'

    navSolicitarServicio.classList.toggle('activo', !mostrandoHistorial)
    navMisServicios.classList.toggle('activo', mostrandoHistorial)

    if (mostrandoHistorial) {
        navSolicitarServicio.removeAttribute('aria-current')
        navMisServicios.setAttribute('aria-current', 'location')
        return
    }

    navSolicitarServicio.setAttribute('aria-current', 'page')
    navMisServicios.removeAttribute('aria-current')
}

actualizarNavegacionActiva()
window.addEventListener('hashchange', actualizarNavegacionActiva)


async function verificarUsuario() {

    let acceso

    try {
        acceso = await obtenerAccesoActual()
    } catch (error) {
        console.error('No se pudo verificar el rol del usuario:', error)
        mensaje.textContent =
            'No se pudo verificar tu acceso. Contacta al administrador.'
        return
    }

    if (!acceso) {
        window.location.href = 'index.html'
        return
    }

    if (acceso.role !== 'user') {
        window.location.href = 'panel.html'
        return
    }

    usuarioActual = acceso.session.user

    cargarServicios()
}


formulario.addEventListener('submit', async (e) => {

    e.preventDefault()

    if (!usuarioActual) {
        mensaje.textContent = 'Espera a que se verifique tu sesión.'
        return
    }

    const nombre = document.getElementById('nombre').value
    const telefono = document.getElementById('telefono').value
    const direccion = document.getElementById('direccion').value
    const tipoServicio = document.getElementById('tipoServicio').value
    const fecha = document.getElementById('fecha').value
    const descripcion = document.getElementById('descripcion').value

    mensaje.textContent = 'Enviando solicitud...'

    const { error } = await supabase
        .from('solicitudes')
        .insert({
            usuario_id: usuarioActual.id,
            nombre: nombre,
            telefono: telefono,
            direccion: direccion,
            tipo_servicio: tipoServicio,
            descripcion: descripcion,
            fecha: fecha
        })

    if (error) {

        console.error(error)

        mensaje.textContent =
            'Ocurrió un error al guardar la solicitud.'

        return
    }

    mensaje.textContent =
        'Solicitud enviada correctamente.'

    formulario.reset()

    cargarServicios()
})


async function cargarServicios() {

    const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .order('created_at', {
            ascending: false
        })

    if (error) {

        console.error(error)

        listaServicios.innerHTML =
            '<p>No se pudieron cargar las solicitudes.</p>'

        return
    }

    if (data.length === 0) {

        listaServicios.innerHTML =
            '<p class="sin-servicios">Todavía no tienes solicitudes registradas.</p>'

        return
    }

    listaServicios.innerHTML = ''

    data.forEach(servicio => {

        const tarjeta = document.createElement('article')

        tarjeta.classList.add('solicitud-card')

        const encabezado = document.createElement('div')
        encabezado.className = 'solicitud-top'

        const detallesPrincipales = document.createElement('div')
        const tipoServicio = document.createElement('span')
        tipoServicio.className = 'tipo-servicio'
        tipoServicio.textContent = servicio.tipo_servicio || ''

        const nombre = document.createElement('h3')
        nombre.textContent = servicio.nombre || ''
        detallesPrincipales.append(tipoServicio, nombre)

        const estado = document.createElement('span')
        estado.className = 'estado-servicio'
        estado.textContent = servicio.estado || ''
        encabezado.append(detallesPrincipales, estado)

        const descripcion = document.createElement('p')
        descripcion.textContent = servicio.descripcion || 'Sin descripción'

        const detalles = document.createElement('div')
        detalles.className = 'solicitud-datos'
        ;[
            `📅 ${servicio.fecha || 'Sin fecha'}`,
            `📞 ${servicio.telefono || 'Sin teléfono'}`,
            `📍 ${servicio.direccion || 'Sin dirección'}`
        ].forEach((texto) => {
            const dato = document.createElement('span')
            dato.textContent = texto
            detalles.append(dato)
        })

        tarjeta.append(encabezado, descripcion, detalles)

        listaServicios.appendChild(tarjeta)
    })
}


cerrarSesion.addEventListener('click', async () => {

    await supabase.auth.signOut()

    window.location.href = 'index.html'
})


verificarUsuario()
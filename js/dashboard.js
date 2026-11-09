import { supabase } from './supabase.js'
import { obtenerAccesoActual } from './roles.js'
import {
    configurarCargaAvatar,
    mostrarAvatar
} from './profile-avatar.js'
import './session-timeout.js'

const correoUsuario = document.getElementById('correoUsuario')
const cerrarSesion = document.getElementById('cerrarSesion')
const avatarImagen = document.getElementById('avatarImagen')
const avatarAlternativa = document.getElementById('avatarAlternativa')
const avatarPreview = document.getElementById('avatarPreview')
const avatarPreviewAlternativa =
    document.getElementById('avatarPreviewAlternativa')
const avatarArchivo = document.getElementById('avatarArchivo')
const mensajePerfil = document.getElementById('mensajePerfil')
const listaPagos = document.getElementById('listaPagos')
const mensajePago = document.getElementById('mensajePago')

const formatoMoneda = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
})

async function verificarUsuario() {

    let acceso

    try {
        acceso = await obtenerAccesoActual()
    } catch (error) {
        console.error('No se pudo verificar el rol del usuario:', error)
        correoUsuario.textContent =
            'No se pudo verificar tu acceso. Contacta al administrador.'
        return
    }

    if (!acceso) {
        window.location.href = 'index.html'
        return
    }

    if (acceso.role === 'admin' || acceso.role === 'editor') {
        window.location.href = 'panel.html'
        return
    }

    if (acceso.role !== 'user') {
        correoUsuario.textContent = 'Tu cuenta no tiene un rol válido.'
        return
    }

    const { data: perfil, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_path')
        .eq('id', acceso.session.user.id)
        .single()

    if (error) {
        console.error('No se pudo cargar el perfil:', error)
        correoUsuario.textContent = acceso.session.user.email
        return
    }

    correoUsuario.textContent = perfil.display_name
        ? `${perfil.display_name} · ${acceso.session.user.email}`
        : acceso.session.user.email
    try {
        await Promise.all([
            mostrarAvatar(perfil.avatar_path, avatarImagen, avatarAlternativa),
            mostrarAvatar(
                perfil.avatar_path,
                avatarPreview,
                avatarPreviewAlternativa
            )
        ])
    } catch (error) {
        console.error('No se pudo mostrar la foto de perfil:', error)
    }
    configurarCargaAvatar({
        input: avatarArchivo,
        obtenerUserId: () => acceso.session.user.id,
        avatar: avatarImagen,
        alternativa: avatarAlternativa,
        preview: avatarPreview,
        previewAlternativa: avatarPreviewAlternativa,
        mensaje: mensajePerfil,
        rutaInicial: perfil.avatar_path
    })
    await cargarPagos()
    await actualizarPagosAlRegresar()
}

async function cargarPagos() {
    const { data: solicitudes, error } = await supabase
        .from('solicitudes')
        .select('id, tipo_servicio, fecha, cotizacion_mxn, pago_estado')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('No se pudieron cargar las cotizaciones:', error)
        listaPagos.replaceChildren(
            crearMensajePago('No se pudieron cargar tus cotizaciones.')
        )
        return
    }

    listaPagos.replaceChildren()

    const cotizaciones = solicitudes.filter((solicitud) =>
        Number(solicitud.cotizacion_mxn) > 0
    )

    if (cotizaciones.length === 0) {
        listaPagos.append(
            crearMensajePago('Cuando el negocio autorice una cotización, aparecerá aquí.')
        )
        return
    }

    cotizaciones.forEach((solicitud) => {
        const tarjeta = document.createElement('article')
        tarjeta.className = 'pago-card'
        tarjeta.dataset.solicitudId = String(solicitud.id)
        const detalles = document.createElement('div')
        detalles.className = 'pago-card-details'

        const titulo = document.createElement('h3')
        titulo.textContent = solicitud.tipo_servicio || 'Servicio'
        const fecha = document.createElement('p')
        fecha.textContent = `Fecha solicitada: ${solicitud.fecha || 'Sin fecha'}`
        const importe = document.createElement('strong')
        importe.textContent = formatoMoneda.format(
            Number(solicitud.cotizacion_mxn)
        )
        const estado = document.createElement('span')
        estado.className = `pago-estado ${
            solicitud.pago_estado === 'pagado' ? 'pago-aprobado' : ''
        }`
        estado.textContent = solicitud.pago_estado === 'pagado'
            ? 'Pagado'
            : 'Pendiente de pago'
        detalles.append(titulo, fecha, importe, estado)
        tarjeta.append(detalles)

        if (solicitud.pago_estado !== 'pagado') {
            const botonPagar = document.createElement('button')
            botonPagar.type = 'button'
            botonPagar.className = 'boton-pagar'
            botonPagar.textContent = 'Pagar con Mercado Pago'
            botonPagar.addEventListener('click', () =>
                iniciarPago(solicitud.id, botonPagar)
            )
            tarjeta.append(botonPagar)
        }

        listaPagos.append(tarjeta)
    })
}

function crearMensajePago(texto) {
    const mensaje = document.createElement('p')
    mensaje.className = 'sin-pagos'
    mensaje.textContent = texto
    return mensaje
}

async function iniciarPago(solicitudId, boton) {
    boton.disabled = true
    mensajePago.textContent = 'Preparando el pago seguro...'

    try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            throw error
        }

        if (!session) {
            window.location.href = 'index.html'
            return
        }

        const respuesta = await fetch('/api/crear-pago', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ solicitudId: String(solicitudId) })
        })
        const resultado = await respuesta.json()

        if (!respuesta.ok) {
            throw new Error(resultado.error || 'No se pudo iniciar el pago.')
        }

        window.location.assign(resultado.checkoutUrl)
    } catch (error) {
        console.error('No se pudo iniciar el pago:', error)
        mensajePago.textContent =
            error.message || 'No se pudo iniciar el pago. Inténtalo más tarde.'
        boton.disabled = false
    }
}

async function actualizarPagosAlRegresar() {
    const parametros = new URLSearchParams(window.location.search)
    const solicitudId = parametros.get('solicitud_id')
    const estadoRegreso =
        parametros.get('collection_status') || parametros.get('status')
    if (!solicitudId
        || (!parametros.has('collection_status')
            && !parametros.has('payment_id')
            && !parametros.has('collection_id'))) {
        return
    }

    if (estadoRegreso === 'rejected') {
        mensajePago.textContent =
            'El pago no se completó. Puedes intentarlo de nuevo desde esta sección.'
        window.history.replaceState(
            {},
            '',
            window.location.pathname + window.location.hash
        )
        return
    }

    mensajePago.textContent =
        'Estamos confirmando el resultado con Mercado Pago. Esta pantalla se actualizará en unos segundos.'
    window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    for (let intento = 0; intento < 6; intento += 1) {
        await new Promise((resolver) => window.setTimeout(resolver, 3000))
        await cargarPagos()
        const pagoConfirmado = Array.from(listaPagos.children).some((tarjeta) =>
            tarjeta.dataset.solicitudId === solicitudId
            && tarjeta.querySelector('.pago-aprobado')
        )
        if (pagoConfirmado) {
            mensajePago.textContent = 'Pago confirmado. ¡Gracias!'
            return
        }
    }
    mensajePago.textContent =
        'El pago aún está pendiente de confirmación. Actualiza esta página en un momento.'
}

cerrarSesion.addEventListener('click', async () => {

    await supabase.auth.signOut()

    window.location.href = 'index.html'
})

verificarUsuario()
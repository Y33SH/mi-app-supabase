import { supabase } from './supabase.js'
import { obtenerAccesoActual } from './roles.js'
import {
    configurarCargaAvatar,
    mostrarAvatar
} from './profile-avatar.js'
import './session-timeout.js'

const correoUsuario = document.getElementById('correoUsuario')
const rolUsuario = document.getElementById('rolUsuario')
const mensajePanel = document.getElementById('mensajePanel')
const listaSolicitudes = document.getElementById('listaSolicitudes')
const buscarSolicitud = document.getElementById('buscarSolicitud')
const filtroEstado = document.getElementById('filtroEstado')
const filtroTipo = document.getElementById('filtroTipo')
const filtroFechaDesde = document.getElementById('filtroFechaDesde')
const filtroFechaHasta = document.getElementById('filtroFechaHasta')
const exportarPdf = document.getElementById('exportarPdf')
const totalSolicitudes = document.getElementById('totalSolicitudes')
const solicitudesPendientes = document.getElementById('solicitudesPendientes')
const solicitudesProceso = document.getElementById('solicitudesProceso')
const solicitudesCompletadas = document.getElementById('solicitudesCompletadas')
const resumenUsuarios = document.getElementById('resumenUsuarios')
const totalUsuarios = document.getElementById('totalUsuarios')
const seccionUsuarios = document.getElementById('usuarios')
const enlaceUsuarios = document.getElementById('enlaceUsuarios')
const listaUsuarios = document.getElementById('listaUsuarios')
const perfilForm = document.getElementById('perfilForm')
const nombreVisible = document.getElementById('nombreVisible')
const avatarImagen = document.getElementById('avatarImagen')
const avatarAlternativa = document.getElementById('avatarAlternativa')
const avatarPreview = document.getElementById('avatarPreview')
const avatarPreviewAlternativa =
    document.getElementById('avatarPreviewAlternativa')
const avatarArchivo = document.getElementById('avatarArchivo')
const mensajePerfil = document.getElementById('mensajePerfil')
const enlaceDirectorio = document.getElementById('enlaceDirectorio')
const seccionDirectorio = document.getElementById('directorio')
const directorioForm = document.getElementById('directorioForm')
const listaDirectorio = document.getElementById('listaDirectorio')
const buscarContacto = document.getElementById('buscarContacto')
const filtroContactoTipo = document.getElementById('filtroContactoTipo')
const cancelarEdicionContacto = document.getElementById('cancelarEdicionContacto')
const cerrarSesion = document.getElementById('cerrarSesion')
const sidebarToggle = document.getElementById('sidebarToggle')
const sidebarBackdrop = document.getElementById('sidebarBackdrop')
const themeToggle = document.getElementById('themeToggle')
const themeIcon = document.getElementById('themeIcon')
const topbarRole = document.getElementById('topbarRole')

let rolActual = null
let usuarioIdActual = null
let solicitudesActuales = []
let contactosActuales = []
let usuarioCorreoActual = ''

function crearTexto(tag, texto, clase) {
    const elemento = document.createElement(tag)
    elemento.textContent = texto || ''

    if (clase) {
        elemento.className = clase
    }

    return elemento
}

function crearIconoTicket(tipo) {
    const iconos = {
        calendar: '<rect x="3" y="4" width="18" height="17" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
        phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72l.45 3.1a2 2 0 0 1-.57 1.7L7.1 10.4a16 16 0 0 0 6 6l1.88-1.89a2 2 0 0 1 1.7-.57l3.1.45a2 2 0 0 1 1.72 2.53z"></path>',
        pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle>',
        airConditioner: '<rect x="3" y="4" width="18" height="10" rx="2"></rect><path d="M3 8h18M8 11h.01M16 11h.01M8 17v3M12 17v4M16 17v3"></path>'
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '1.7')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
    svg.setAttribute('aria-hidden', 'true')

    const template = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    template.innerHTML = iconos[tipo]
    svg.append(...template.childNodes)
    return svg
}

function claseEstado(estado) {
    const valor = (estado || '').toLocaleLowerCase()

    if (valor.includes('pend')) {
        return 'status-pending'
    }

    if (valor.includes('proceso') || valor.includes('curso')) {
        return 'status-progress'
    }

    if (valor.includes('complet') || valor.includes('finaliz')) {
        return 'status-complete'
    }

    return 'status-neutral'
}

async function cargarSolicitudes() {
    const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error cargando solicitudes:', error)
        listaSolicitudes.replaceChildren(
            crearTexto('p', 'No se pudieron cargar las solicitudes.')
        )
        return
    }

    solicitudesActuales = data
    actualizarResumenSolicitudes()
    actualizarOpcionesFiltro(filtroEstado, data.map((item) => item.estado))
    actualizarOpcionesFiltro(filtroTipo, data.map((item) => item.tipo_servicio))
    renderizarSolicitudes()
}

function actualizarResumenSolicitudes() {
    const contarEstado = (estado) =>
        solicitudesActuales.filter((solicitud) =>
            (solicitud.estado || '').toLocaleLowerCase().includes(estado)
        ).length

    totalSolicitudes.textContent = String(solicitudesActuales.length)
    solicitudesPendientes.textContent = String(contarEstado('pendiente'))
    solicitudesProceso.textContent = String(contarEstado('proceso'))
    solicitudesCompletadas.textContent = String(contarEstado('complet'))
}

function actualizarOpcionesFiltro(selector, valores) {
    const seleccionActual = selector.value
    const etiquetaInicial = selector === filtroEstado
        ? 'Todos los estados'
        : 'Todos los servicios'
    const valoresUnicos = [...new Set(valores.filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es'))

    selector.replaceChildren(new Option(etiquetaInicial, ''))
    valoresUnicos.forEach((valor) => {
        selector.append(new Option(valor, valor))
    })

    if (valoresUnicos.includes(seleccionActual)) {
        selector.value = seleccionActual
    }
}

function renderizarSolicitudes() {
    const solicitudesFiltradas = obtenerSolicitudesFiltradas()
    listaSolicitudes.replaceChildren()

    if (solicitudesActuales.length === 0) {
        listaSolicitudes.append(
            crearTexto('p', 'Todavía no hay solicitudes registradas.')
        )
        return
    }

    if (solicitudesFiltradas.length === 0) {
        listaSolicitudes.append(
            crearTexto('p', 'No hay solicitudes que coincidan con esos filtros.')
        )
        return
    }

    solicitudesFiltradas.forEach((solicitud) => {
        const tarjeta = document.createElement('article')
        tarjeta.className = 'solicitud-card ticket-card'
        tarjeta.dataset.requestId = String(solicitud.id)

        const encabezado = document.createElement('div')
        encabezado.className = 'ticket-header'
        const servicio = document.createElement('div')
        servicio.className = 'ticket-service'
        const iconoServicio = document.createElement('span')
        iconoServicio.className = 'ticket-service-icon'
        iconoServicio.append(crearIconoTicket('airConditioner'))
        servicio.append(
            iconoServicio,
            crearTexto('span', solicitud.tipo_servicio || 'Servicio', 'tipo-servicio')
        )
        encabezado.append(
            servicio,
            crearTexto(
                'span',
                solicitud.estado || 'Sin estado',
                `estado-servicio status-badge ${claseEstado(solicitud.estado)}`
            )
        )

        const contenido = document.createElement('div')
        contenido.className = 'ticket-content'
        contenido.append(
            crearTexto('h3', solicitud.nombre || 'Cliente'),
            crearTexto('p', solicitud.descripcion || 'Sin descripción proporcionada.')
        )

        const detalles = document.createElement('div')
        detalles.className = 'ticket-details'
        ;[
            ['calendar', 'Fecha', solicitud.fecha || 'Sin fecha'],
            ['phone', 'Teléfono', solicitud.telefono || 'Sin teléfono'],
            ['pin', 'Dirección', solicitud.direccion || 'Sin dirección']
        ].forEach(([icono, etiqueta, valor]) => {
            const dato = document.createElement('div')
            dato.className = 'ticket-detail'
            dato.append(crearIconoTicket(icono))
            const textoDato = document.createElement('span')
            textoDato.append(
                crearTexto('small', etiqueta),
                crearTexto('strong', valor)
            )
            dato.append(textoDato)
            detalles.append(dato)
        })

        tarjeta.append(encabezado, contenido, detalles)

        const formularioEstado = document.createElement('form')
        formularioEstado.className = 'form-estado ticket-status-form'
        formularioEstado.dataset.formType = 'status'
        const etiqueta = document.createElement('label')
        etiqueta.textContent = 'Estado'
        const entradaEstado = document.createElement('input')
        entradaEstado.name = 'estado'
        entradaEstado.maxLength = 100
        entradaEstado.required = true
        entradaEstado.value = solicitud.estado || ''
        etiqueta.append(entradaEstado)

        const botonGuardar = document.createElement('button')
        botonGuardar.type = 'submit'
        botonGuardar.className = 'button-primary'
        botonGuardar.textContent = 'Guardar estado'
        formularioEstado.append(etiqueta, botonGuardar)

        const botonEditar = document.createElement('button')
        botonEditar.type = 'button'
        botonEditar.dataset.action = 'edit-request'
        botonEditar.className = 'button-secondary'
        botonEditar.textContent = 'Editar solicitud'

        const acciones = document.createElement('div')
        acciones.className = 'ticket-actions'
        acciones.append(botonEditar)

        if (rolActual === 'admin') {
            const botonEliminar = document.createElement('button')
            botonEliminar.type = 'button'
            botonEliminar.dataset.action = 'delete-request'
            botonEliminar.className = 'button-danger'
            botonEliminar.textContent = 'Eliminar solicitud'
            acciones.append(botonEliminar)
        }

        const pie = document.createElement('div')
        pie.className = 'ticket-footer'
        pie.append(formularioEstado, crearFormularioCotizacion(solicitud), acciones)
        tarjeta.append(pie, crearFormularioEdicion(solicitud))

        listaSolicitudes.append(tarjeta)
    })
}

function crearFormularioCotizacion(solicitud) {
    const formulario = document.createElement('form')
    formulario.className = 'form-estado formulario-cotizacion'
    formulario.dataset.formType = 'quote'

    const etiqueta = document.createElement('label')
    etiqueta.textContent = 'Cotización (MXN)'
    const entrada = document.createElement('input')
    entrada.name = 'cotizacion_mxn'
    entrada.type = 'number'
    entrada.min = '1'
    entrada.max = '1000000'
    entrada.step = '0.01'
    entrada.required = true
    entrada.value = solicitud.cotizacion_mxn ?? ''
    const checkoutActivo = Boolean(solicitud.mercadopago_preference_id)
    entrada.disabled = solicitud.pago_estado === 'pagado' || checkoutActivo
    etiqueta.append(entrada)

    const boton = document.createElement('button')
    boton.type = 'submit'
    boton.className = 'button-primary'
    boton.textContent = solicitud.pago_estado === 'pagado'
        ? 'Cotización pagada'
        : checkoutActivo
            ? 'Checkout iniciado'
            : 'Publicar cotización'
    boton.disabled = solicitud.pago_estado === 'pagado' || checkoutActivo
    formulario.append(etiqueta, boton)
    return formulario
}

function obtenerSolicitudesFiltradas() {
    const busqueda = buscarSolicitud.value.trim().toLocaleLowerCase()
    const estadoSeleccionado = filtroEstado.value
    const tipoSeleccionado = filtroTipo.value
    const fechaDesde = filtroFechaDesde.value
    const fechaHasta = filtroFechaHasta.value

    return solicitudesActuales.filter((solicitud) => {
        const textoSolicitud = [
            solicitud.nombre,
            solicitud.telefono,
            solicitud.direccion,
            solicitud.tipo_servicio,
            solicitud.estado,
            solicitud.descripcion
        ].join(' ').toLocaleLowerCase()

        return (!busqueda || textoSolicitud.includes(busqueda))
            && (!estadoSeleccionado || solicitud.estado === estadoSeleccionado)
            && (!tipoSeleccionado || solicitud.tipo_servicio === tipoSeleccionado)
            && (!fechaDesde || solicitud.fecha >= fechaDesde)
            && (!fechaHasta || solicitud.fecha <= fechaHasta)
    })
}

function crearFormularioEdicion(solicitud) {
    const formulario = document.createElement('form')
    formulario.className = 'form-estado formulario-edicion'
    formulario.dataset.formType = 'edit'
    formulario.hidden = true

    const campos = [
        ['nombre', 'Nombre', 'text', solicitud.nombre, 160],
        ['telefono', 'Teléfono', 'tel', solicitud.telefono, 50],
        ['direccion', 'Dirección', 'text', solicitud.direccion, 300],
        ['fecha', 'Fecha', 'date', String(solicitud.fecha || '').slice(0, 10), null],
        ['descripcion', 'Descripción', 'text', solicitud.descripcion, 2000]
    ]

    campos.forEach(([nombre, texto, tipo, valor, maxLength]) => {
        const etiqueta = document.createElement('label')
        etiqueta.textContent = texto
        const entrada = nombre === 'descripcion'
            ? document.createElement('textarea')
            : document.createElement('input')

        if (entrada instanceof HTMLInputElement) {
            entrada.type = tipo
        } else {
            entrada.rows = 3
        }

        entrada.name = nombre
        entrada.required = nombre !== 'descripcion'
        entrada.value = valor || ''

        if (maxLength) {
            entrada.maxLength = maxLength
        }

        etiqueta.append(entrada)
        formulario.append(etiqueta)
    })

    const etiquetaTipo = document.createElement('label')
    etiquetaTipo.textContent = 'Tipo de servicio'
    const selectorTipo = document.createElement('select')
    selectorTipo.name = 'tipo_servicio'
    selectorTipo.required = true

    ;['Mantenimiento', 'Reparación', 'Instalación', 'Diagnóstico'].forEach((tipo) => {
        const opcion = new Option(tipo, tipo)
        opcion.selected = solicitud.tipo_servicio === tipo
        selectorTipo.append(opcion)
    })

    etiquetaTipo.append(selectorTipo)
    formulario.append(etiquetaTipo)

    const botonGuardar = document.createElement('button')
    botonGuardar.type = 'submit'
    botonGuardar.textContent = 'Guardar cambios'
    const botonCancelar = document.createElement('button')
    botonCancelar.type = 'button'
    botonCancelar.dataset.action = 'cancel-edit'
    botonCancelar.textContent = 'Cancelar'
    formulario.append(botonGuardar, botonCancelar)

    return formulario
}

function exportarReportePdf() {
    if (rolActual !== 'admin') {
        return
    }

    const solicitudes = obtenerSolicitudesFiltradas()

    if (filtroFechaDesde.value && filtroFechaHasta.value
        && filtroFechaDesde.value > filtroFechaHasta.value) {
        mensajePanel.textContent = 'La fecha inicial no puede ser posterior a la fecha final.'
        return
    }

    const ventanaReporte = window.open('', '_blank')

    if (!ventanaReporte) {
        mensajePanel.textContent =
            'El navegador bloqueó la ventana del reporte. Permite ventanas emergentes para descargar el PDF.'
        return
    }

    const documento = ventanaReporte.document
    documento.title = 'Reporte de solicitudes - Climas Torres'
    const estilo = documento.createElement('style')
    estilo.textContent = `
        body { font: 12px Arial, sans-serif; color: #172033; padding: 24px; }
        h1 { margin-bottom: 4px; color: #0b2b55; }
        p { color: #475569; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #eaf1fb; }
        tr { break-inside: avoid; }
        @page { size: landscape; margin: 12mm; }
    `
    documento.head.append(estilo)

    const encabezado = documento.createElement('h1')
    encabezado.textContent = 'Climas Torres — Reporte de solicitudes'
    documento.body.append(encabezado)

    const creado = documento.createElement('p')
    creado.textContent = `Generado: ${new Date().toLocaleString('es-MX')}`
    documento.body.append(creado)

    const filtros = documento.createElement('p')
    filtros.textContent = [
        `Resultados: ${solicitudes.length}`,
        filtroEstado.value ? `Estado: ${filtroEstado.value}` : 'Todos los estados',
        filtroTipo.value ? `Servicio: ${filtroTipo.value}` : 'Todos los servicios',
        filtroFechaDesde.value ? `Desde: ${filtroFechaDesde.value}` : '',
        filtroFechaHasta.value ? `Hasta: ${filtroFechaHasta.value}` : '',
        buscarSolicitud.value.trim()
            ? `Búsqueda: ${buscarSolicitud.value.trim()}`
            : ''
    ].filter(Boolean).join(' | ')
    documento.body.append(filtros)

    const tabla = documento.createElement('table')
    const encabezadoTabla = documento.createElement('thead')
    const filaEncabezado = documento.createElement('tr')
    ;['Fecha', 'Cliente', 'Teléfono', 'Dirección', 'Servicio', 'Estado', 'Descripción']
        .forEach((columna) => filaEncabezado.append(crearCeldaReporte(
            documento,
            columna,
            'th'
        )))
    encabezadoTabla.append(filaEncabezado)
    tabla.append(encabezadoTabla)

    const cuerpoTabla = documento.createElement('tbody')
    solicitudes.forEach((solicitud) => {
        const fila = documento.createElement('tr')
        ;[
            solicitud.fecha,
            solicitud.nombre,
            solicitud.telefono,
            solicitud.direccion,
            solicitud.tipo_servicio,
            solicitud.estado,
            solicitud.descripcion
        ].forEach((valor) => fila.append(crearCeldaReporte(documento, valor || '—')))
        cuerpoTabla.append(fila)
    })
    tabla.append(cuerpoTabla)
    documento.body.append(tabla)
    documento.close()

    setTimeout(() => {
        if (!ventanaReporte.closed) {
            ventanaReporte.print()
        }
    }, 500)
}

function crearCeldaReporte(documento, texto, etiqueta = 'td') {
    const celda = documento.createElement(etiqueta)
    celda.textContent = String(texto)
    return celda
}

async function cargarPerfil() {
    const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_path')
        .eq('id', usuarioIdActual)
        .single()

    if (error) {
        console.error('Error cargando perfil:', error)
        mensajePanel.textContent = 'No se pudo cargar tu nombre de perfil.'
        return
    }

    nombreVisible.value = data.display_name || ''
    try {
        await Promise.all([
            mostrarAvatar(data.avatar_path, avatarImagen, avatarAlternativa),
            mostrarAvatar(
                data.avatar_path,
                avatarPreview,
                avatarPreviewAlternativa
            )
        ])
    } catch (error) {
        console.error('No se pudo mostrar la foto de perfil:', error)
    }
    configurarCargaAvatar({
        input: avatarArchivo,
        obtenerUserId: () => usuarioIdActual,
        avatar: avatarImagen,
        alternativa: avatarAlternativa,
        preview: avatarPreview,
        previewAlternativa: avatarPreviewAlternativa,
        mensaje: mensajePerfil,
        rutaInicial: data.avatar_path
    })
}

async function cargarDirectorio() {
    const { data, error } = await supabase
        .from('contactos_negocio')
        .select('*')
        .order('nombre', { ascending: true })

    if (error) {
        console.error('Error cargando proveedores y contratistas:', error)
        listaDirectorio.replaceChildren(
            crearTexto('p', 'No se pudo cargar el directorio.')
        )
        return
    }

    contactosActuales = data
    renderizarDirectorio()
}

function renderizarDirectorio() {
    const busqueda = buscarContacto.value.trim().toLocaleLowerCase()
    const tipo = filtroContactoTipo.value
    const contactos = contactosActuales.filter((contacto) => {
        const texto = [
            contacto.nombre,
            contacto.empresa,
            contacto.servicios,
            contacto.telefono,
            contacto.email
        ].join(' ').toLocaleLowerCase()
        return (!busqueda || texto.includes(busqueda))
            && (!tipo || contacto.tipo === tipo)
    })

    listaDirectorio.replaceChildren()

    if (contactos.length === 0) {
        listaDirectorio.append(
            crearTexto('p', 'No hay registros que coincidan con la búsqueda.')
        )
        return
    }

    contactos.forEach((contacto) => {
        const tarjeta = document.createElement('article')
        tarjeta.className = 'solicitud-card'
        tarjeta.dataset.contactId = contacto.id
        tarjeta.append(
            crearTexto(
                'span',
                contacto.tipo === 'proveedor' ? 'Proveedor' : 'Contratista',
                'tipo-servicio'
            ),
            crearTexto('h3', contacto.empresa || contacto.nombre),
            crearTexto('p', `Contacto: ${contacto.nombre}`)
        )

        const datos = document.createElement('div')
        datos.className = 'solicitud-datos'
        ;[
            contacto.telefono && `Teléfono: ${contacto.telefono}`,
            contacto.email && `Correo: ${contacto.email}`,
            contacto.direccion && `Dirección: ${contacto.direccion}`,
            contacto.servicios && `Servicios/productos: ${contacto.servicios}`
        ].filter(Boolean).forEach((dato) => datos.append(crearTexto('span', dato)))
        tarjeta.append(datos)

        if (contacto.notas) {
            tarjeta.append(crearTexto('p', `Notas: ${contacto.notas}`))
        }

        const editar = document.createElement('button')
        editar.type = 'button'
        editar.dataset.action = 'edit-contact'
        editar.textContent = 'Editar'
        const eliminar = document.createElement('button')
        eliminar.type = 'button'
        eliminar.dataset.action = 'delete-contact'
        eliminar.textContent = 'Eliminar'
        tarjeta.append(editar, eliminar)
        listaDirectorio.append(tarjeta)
    })
}

function reiniciarFormularioDirectorio() {
    directorioForm.reset()
    document.getElementById('contactoId').value = ''
    document.getElementById('guardarContacto').textContent = 'Agregar registro'
    cancelarEdicionContacto.hidden = true
}

function aplicarTema(tema) {
    const temaActual = tema === 'dark' ? 'dark' : 'light'
    document.body.dataset.theme = temaActual
    themeIcon.textContent = temaActual === 'dark' ? '☀' : '☾'
    themeToggle.setAttribute(
        'aria-label',
        temaActual === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
    )
    localStorage.setItem('climas_torres_tema', temaActual)
}

function cerrarMenuMovil() {
    document.body.classList.remove('sidebar-open')
    sidebarBackdrop.hidden = true
    sidebarToggle.setAttribute('aria-expanded', 'false')
    sidebarToggle.setAttribute('aria-label', 'Abrir menú')
}

function activarNavegacion(hash = window.location.hash) {
    const seccion = hash.replace('#', '') || 'solicitudes'

    document.querySelectorAll('.panel-menu a[data-section]').forEach((enlace) => {
        enlace.classList.toggle('activo', enlace.dataset.section === seccion)
    })
}

async function cargarUsuarios() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, display_name, avatar_path')
        .order('email', { ascending: true })

    if (error) {
        console.error('Error cargando usuarios:', error)
        listaUsuarios.replaceChildren(
            crearTexto('p', 'No se pudieron cargar los usuarios.')
        )
        return
    }

    resumenUsuarios.hidden = false
    totalUsuarios.textContent = String(data.length)
    listaUsuarios.replaceChildren()

    if (data.length === 0) {
        listaUsuarios.append(crearTexto('p', 'No hay usuarios registrados.'))
        return
    }

    const cargasAvatar = []

    for (const usuario of data) {
        const tarjeta = document.createElement('article')
        tarjeta.className = 'solicitud-card'

        tarjeta.append(
            crearTexto('h3', usuario.display_name || usuario.email || 'Usuario'),
            crearTexto('p', usuario.email || 'Correo no disponible'),
            crearTexto('p', `Rol actual: ${usuario.role}`)
        )
        if (usuario.avatar_path) {
            const contenedorAvatar = document.createElement('div')
            contenedorAvatar.className = 'avatar avatar-usuario'
            const imagen = document.createElement('img')
            imagen.alt = `Foto de ${usuario.display_name || usuario.email}`
            const alternativa = document.createElement('span')
            alternativa.textContent = '👤'
            alternativa.setAttribute('aria-hidden', 'true')
            contenedorAvatar.append(imagen, alternativa)
            cargasAvatar.push(
                mostrarAvatar(usuario.avatar_path, imagen, alternativa)
                    .catch((error) => {
                        console.error(
                            `No se pudo mostrar la foto de ${usuario.email}:`,
                            error
                        )
                    })
            )
            tarjeta.prepend(contenedorAvatar)
        }

        const formularioRol = document.createElement('form')
        formularioRol.className = 'form-estado'
        formularioRol.dataset.userId = usuario.id

        const etiqueta = document.createElement('label')
        etiqueta.textContent = 'Asignar rol'
        const selector = document.createElement('select')
        selector.name = 'role'

        ;[
            ['user', 'Usuario'],
            ['editor', 'Editor'],
            ['admin', 'Administrador']
        ].forEach(([valor, texto]) => {
            const opcion = document.createElement('option')
            opcion.value = valor
            opcion.textContent = texto
            opcion.selected = usuario.role === valor
            selector.append(opcion)
        })

        etiqueta.append(selector)
        const botonGuardar = document.createElement('button')
        botonGuardar.type = 'submit'
        botonGuardar.textContent = 'Guardar rol'
        formularioRol.append(etiqueta, botonGuardar)
        tarjeta.append(formularioRol)
        listaUsuarios.append(tarjeta)
    }

    await Promise.all(cargasAvatar)
}

aplicarTema(localStorage.getItem('climas_torres_tema') || 'light')
themeToggle.addEventListener('click', () => {
    aplicarTema(document.body.dataset.theme === 'dark' ? 'light' : 'dark')
})

sidebarToggle.addEventListener('click', () => {
    const abrir = !document.body.classList.contains('sidebar-open')
    document.body.classList.toggle('sidebar-open', abrir)
    sidebarBackdrop.hidden = !abrir
    sidebarToggle.setAttribute('aria-expanded', String(abrir))
    sidebarToggle.setAttribute(
        'aria-label',
        abrir ? 'Cerrar menú' : 'Abrir menú'
    )
})

sidebarBackdrop.addEventListener('click', cerrarMenuMovil)
document.querySelectorAll('.panel-menu a[data-section]').forEach((enlace) => {
    enlace.addEventListener('click', () => {
        activarNavegacion(enlace.hash)
        cerrarMenuMovil()
    })
})
window.addEventListener('hashchange', () => activarNavegacion())

listaSolicitudes.addEventListener('submit', async (event) => {
    const formulario = event.target.closest('form')

    if (!formulario) {
        return
    }

    event.preventDefault()
    const tarjeta = formulario.closest('[data-request-id]')

    if (formulario.dataset.formType === 'edit') {
        await guardarEdicionSolicitud(formulario, tarjeta)
        return
    }

    if (formulario.dataset.formType === 'quote') {
        await guardarCotizacion(formulario, tarjeta)
        return
    }

    const estado = new FormData(formulario).get('estado').trim()
    const boton = formulario.querySelector('button')
    boton.disabled = true
    mensajePanel.textContent = 'Guardando estado...'

    const { error } = await supabase.rpc('actualizar_estado_solicitud', {
        p_solicitud_id: tarjeta.dataset.requestId,
        p_estado: estado
    })

    boton.disabled = false

    if (error) {
        console.error('Error actualizando estado:', error)
        mensajePanel.textContent = 'No se pudo actualizar el estado.'
        return
    }

    mensajePanel.textContent = 'Estado actualizado correctamente.'
    await cargarSolicitudes()
})

async function guardarCotizacion(formulario, tarjeta) {
    const boton = formulario.querySelector('[type="submit"]')
    const cotizacion = Number(new FormData(formulario).get('cotizacion_mxn'))
    boton.disabled = true
    mensajePanel.textContent = 'Publicando cotización...'

    const { error } = await supabase.rpc('actualizar_cotizacion_solicitud', {
        p_solicitud_id: tarjeta.dataset.requestId,
        p_cotizacion_mxn: cotizacion
    })

    if (error) {
        console.error('Error publicando cotización:', error)
        mensajePanel.textContent = 'No se pudo publicar la cotización.'
        boton.disabled = false
        return
    }

    mensajePanel.textContent = 'Cotización publicada. El cliente ya puede pagarla.'
    await cargarSolicitudes()
}

async function guardarEdicionSolicitud(formulario, tarjeta) {
    const valores = new FormData(formulario)
    const boton = formulario.querySelector('[type="submit"]')
    boton.disabled = true
    mensajePanel.textContent = 'Guardando cambios...'

    const { error } = await supabase.rpc('actualizar_solicitud', {
        p_solicitud_id: tarjeta.dataset.requestId,
        p_nombre: valores.get('nombre').trim(),
        p_telefono: valores.get('telefono').trim(),
        p_direccion: valores.get('direccion').trim(),
        p_tipo_servicio: valores.get('tipo_servicio'),
        p_fecha: valores.get('fecha'),
        p_descripcion: valores.get('descripcion').trim()
    })

    boton.disabled = false

    if (error) {
        console.error('Error editando solicitud:', error)
        mensajePanel.textContent = 'No se pudieron guardar los cambios.'
        return
    }

    mensajePanel.textContent = 'Solicitud actualizada correctamente.'
    await cargarSolicitudes()
}

listaSolicitudes.addEventListener('click', async (event) => {
    const botonEditar = event.target.closest('[data-action="edit-request"]')

    if (botonEditar) {
        const formulario = botonEditar
            .closest('[data-request-id]')
            .querySelector('[data-form-type="edit"]')
        formulario.hidden = !formulario.hidden
        botonEditar.textContent = formulario.hidden
            ? 'Editar solicitud'
            : 'Ocultar edición'
        return
    }

    const botonCancelar = event.target.closest('[data-action="cancel-edit"]')

    if (botonCancelar) {
        const formulario = botonCancelar.closest('form')
        formulario.reset()
        formulario.hidden = true
        formulario.closest('[data-request-id]')
            .querySelector('[data-action="edit-request"]')
            .textContent = 'Editar solicitud'
        return
    }

    const boton = event.target.closest('[data-action="delete-request"]')

    if (!boton || rolActual !== 'admin') {
        return
    }

    const tarjeta = boton.closest('[data-request-id]')

    if (!window.confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) {
        return
    }

    boton.disabled = true
    const { error } = await supabase.rpc('eliminar_solicitud_admin', {
        p_solicitud_id: tarjeta.dataset.requestId
    })

    if (error) {
        console.error('Error eliminando solicitud:', error)
        mensajePanel.textContent = 'No se pudo eliminar la solicitud.'
        boton.disabled = false
        return
    }

    mensajePanel.textContent = 'Solicitud eliminada.'
    await cargarSolicitudes()
})

buscarSolicitud.addEventListener('input', renderizarSolicitudes)
filtroEstado.addEventListener('change', renderizarSolicitudes)
filtroTipo.addEventListener('change', renderizarSolicitudes)
filtroFechaDesde.addEventListener('change', renderizarSolicitudes)
filtroFechaHasta.addEventListener('change', renderizarSolicitudes)
exportarPdf.addEventListener('click', exportarReportePdf)

perfilForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const nombre = nombreVisible.value.trim()

    if (!nombre || !usuarioIdActual) {
        return
    }

    const boton = perfilForm.querySelector('button[type="submit"]')
    boton.disabled = true
    const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: nombre })
        .eq('id', usuarioIdActual)
        .select('id')

    boton.disabled = false

    if (error || !data || data.length === 0) {
        console.error(
            'Error actualizando nombre visible:',
            error || new Error('No se actualizó el perfil.')
        )
        mensajePanel.textContent = 'No se pudo guardar el nombre.'
        return
    }

    correoUsuario.textContent = `${nombre} · ${usuarioCorreoActual}`
    mensajePanel.textContent = 'Nombre visible actualizado.'
})

directorioForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    if (rolActual !== 'admin') {
        return
    }

    const id = document.getElementById('contactoId').value
    const contacto = {
        tipo: document.getElementById('contactoTipo').value,
        nombre: document.getElementById('contactoNombre').value.trim(),
        empresa: document.getElementById('contactoEmpresa').value.trim() || null,
        telefono: document.getElementById('contactoTelefono').value.trim() || null,
        email: document.getElementById('contactoCorreo').value.trim() || null,
        direccion: document.getElementById('contactoDireccion').value.trim() || null,
        servicios: document.getElementById('contactoServicios').value.trim() || null,
        notas: document.getElementById('contactoNotas').value.trim() || null
    }
    const boton = document.getElementById('guardarContacto')
    boton.disabled = true
    const consulta = id
        ? supabase.from('contactos_negocio').update(contacto).eq('id', id).select('id')
        : supabase.from('contactos_negocio').insert(contacto).select('id')
    const { data, error } = await consulta
    boton.disabled = false

    if (error || !data || data.length === 0) {
        console.error(
            'Error guardando contacto:',
            error || new Error('No se guardó ningún registro.')
        )
        mensajePanel.textContent = 'No se pudo guardar el proveedor o contratista.'
        return
    }

    mensajePanel.textContent = id
        ? 'Registro actualizado correctamente.'
        : 'Registro agregado correctamente.'
    reiniciarFormularioDirectorio()
    await cargarDirectorio()
})

cancelarEdicionContacto.addEventListener('click', reiniciarFormularioDirectorio)
buscarContacto.addEventListener('input', renderizarDirectorio)
filtroContactoTipo.addEventListener('change', renderizarDirectorio)

listaDirectorio.addEventListener('click', async (event) => {
    if (rolActual !== 'admin') {
        return
    }

    const boton = event.target.closest('[data-action]')

    if (!boton) {
        return
    }

    const tarjeta = boton.closest('[data-contact-id]')
    const contacto = contactosActuales.find(
        (item) => item.id === tarjeta.dataset.contactId
    )

    if (!contacto) {
        return
    }

    if (boton.dataset.action === 'edit-contact') {
        document.getElementById('contactoId').value = contacto.id
        document.getElementById('contactoTipo').value = contacto.tipo
        document.getElementById('contactoNombre').value = contacto.nombre
        document.getElementById('contactoEmpresa').value = contacto.empresa || ''
        document.getElementById('contactoTelefono').value = contacto.telefono || ''
        document.getElementById('contactoCorreo').value = contacto.email || ''
        document.getElementById('contactoDireccion').value = contacto.direccion || ''
        document.getElementById('contactoServicios').value = contacto.servicios || ''
        document.getElementById('contactoNotas').value = contacto.notas || ''
        document.getElementById('guardarContacto').textContent = 'Guardar cambios'
        cancelarEdicionContacto.hidden = false
        directorioForm.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
    }

    if (boton.dataset.action !== 'delete-contact'
        || !window.confirm(`¿Eliminar el registro de ${contacto.nombre}?`)) {
        return
    }

    boton.disabled = true
    const { data, error } = await supabase
        .from('contactos_negocio')
        .delete()
        .eq('id', contacto.id)
        .select('id')

    if (error || !data || data.length === 0) {
        console.error(
            'Error eliminando contacto:',
            error || new Error('No se eliminó ningún registro.')
        )
        mensajePanel.textContent = 'No se pudo eliminar el registro.'
        boton.disabled = false
        return
    }

    mensajePanel.textContent = 'Registro eliminado.'
    await cargarDirectorio()
})

listaUsuarios.addEventListener('submit', async (event) => {
    const formulario = event.target.closest('form')

    if (!formulario) {
        return
    }

    event.preventDefault()

    if (rolActual !== 'admin') {
        return
    }

    const rol = new FormData(formulario).get('role')
    const boton = formulario.querySelector('button')
    boton.disabled = true
    mensajePanel.textContent = 'Guardando rol...'

    const { error } = await supabase.rpc('asignar_rol_usuario', {
        p_usuario_id: formulario.dataset.userId,
        p_rol: rol
    })

    if (error) {
        console.error('Error asignando rol:', error)
        mensajePanel.textContent = 'No se pudo asignar el rol.'
        boton.disabled = false
        return
    }

    if (formulario.dataset.userId === usuarioIdActual) {
        window.location.href =
            rol === 'user' ? 'dashboard.html' : 'panel.html'
        return
    }

    mensajePanel.textContent = 'Rol actualizado correctamente.'
    await cargarUsuarios()
})

cerrarSesion.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error('Error cerrando sesión:', error)
        mensajePanel.textContent = 'No se pudo cerrar la sesión.'
        return
    }

    window.location.href = 'index.html'
})

async function iniciarPanel() {
    try {
        const acceso = await obtenerAccesoActual()

        if (!acceso) {
            window.location.href = 'index.html'
            return
        }

        if (acceso.role === 'user') {
            window.location.href = 'dashboard.html'
            return
        }

        if (acceso.role !== 'admin' && acceso.role !== 'editor') {
            throw new Error('El perfil no tiene un rol válido.')
        }

        rolActual = acceso.role
        usuarioIdActual = acceso.session.user.id
        usuarioCorreoActual = acceso.session.user.email
        correoUsuario.textContent = usuarioCorreoActual
        rolUsuario.textContent =
            rolActual === 'admin' ? 'Administrador' : 'Editor'
        topbarRole.textContent = rolUsuario.textContent

        if (rolActual === 'admin') {
            exportarPdf.hidden = false
            seccionUsuarios.hidden = false
            enlaceUsuarios.hidden = false
            await cargarUsuarios()
            seccionDirectorio.hidden = false
            enlaceDirectorio.hidden = false
            await cargarDirectorio()
        }

        await cargarPerfil()
        if (nombreVisible.value) {
            correoUsuario.textContent =
                `${nombreVisible.value} · ${usuarioCorreoActual}`
        }
        await cargarSolicitudes()
    } catch (error) {
        console.error('No se pudo iniciar el panel:', error)
        mensajePanel.textContent =
            'No se pudo verificar tu acceso o cargar el panel. Contacta al administrador.'
        listaSolicitudes.replaceChildren()
    }
}

iniciarPanel()

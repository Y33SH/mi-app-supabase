import { supabase } from './supabase.js'
import './session-timeout.js'


// =========================================
// ELEMENTOS
// =========================================

const chatForm = document.getElementById('chatForm')
const mensajeInput = document.getElementById('mensajeInput')
const chatMensajes = document.getElementById('chatMensajes')
const cerrarSesion = document.getElementById('cerrarSesion')

let usuarioActual = null


// =========================================
// VERIFICAR SESIÓN
// =========================================

async function verificarUsuario() {

    const {
        data: { session }
    } = await supabase.auth.getSession()


    if (!session) {

        window.location.href = 'index.html'
        return
    }


    usuarioActual = session.user

    await cargarMensajes()
}


// =========================================
// CARGAR MENSAJES
// =========================================

async function cargarMensajes() {

    const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .order('created_at', {
            ascending: true
        })


    if (error) {

        console.error(
            'Error cargando mensajes:',
            error
        )

        return
    }


    chatMensajes.innerHTML = ''


    if (data.length === 0) {

        mostrarMensaje(
            'Hola 👋 Soy el asistente virtual de Climas Torres. ¿En qué puedo ayudarte?',
            'soporte'
        )

        return
    }


    data.forEach(mensaje => {

        mostrarMensaje(
            mensaje.mensaje,
            mensaje.remitente
        )
    })


    bajarChat()
}


// =========================================
// ENVIAR MENSAJE
// =========================================

chatForm.addEventListener(
    'submit',
    async (e) => {

        e.preventDefault()


        const texto =
            mensajeInput.value.trim()


        if (!texto) {
            return
        }


        mensajeInput.value = ''


        // Guardar mensaje del cliente
        const { error } = await supabase
            .from('mensajes')
            .insert({
                usuario_id: usuarioActual.id,
                mensaje: texto,
                remitente: 'cliente'
            })


        if (error) {

            console.error(
                'Error enviando mensaje:',
                error
            )

            return
        }


        await cargarMensajes()

        mostrarEscribiendo()


        // Pedir respuesta a la IA
        await pedirRespuestaIA(texto)
    }
)


// =========================================
// PEDIR RESPUESTA A LA IA
// =========================================

async function pedirRespuestaIA(mensaje) {

    try {

        // Obtener conversación reciente
        const {
            data: historial,
            error: errorHistorial
        } = await supabase
            .from('mensajes')
            .select(
                'mensaje, remitente, created_at'
            )
            .order('created_at', {
                ascending: true
            })


        if (errorHistorial) {

            throw errorHistorial
        }


        const historialReciente =
            historial.slice(-12)


        // Llamar Edge Function
        const {
            data,
            error
        } = await supabase
            .functions
            .invoke(
                'chat-ia',
                {
                    body: {
                        mensaje: mensaje,
                        historial: historialReciente
                    }
                }
            )


        quitarEscribiendo()


        if (error) {

            console.error(
                'Error en chat-ia:',
                error
            )


            await guardarRespuesta(
                'En este momento no pude conectarme con el asistente. Intenta nuevamente.'
            )

            return
        }


        if (!data?.respuesta) {

            console.error(
                'Respuesta inválida:',
                data
            )


            await guardarRespuesta(
                'No pude generar una respuesta en este momento.'
            )

            return
        }


        await guardarRespuesta(
            data.respuesta
        )

    } catch (error) {

        quitarEscribiendo()


        console.error(
            'Error comunicando con IA:',
            error
        )


        await guardarRespuesta(
            'Ocurrió un problema al comunicarme con el asistente. Intenta nuevamente.'
        )
    }
}


// =========================================
// GUARDAR RESPUESTA IA
// =========================================

async function guardarRespuesta(respuesta) {

    const { error } = await supabase
        .from('mensajes')
        .insert({
            usuario_id: usuarioActual.id,
            mensaje: respuesta,
            remitente: 'soporte'
        })


    if (error) {

        console.error(
            'Error guardando respuesta:',
            error
        )

        return
    }


    await cargarMensajes()
}


// =========================================
// MOSTRAR MENSAJE
// =========================================

function mostrarMensaje(
    texto,
    remitente
) {

    const contenedor =
        document.createElement('div')

    const burbuja =
        document.createElement('div')

    const nombre =
        document.createElement('strong')

    const mensaje =
        document.createElement('p')


    contenedor.classList.add('mensaje')

    burbuja.classList.add('burbuja')


    if (remitente === 'cliente') {

        contenedor.classList.add(
            'mensaje-cliente'
        )

        nombre.textContent = 'Tú'

    } else {

        contenedor.classList.add(
            'mensaje-soporte'
        )

        nombre.textContent =
            'Climas Torres'
    }


    mensaje.textContent = texto


    burbuja.appendChild(nombre)
    burbuja.appendChild(mensaje)

    contenedor.appendChild(burbuja)

    chatMensajes.appendChild(
        contenedor
    )


    bajarChat()
}


// =========================================
// MOSTRAR "ESCRIBIENDO..."
// =========================================

function mostrarEscribiendo() {

    quitarEscribiendo()


    const contenedor =
        document.createElement('div')

    const burbuja =
        document.createElement('div')


    contenedor.id = 'escribiendo'

    contenedor.className =
        'mensaje mensaje-soporte'


    burbuja.className = 'burbuja'

    burbuja.textContent =
        'Climas Torres está escribiendo...'


    contenedor.appendChild(burbuja)

    chatMensajes.appendChild(
        contenedor
    )


    bajarChat()
}


// =========================================
// QUITAR "ESCRIBIENDO..."
// =========================================

function quitarEscribiendo() {

    const escribiendo =
        document.getElementById(
            'escribiendo'
        )


    if (escribiendo) {

        escribiendo.remove()
    }
}


// =========================================
// SCROLL AUTOMÁTICO
// =========================================

function bajarChat() {

    chatMensajes.scrollTop =
        chatMensajes.scrollHeight
}


// =========================================
// CERRAR SESIÓN
// =========================================

cerrarSesion.addEventListener(
    'click',
    async () => {

        await supabase.auth.signOut()

        window.location.href =
            'index.html'
    }
)


// =========================================
// INICIAR
// =========================================

verificarUsuario()
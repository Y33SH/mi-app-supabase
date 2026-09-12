import { supabase } from './supabase.js'
import './session-timeout.js'

const formulario = document.getElementById('servicioForm')
const mensaje = document.getElementById('mensajeServicio')
const listaServicios = document.getElementById('listaServicios')
const cerrarSesion = document.getElementById('cerrarSesion')

let usuarioActual = null


async function verificarUsuario() {

    const {
        data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
        window.location.href = 'index.html'
        return
    }

    usuarioActual = session.user

    cargarServicios()
}


formulario.addEventListener('submit', async (e) => {

    e.preventDefault()

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

        tarjeta.innerHTML = `
            <div class="solicitud-top">
                <div>
                    <span class="tipo-servicio">
                        ${servicio.tipo_servicio}
                    </span>

                    <h3>
                        ${servicio.nombre}
                    </h3>
                </div>

                <span class="estado-servicio">
                    ${servicio.estado}
                </span>
            </div>

            <p>
                ${servicio.descripcion || 'Sin descripción'}
            </p>

            <div class="solicitud-datos">

                <span>
                    📅 ${servicio.fecha}
                </span>

                <span>
                    📞 ${servicio.telefono}
                </span>

                <span>
                    📍 ${servicio.direccion}
                </span>

            </div>
        `

        listaServicios.appendChild(tarjeta)
    })
}


cerrarSesion.addEventListener('click', async () => {

    await supabase.auth.signOut()

    window.location.href = 'index.html'
})


verificarUsuario()
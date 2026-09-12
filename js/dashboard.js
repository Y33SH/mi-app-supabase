import { supabase } from './supabase.js'

const correoUsuario = document.getElementById('correoUsuario')
const cerrarSesion = document.getElementById('cerrarSesion')

async function verificarUsuario() {

    const {
        data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
        window.location.href = 'index.html'
        return
    }

    correoUsuario.textContent = session.user.email
}

cerrarSesion.addEventListener('click', async () => {

    await supabase.auth.signOut()

    window.location.href = 'index.html'
})

verificarUsuario()
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
}

cerrarSesion.addEventListener('click', async () => {

    await supabase.auth.signOut()

    window.location.href = 'index.html'
})

verificarUsuario()
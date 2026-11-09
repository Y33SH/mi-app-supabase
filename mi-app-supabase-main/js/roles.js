import { supabase } from './supabase.js'

export async function obtenerAccesoActual() {
    const {
        data: { session },
        error: errorSesion
    } = await supabase.auth.getSession()

    if (errorSesion) {
        throw errorSesion
    }

    if (!session) {
        return null
    }

    const { data: perfil, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

    if (error) {
        throw error
    }

    return {
        session,
        role: perfil.role
    }
}

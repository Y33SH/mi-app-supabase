import { createClient } from '@supabase/supabase-js'

export function responder(res, status, body) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(status).json(body)
}

export function obtenerSupabaseAdmin() {
    const url = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRoleKey) {
        throw new Error('Falta configurar SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.')
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export async function verificarCliente(req, supabase) {
    const autorizacion = req.headers.authorization || ''
    const token = autorizacion.match(/^Bearer\s+(.+)$/i)?.[1]

    if (!token) {
        return { error: 'Inicia sesión para continuar.', status: 401 }
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
        return { error: 'La sesión no es válida. Vuelve a iniciar sesión.', status: 401 }
    }

    const { data: perfil, error: errorPerfil } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (errorPerfil) {
        throw errorPerfil
    }

    if (perfil.role !== 'user') {
        return { error: 'Esta función está disponible únicamente para clientes.', status: 403 }
    }

    return { user }
}

export function obtenerSiteUrl() {
    const siteUrl = process.env.SITE_URL
    if (!siteUrl) {
        throw new Error('Falta configurar SITE_URL.')
    }

    const url = new URL(siteUrl)
    if (url.protocol !== 'https:'
        && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
        throw new Error('SITE_URL debe usar HTTPS.')
    }

    return url.origin
}

export async function solicitarMercadoPago(ruta, opciones = {}) {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
        throw new Error('Falta configurar MERCADOPAGO_ACCESS_TOKEN.')
    }

    const respuesta = await fetch(`https://api.mercadopago.com${ruta}`, {
        ...opciones,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...opciones.headers
        }
    })
    const resultado = await respuesta.json()

    if (!respuesta.ok) {
        console.error('Error de la API de Mercado Pago:', respuesta.status, resultado)
        throw new Error('Mercado Pago no pudo procesar la solicitud.')
    }

    return resultado
}

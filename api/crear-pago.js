import {
    obtenerSiteUrl,
    obtenerSupabaseAdmin,
    responder,
    solicitarMercadoPago,
    verificarCliente
} from '../lib/pagos.js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return responder(res, 405, { error: 'Método no permitido.' })
    }

    let supabase
    let siteUrl
    try {
        supabase = obtenerSupabaseAdmin()
        siteUrl = obtenerSiteUrl()
    } catch (error) {
        console.error('Configuración de pagos incompleta:', error)
        return responder(res, 500, { error: 'El servicio de pago no está configurado.' })
    }

    try {
        const acceso = await verificarCliente(req, supabase)
        if (acceso.error) {
            return responder(res, acceso.status, { error: acceso.error })
        }

        const solicitudId = req.body?.solicitudId
        if (typeof solicitudId !== 'string' || solicitudId.length < 1 || solicitudId.length > 100) {
            return responder(res, 400, { error: 'La solicitud indicada no es válida.' })
        }

        const { data: solicitud, error } = await supabase
            .from('solicitudes')
            .select('id, tipo_servicio, cotizacion_mxn, pago_estado, mercadopago_preference_id')
            .eq('id', solicitudId)
            .eq('usuario_id', acceso.user.id)
            .single()

        if (error || !solicitud) {
            if (error) {
                console.error('No se pudo consultar la solicitud para cobrar:', error)
            }
            return responder(res, 404, { error: 'No se encontró la solicitud.' })
        }

        if (solicitud.pago_estado === 'pagado') {
            return responder(res, 409, { error: 'Esta cotización ya fue pagada.' })
        }

        const importe = Number(solicitud.cotizacion_mxn)
        if (solicitud.pago_estado !== 'pendiente'
            || !Number.isFinite(importe)
            || importe < 1
            || importe > 1000000) {
            return responder(res, 409, { error: 'Esta solicitud aún no tiene una cotización autorizada.' })
        }

        if (solicitud.mercadopago_preference_id) {
            const preferencia = await solicitarMercadoPago(
                `/checkout/preferences/${encodeURIComponent(solicitud.mercadopago_preference_id)}`
            )
            if (preferencia.init_point) {
                return responder(res, 200, { checkoutUrl: preferencia.init_point })
            }
            return responder(res, 502, { error: 'No se pudo recuperar el checkout. Contacta al negocio.' })
        }

        const preferencia = await solicitarMercadoPago('/checkout/preferences', {
            method: 'POST',
            body: JSON.stringify({
                items: [{
                    id: String(solicitud.id),
                    title: `Cotización de ${solicitud.tipo_servicio || 'servicio'} - Climas Torres`,
                    quantity: 1,
                    unit_price: importe,
                    currency_id: 'MXN'
                }],
                payer: acceso.user.email ? { email: acceso.user.email } : undefined,
                external_reference: String(solicitud.id),
                metadata: {
                    solicitud_id: String(solicitud.id),
                    user_id: acceso.user.id
                },
                notification_url: `${siteUrl}/api/mercadopago-webhook`,
                back_urls: {
                    success: `${siteUrl}/dashboard.html?solicitud_id=${encodeURIComponent(String(solicitud.id))}#pagos`,
                    pending: `${siteUrl}/dashboard.html?solicitud_id=${encodeURIComponent(String(solicitud.id))}#pagos`,
                    failure: `${siteUrl}/dashboard.html?solicitud_id=${encodeURIComponent(String(solicitud.id))}#pagos`
                },
                auto_return: 'approved'
            })
        })

        if (!preferencia.id || !preferencia.init_point) {
            console.error('Mercado Pago devolvió una preferencia incompleta:', preferencia)
            return responder(res, 502, { error: 'No se pudo crear el checkout de pago.' })
        }

        const { data: actualizada, error: errorActualizar } = await supabase
            .from('solicitudes')
            .update({ mercadopago_preference_id: String(preferencia.id) })
            .eq('id', solicitud.id)
            .eq('usuario_id', acceso.user.id)
            .eq('pago_estado', 'pendiente')
            .eq('cotizacion_mxn', importe)
            .is('mercadopago_preference_id', null)
            .select('id')
            .maybeSingle()

        if (errorActualizar) {
            console.error('No se pudo guardar la preferencia del pago:', errorActualizar)
            return responder(res, 500, { error: 'No se pudo preparar el pago. Inténtalo de nuevo.' })
        }

        if (!actualizada) {
            const { data: solicitudActualizada, error: errorActualizado } = await supabase
                .from('solicitudes')
                .select('cotizacion_mxn, pago_estado, mercadopago_preference_id')
                .eq('id', solicitud.id)
                .eq('usuario_id', acceso.user.id)
                .single()

            if (errorActualizado) {
                console.error('No se pudo comprobar el estado del checkout:', errorActualizado)
                return responder(res, 500, { error: 'No se pudo comprobar el estado del pago.' })
            }

            if (solicitudActualizada.pago_estado === 'pendiente'
                && Number(solicitudActualizada.cotizacion_mxn) === importe
                && solicitudActualizada.mercadopago_preference_id) {
                const checkoutExistente = await solicitarMercadoPago(
                    `/checkout/preferences/${encodeURIComponent(solicitudActualizada.mercadopago_preference_id)}`
                )
                if (checkoutExistente.init_point) {
                    return responder(res, 200, { checkoutUrl: checkoutExistente.init_point })
                }
            }

            return responder(res, 409, { error: 'La cotización cambió o ya no está disponible para pago.' })
        }

        return responder(res, 200, { checkoutUrl: preferencia.init_point })
    } catch (error) {
        console.error('Error iniciando checkout:', error)
        return responder(res, 500, { error: 'No se pudo iniciar el pago. Inténtalo más tarde.' })
    }
}

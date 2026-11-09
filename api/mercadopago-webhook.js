import { createHmac, timingSafeEqual } from 'node:crypto'
import {
    obtenerSupabaseAdmin,
    responder,
    solicitarMercadoPago
} from '../lib/pagos.js'

function firmaValida(req, paymentId) {
    const secreto = process.env.MERCADOPAGO_WEBHOOK_SECRET
    const firma = req.headers['x-signature']
    const requestId = req.headers['x-request-id']

    if (!secreto || typeof firma !== 'string' || typeof requestId !== 'string') {
        return false
    }

    const valores = Object.fromEntries(
        firma.split(',').map((parte) => parte.trim().split('=', 2))
    )
    if (!valores.ts || !valores.v1) {
        return false
    }

    const manifiesto = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${valores.ts};`
    const firmaEsperada = createHmac('sha256', secreto)
        .update(manifiesto)
        .digest('hex')
    const firmaRecibida = Buffer.from(valores.v1, 'hex')
    const firmaCalculada = Buffer.from(firmaEsperada, 'hex')

    return firmaRecibida.length === firmaCalculada.length
        && timingSafeEqual(firmaRecibida, firmaCalculada)
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return responder(res, 405, { error: 'Método no permitido.' })
    }

    if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
        console.error('Falta configurar MERCADOPAGO_WEBHOOK_SECRET.')
        return responder(res, 500, { error: 'El webhook no está configurado.' })
    }

    const paymentId = req.query?.['data.id'] || req.body?.data?.id
    if (!paymentId || !firmaValida(req, String(paymentId))) {
        return responder(res, 401, { error: 'Firma de notificación inválida.' })
    }

    const tipo = req.query?.type || req.body?.type
    if (tipo && tipo !== 'payment') {
        return responder(res, 200, { received: true })
    }

    try {
        const supabase = obtenerSupabaseAdmin()
        const pago = await solicitarMercadoPago(
            `/v1/payments/${encodeURIComponent(String(paymentId))}`
        )

        if (pago.status !== 'approved') {
            return responder(res, 200, { received: true })
        }

        const solicitudId = String(pago.external_reference || '')
        if (!solicitudId
            || !Number.isFinite(Number(pago.transaction_amount))
            || pago.currency_id !== 'MXN'
            || String(pago.metadata?.solicitud_id || solicitudId) !== solicitudId) {
            console.error('Pago aprobado con referencia o moneda no válidas:', pago.id)
            return responder(res, 422, { error: 'Los datos del pago no coinciden.' })
        }

        const { data: solicitud, error: errorSolicitud } = await supabase
            .from('solicitudes')
            .select('id, usuario_id, cotizacion_mxn, pago_estado, mercadopago_preference_id, mercadopago_payment_id')
            .eq('id', solicitudId)
            .single()

        if (errorSolicitud || !solicitud) {
            console.error('No se encontró la solicitud del pago:', errorSolicitud)
            return responder(res, 404, { error: 'No se encontró la solicitud.' })
        }

        const metadataUserId = pago.metadata?.user_id
        if (metadataUserId !== solicitud.usuario_id
            || String(pago.preference_id) !== solicitud.mercadopago_preference_id
            || Math.round(Number(solicitud.cotizacion_mxn) * 100)
                !== Math.round(Number(pago.transaction_amount) * 100)) {
            console.error('El importe o el cliente del pago no coincide con la cotización:', pago.id)
            return responder(res, 422, { error: 'El pago no coincide con la cotización.' })
        }

        if (solicitud.pago_estado === 'pagado') {
            if (solicitud.mercadopago_payment_id !== String(pago.id)) {
                console.error(
                    'Se recibió un segundo pago aprobado para una solicitud ya pagada; revisar posible reembolso:',
                    pago.id
                )
            }
            return responder(res, 200, { received: true })
        }

        const { data: actualizado, error: errorActualizar } = await supabase
            .from('solicitudes')
            .update({
                pago_estado: 'pagado',
                mercadopago_payment_id: String(pago.id)
            })
            .eq('id', solicitud.id)
            .eq('pago_estado', 'pendiente')
            .select('id')
            .maybeSingle()

        if (errorActualizar) {
            console.error('No se pudo registrar el pago confirmado:', errorActualizar)
            return responder(res, 500, { error: 'No se pudo registrar el pago.' })
        }

        if (!actualizado) {
            return responder(res, 409, { error: 'La solicitud cambió antes de registrar el pago.' })
        }

        return responder(res, 200, { received: true })
    } catch (error) {
        console.error('Error procesando notificación de Mercado Pago:', error)
        return responder(res, 500, { error: 'No se pudo procesar la notificación.' })
    }
}

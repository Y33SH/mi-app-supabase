import { supabase } from './supabase.js'

const BUCKET_AVATARES = 'avatars'
const TAMANO_MAXIMO = 10 * 1024 * 1024
const TIPOS_PERMITIDOS = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp']
])

export async function mostrarAvatar(ruta, imagen, alternativa) {
    imagen.onerror = () => {
        imagen.hidden = true
        alternativa.hidden = false
    }

    if (!ruta) {
        imagen.removeAttribute('src')
        imagen.hidden = true
        alternativa.hidden = false
        return
    }

    const { data, error } = await supabase.storage
        .from(BUCKET_AVATARES)
        .createSignedUrl(ruta, 60 * 60)

    if (error) {
        imagen.hidden = true
        alternativa.hidden = false
        throw error
    }

    const url = new URL(data.signedUrl)
    url.searchParams.set('v', String(Date.now()))
    imagen.src = url.href
    imagen.hidden = false
    alternativa.hidden = true
}

export async function subirAvatar(userId, archivo, rutaAnterior = null) {
    const extension = TIPOS_PERMITIDOS.get(archivo.type)

    if (!extension) {
        throw new Error('Elige una imagen JPG, PNG o WebP.')
    }

    if (archivo.size > TAMANO_MAXIMO) {
        throw new Error('La imagen debe pesar 10 MB o menos.')
    }

    const ruta = `${userId}/avatar.${extension}`
    const { error: errorCarga } = await supabase.storage
        .from(BUCKET_AVATARES)
        .upload(ruta, archivo, {
            cacheControl: '3600',
            contentType: archivo.type,
            upsert: true
        })

    if (errorCarga) {
        throw errorCarga
    }

    const { data, error: errorPerfil } = await supabase
        .from('profiles')
        .update({ avatar_path: ruta })
        .eq('id', userId)
        .select('id')

    if (errorPerfil || !data || data.length === 0) {
        if (ruta !== rutaAnterior) {
            const { error: errorLimpieza } = await supabase.storage
                .from(BUCKET_AVATARES)
                .remove([ruta])

            if (errorLimpieza) {
                console.error(
                    'No se pudo limpiar la imagen después del error:',
                    errorLimpieza
                )
            }
        }

        throw errorPerfil || new Error('No se pudo guardar la foto en el perfil.')
    }

    if (rutaAnterior && rutaAnterior !== ruta) {
        const { error: errorAnterior } = await supabase.storage
            .from(BUCKET_AVATARES)
            .remove([rutaAnterior])

        if (errorAnterior) {
            console.error('No se pudo quitar la foto anterior:', errorAnterior)
        }
    }

    return ruta
}

export function configurarCargaAvatar({
    input,
    obtenerUserId,
    avatar,
    alternativa,
    preview,
    previewAlternativa,
    mensaje,
    rutaInicial = null
}) {
    let rutaGuardada = rutaInicial
    let urlTemporal = null

    input.addEventListener('change', async () => {
        const archivo = input.files[0]

        if (!archivo) {
            return
        }

        const extension = TIPOS_PERMITIDOS.get(archivo.type)

        if (!extension || archivo.size > TAMANO_MAXIMO) {
            mensaje.textContent = !extension
                ? 'Elige una imagen JPG, PNG o WebP.'
                : 'La imagen debe pesar 10 MB o menos.'
            input.value = ''
            return
        }

        if (urlTemporal) {
            URL.revokeObjectURL(urlTemporal)
        }

        urlTemporal = URL.createObjectURL(archivo)
        preview.src = urlTemporal
        preview.hidden = false
        previewAlternativa.hidden = true
        input.disabled = true
        mensaje.textContent = 'Subiendo tu foto...'

        try {
            const ruta = await subirAvatar(
                obtenerUserId(),
                archivo,
                rutaGuardada
            )
            rutaGuardada = ruta
            try {
                await Promise.all([
                    mostrarAvatar(ruta, avatar, alternativa),
                    mostrarAvatar(ruta, preview, previewAlternativa)
                ])
                mensaje.textContent = 'Foto de perfil actualizada.'
            } catch (error) {
                console.error('La foto se guardó, pero no se pudo mostrar:', error)
                mensaje.textContent =
                    'La foto se guardó, pero no se pudo cargar la vista previa.'
            }
        } catch (error) {
            console.error('Error actualizando foto de perfil:', error)
            try {
                await Promise.all([
                    mostrarAvatar(rutaGuardada, avatar, alternativa),
                    mostrarAvatar(
                        rutaGuardada,
                        preview,
                        previewAlternativa
                    )
                ])
            } catch (errorAlRestaurar) {
                console.error('No se pudo restaurar la foto anterior:', errorAlRestaurar)
            }
            mensaje.textContent = error.message ||
                'No se pudo guardar la foto de perfil.'
        } finally {
            input.disabled = false
            input.value = ''

            if (urlTemporal) {
                URL.revokeObjectURL(urlTemporal)
                urlTemporal = null
            }
        }
    })
}

import { supabase } from './supabase.js'

// PARA PROBAR: 30 segundos
const TIEMPO_LIMITE = 30 * 1000

let temporizador

const baseUrl =
    new URL('../', import.meta.url).href

console.log('✅ Control de inactividad cargado')

function reiniciarTemporizador() {

    clearTimeout(temporizador)

    temporizador = setTimeout(
        cerrarSesionPorInactividad,
        TIEMPO_LIMITE
    )
}

async function cerrarSesionPorInactividad() {

    console.log('⏰ Tiempo de inactividad cumplido')

    await supabase.auth.signOut()

    window.location.href =
        `${baseUrl}index.html?sesion=expirada`
}

// Cualquier actividad reinicia los 30 segundos
[
    'click',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart'
].forEach(evento => {

    document.addEventListener(
        evento,
        reiniciarTemporizador,
        { passive: true }
    )
})

// Arranca el contador al entrar
reiniciarTemporizador()
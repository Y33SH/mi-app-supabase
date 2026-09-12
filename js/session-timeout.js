import { supabase } from './supabase.js'

// 10 minutos 
const TIEMPO_LIMITE = 10 * 60 * 1000

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

// Cualquier actividad reinicia los 10 minutos
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
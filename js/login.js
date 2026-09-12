import { supabase } from './supabase.js'


const formulario =
    document.getElementById('loginForm')

const mensaje =
    document.getElementById('mensaje')

const googleLogin =
    document.getElementById('googleLogin')

const magicLinkLogin =
    document.getElementById('magicLinkLogin')


// =========================================
// URL BASE DEL PROYECTO
// Funciona en local y en GitHub Pages
// =========================================

const baseUrl =
    new URL('./', window.location.href).href


// =========================================
// CORREO + CONTRASEÑA
// =========================================

formulario.addEventListener('submit', async (e) => {

    e.preventDefault()

    const correo =
        document.getElementById('correo').value.trim()

    const password =
        document.getElementById('password').value


    mensaje.textContent =
        'Iniciando sesión...'


    const { data, error } =
        await supabase.auth.signInWithPassword({

            email: correo,
            password: password

        })


    if (error) {

        mensaje.textContent =
            'Correo o contraseña incorrectos'

        console.error(error)

        return
    }


    console.log(
        'Usuario:',
        data.user
    )


    mensaje.textContent =
        'Inicio de sesión correcto'


    window.location.href =
        `${baseUrl}dashboard.html`
})


// =========================================
// GOOGLE
// =========================================

googleLogin.addEventListener('click', async () => {

    mensaje.textContent =
        'Abriendo Google...'


    const { error } =
        await supabase.auth.signInWithOAuth({

            provider: 'google',

            options: {

                redirectTo:
                    `${baseUrl}dashboard.html`

            }

        })


    if (error) {

        console.error(
            'Error Google:',
            error
        )

        mensaje.textContent =
            'No se pudo iniciar sesión con Google.'
    }

})


// =========================================
// ENLACE MÁGICO
// =========================================

magicLinkLogin.addEventListener('click', async () => {

    const correo =
        document.getElementById('correo').value.trim()


    if (!correo) {

        mensaje.textContent =
            'Primero escribe tu correo electrónico.'

        return
    }


    mensaje.textContent =
        'Enviando enlace de acceso...'


    const { error } =
        await supabase.auth.signInWithOtp({

            email: correo,

            options: {

                emailRedirectTo:
                    `${baseUrl}dashboard.html`

            }

        })


    if (error) {

        console.error(
            'Error Magic Link:',
            error
        )

        mensaje.textContent =
            'Error: ' + error.message

        return
    }


    mensaje.textContent =
        'Revisa tu correo. Te enviamos un enlace para iniciar sesión.'

})


// =========================================
// REDIRECCIÓN CUANDO SUPABASE INICIE SESIÓN
// =========================================

supabase.auth.onAuthStateChange((event, session) => {

    if (
        event === 'SIGNED_IN' &&
        session
    ) {

        window.location.href =
            `${baseUrl}dashboard.html`
    }

})
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
// Funciona en local y GitHub Pages
// =========================================

const baseUrl =
    new URL('./', window.location.href).href


// =========================================
// AVISO DE SESIÓN EXPIRADA
// =========================================

const parametros =
    new URLSearchParams(
        window.location.search
    )


if (
    parametros.get('sesion') ===
    'expirada'
) {

    mensaje.textContent =
        'Tu sesión expiró por inactividad. Inicia sesión nuevamente.'

    mensaje.style.color =
        '#dc2626'
}


// =========================================
// CORREO + CONTRASEÑA
// =========================================

formulario.addEventListener(
    'submit',
    async (e) => {

        e.preventDefault()


        const correo =
            document
                .getElementById('correo')
                .value
                .trim()


        const password =
            document
                .getElementById('password')
                .value


        mensaje.style.color =
            '#64748b'


        mensaje.textContent =
            'Iniciando sesión...'


        const {
            data,
            error
        } =
            await supabase.auth
                .signInWithPassword({

                    email: correo,
                    password: password

                })


        if (error) {

            mensaje.style.color =
                '#dc2626'

            mensaje.textContent =
                'Correo o contraseña incorrectos'

            console.error(error)

            return
        }


        console.log(
            'Usuario:',
            data.user
        )


        // Limpiar actividad anterior
        localStorage.removeItem(
            'climas_torres_ultima_actividad'
        )


        mensaje.style.color =
            '#16a34a'


        mensaje.textContent =
            'Inicio de sesión correcto'


        window.location.href =
            `${baseUrl}dashboard.html`
    }
)


// =========================================
// GOOGLE
// =========================================

googleLogin.addEventListener(
    'click',
    async () => {

        mensaje.style.color =
            '#64748b'


        mensaje.textContent =
            'Abriendo Google...'


        // Limpiar actividad de una sesión anterior
        localStorage.removeItem(
            'climas_torres_ultima_actividad'
        )


        const { error } =
            await supabase.auth
                .signInWithOAuth({

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


            mensaje.style.color =
                '#dc2626'


            mensaje.textContent =
                'No se pudo iniciar sesión con Google.'
        }
    }
)


// =========================================
// ENLACE MÁGICO
// =========================================

magicLinkLogin.addEventListener(
    'click',
    async () => {

        const correo =
            document
                .getElementById('correo')
                .value
                .trim()


        if (!correo) {

            mensaje.style.color =
                '#dc2626'


            mensaje.textContent =
                'Primero escribe tu correo electrónico.'

            return
        }


        mensaje.style.color =
            '#64748b'


        mensaje.textContent =
            'Enviando enlace de acceso...'


        const { error } =
            await supabase.auth
                .signInWithOtp({

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


            mensaje.style.color =
                '#dc2626'


            mensaje.textContent =
                'Error: ' + error.message

            return
        }


        mensaje.style.color =
            '#16a34a'


        mensaje.textContent =
            'Revisa tu correo. Te enviamos un enlace para iniciar sesión.'
    }
)


// =========================================
// REDIRECCIÓN CUANDO SUPABASE INICIE SESIÓN
// =========================================

supabase.auth.onAuthStateChange(
    (event, session) => {

        if (
            event === 'SIGNED_IN' &&
            session
        ) {

            localStorage.removeItem(
                'climas_torres_ultima_actividad'
            )


            window.location.href =
                `${baseUrl}dashboard.html`
        }
    }
)
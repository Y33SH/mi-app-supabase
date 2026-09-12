import { supabase } from './supabase.js'

const formulario = document.getElementById('loginForm')
const mensaje = document.getElementById('mensaje')

formulario.addEventListener('submit', async (e) => {

    e.preventDefault()

    const correo = document.getElementById('correo').value
    const password = document.getElementById('password').value

    mensaje.textContent = 'Iniciando sesión...'

    const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: password
    })

    if (error) {

        mensaje.textContent = 'Correo o contraseña incorrectos'

        console.error(error)

        return
    }

    console.log('Usuario:', data.user)

    mensaje.textContent = 'Inicio de sesión correcto'

    window.location.href = 'dashboard.html'
})
import { supabase } from './supabase.js'

const formulario = document.getElementById('registroForm')

const mensaje = document.getElementById('mensaje')

formulario.addEventListener('submit', async (e) => {

    e.preventDefault()

    const correo = document.getElementById('correo').value

    const password = document.getElementById('password').value

    mensaje.textContent = 'Creando cuenta...'

    const { data, error } = await supabase.auth.signUp({

        email: correo,

        password: password

    })

    if (error) {

        mensaje.textContent = error.message

        console.error(error)

        return
    }

    console.log(data)

    mensaje.textContent = 'Cuenta creada correctamente'

    setTimeout(() => {

        window.location.href = 'index.html'

    }, 1500)

})
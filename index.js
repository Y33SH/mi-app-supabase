import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qsnkzdbwqapuwcnjhwzq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbmt6ZGJ3cWFwdXdjbmpod3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzIxNDksImV4cCI6MjEwNDgwODE0OX0.K0svZdyoWbORRbuxNQfxn1DJVD-GuOKfm8c1r6hJMf8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function obtenerEstudiantes() {
    const { data, error } = await supabase
        .from('Estudiantes')
        .select('*')

    if (error) {
        console.log('Error:', error)
    } else {
        console.log('Datos:', data)
    }
}

obtenerEstudiantes()
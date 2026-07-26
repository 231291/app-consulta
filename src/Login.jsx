import { useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function Login() {
  const [modoRegistro, setModoRegistro] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function manejarEnvio(e) {
    e.preventDefault()
    setCargando(true)
    setMensaje('')

    if (modoRegistro) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } }
      })
      setMensaje(error ? 'Error: ' + error.message : '¡Cuenta creada! Ya puedes iniciar sesión.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMensaje('Error: ' + error.message)
    }
    setCargando(false)
  }

  return (
    <div className="login-shell">
      <p className="login-eyebrow">Consulta interna</p>
      <h1 className="login-title">Departamentos</h1>

      <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modoRegistro && (
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit" className="btn-principal" disabled={cargando}>
          {cargando ? 'Procesando...' : modoRegistro ? 'Registrarme' : 'Entrar'}
        </button>
      </form>

      {mensaje && <p className="mensaje-estado" style={{ textAlign: 'center' }}>{mensaje}</p>}

      <p className="login-switch">
        {modoRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
        <button onClick={() => setModoRegistro(!modoRegistro)}>
          {modoRegistro ? 'Inicia sesión' : 'Regístrate'}
        </button>
      </p>
    </div>
  )
}

export default Login

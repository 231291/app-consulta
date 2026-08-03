import { useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function manejarEnvio(e) {
    e.preventDefault()
    setCargando(true)
    setMensaje('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMensaje('Error: ' + error.message)
    setCargando(false)
  }

  return (
    <div className="login-shell">
      <img src="/icon.svg" alt="Consulta de Departamentos" className="login-logo" width="56" height="56" />
      <p className="login-eyebrow">Consulta interna</p>
      <h1 className="login-title">Departamentos</h1>

      <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="email"
          placeholder="Correo"
          aria-label="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          aria-label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit" className="btn-principal" disabled={cargando}>
          {cargando ? 'Procesando...' : 'Entrar'}
        </button>
      </form>

      {mensaje && <p className="mensaje-estado" style={{ textAlign: 'center' }}>{mensaje}</p>}

      <p className="login-switch">¿No tienes cuenta? Pídele acceso a un administrador.</p>
    </div>
  )
}

export default Login

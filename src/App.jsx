import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Cobros from './Cobros'
import ReportesCobros from './ReportesCobros'
import './App.css'

function App() {
  const [sesion, setSesion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState('cobros')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session)
      setCargando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  if (cargando) return <p style={{ padding: 40, fontFamily: 'Inter, sans-serif' }}>Cargando...</p>

  if (!sesion) return <Login />

  return (
    <div className="app-shell">
      <div className="app-header">
        <h1 className="app-title">Departamentos</h1>
        <button className="btn-ghost" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>

      <div className="tabs">
        <button className={`tab ${vista === 'cobros' ? 'activo' : ''}`} onClick={() => setVista('cobros')}>Cobros</button>
        <button className={`tab ${vista === 'reportes' ? 'activo' : ''}`} onClick={() => setVista('reportes')}>Reportes</button>
      </div>

      {vista === 'cobros' && <Cobros usuario={sesion.user} />}
      {vista === 'reportes' && <ReportesCobros usuario={sesion.user} />}
    </div>
  )
}

export default App

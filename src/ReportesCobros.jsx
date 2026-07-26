import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function ReportesCobros() {
  const [datos, setDatos] = useState([])
  const [accesos, setAccesos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 480)

  useEffect(() => {
    function alRedimensionar() {
      setEsMovil(window.innerWidth <= 480)
    }
    window.addEventListener('resize', alRedimensionar)
    return () => window.removeEventListener('resize', alRedimensionar)
  }, [])

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('clientes_cobros')
        .select('sector_barrio, categoria, balance, valor')
      if (!error) setDatos(data || [])

      const { data: historial } = await supabase
        .from('historial_sesiones')
        .select('correo, fecha, mes, hora')
        .order('creado_en', { ascending: false })
        .limit(15)
      setAccesos(historial || [])

      setCargando(false)
    }
    cargar()
  }, [])

  if (cargando) return <p>Cargando reportes...</p>

  const totalClientes = datos.length
  const totalBalance = datos.reduce((s, d) => s + Number(d.balance || 0), 0)
  const clientesConDeuda = datos.filter((d) => Number(d.balance || 0) > 0).length

  const porCategoria = {}
  datos.forEach((d) => {
    const cat = d.categoria || 'Sin categoría'
    if (!porCategoria[cat]) porCategoria[cat] = { categoria: cat, clientes: 0, balance: 0 }
    porCategoria[cat].clientes += 1
    porCategoria[cat].balance += Number(d.balance || 0)
  })
  const filasCategoria = Object.values(porCategoria).sort((a, b) => a.categoria.localeCompare(b.categoria))

  const porSector = {}
  datos.forEach((d) => {
    const sec = d.sector_barrio || 'Sin sector'
    if (!porSector[sec]) porSector[sec] = { sector: sec, clientes: 0, balance: 0 }
    porSector[sec].clientes += 1
    porSector[sec].balance += Number(d.balance || 0)
  })
  const filasSector = Object.values(porSector).sort((a, b) => b.balance - a.balance).slice(0, 12)

  return (
    <div>
      <h2 className="section-title">Resumen general</h2>

      <div className="metric-row">
        <div className="metric-card">
          <p className="metric-label">TOTAL DE CLIENTES</p>
          <p className="metric-monto">{totalClientes.toLocaleString()}</p>
        </div>
        <div className="metric-card" style={{ borderLeftColor: 'var(--terracota)' }}>
          <p className="metric-label">BALANCE PENDIENTE TOTAL</p>
          <p className="metric-monto" style={{ color: 'var(--terracota)' }}>RD$ {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>
      <p style={{ fontSize: 14, color: 'var(--tinta-suave)', marginTop: -12, marginBottom: 24 }}>
        {clientesConDeuda.toLocaleString()} clientes tienen balance pendiente de {totalClientes.toLocaleString()} en total.
      </p>

      <h3 className="section-title">Top 12 sectores con más balance pendiente</h3>
      <div className="card" style={{ marginTop: 12, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={esMovil ? 260 : 320}>
          <BarChart data={filasSector} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: esMovil ? 5 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--raya)" />
            <XAxis type="number" tick={{ fontFamily: 'Inter, sans-serif', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="sector"
              width={esMovil ? 90 : 140}
              tick={{ fontFamily: 'Inter, sans-serif', fontSize: esMovil ? 10 : 12 }}
            />
            <Tooltip contentStyle={{ fontFamily: 'Inter, sans-serif', fontSize: 13, borderRadius: 6 }} formatter={(v) => 'RD$ ' + Number(v).toLocaleString()} />
            <Bar dataKey="balance" fill="var(--terracota)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 className="section-title">Resumen por categoría</h3>
      <div className="card tabla-mensual-wrap">
        <table className="tabla-mensual">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Clientes</th>
              <th>Balance pendiente</th>
            </tr>
          </thead>
          <tbody>
            {filasCategoria.map((f) => (
              <tr key={f.categoria}>
                <td>{f.categoria}</td>
                <td>{f.clientes.toLocaleString()}</td>
                <td style={{ color: f.balance > 0 ? 'var(--terracota)' : 'var(--verde)', fontWeight: 600 }}>
                  RD$ {f.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="section-title">Últimos accesos</h3>
      <div className="card tabla-mensual-wrap">
        <table className="tabla-mensual">
          <thead>
            <tr>
              <th>Correo</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th className="col-oculta-movil">Mes</th>
            </tr>
          </thead>
          <tbody>
            {accesos.map((a, i) => (
              <tr key={i}>
                <td>{a.correo}</td>
                <td>{a.fecha}</td>
                <td>{String(a.hora || '').slice(0, 5)}</td>
                <td className="col-oculta-movil">{a.mes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {accesos.length === 0 && <p style={{ padding: 16, fontSize: 14, color: 'var(--tinta-suave)' }}>Aún no hay accesos registrados.</p>}
      </div>
    </div>
  )
}

export default ReportesCobros

import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function inicioDeSemana(fecha) {
  const d = new Date(fecha)
  const dia = d.getDay()
  d.setDate(d.getDate() - dia)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatoFecha(fecha) {
  return fecha.toISOString().slice(0, 10)
}

function etiquetaTipoArea(tipo) {
  if (tipo === 'nichos_publicos') return 'Nichos públicos'
  if (tipo === 'bovedas_privadas') return 'Bóvedas privadas'
  if (tipo === 'ambos') return 'Nichos y bóvedas'
  if (tipo === 'terreno') return 'Visita en el terreno'
  return ''
}

const NOMBRE_CORTO = {
  lagunas: 'Las Lagunas',
  ornamental: 'Ornamental',
  guarionex: 'Guarionex',
  vertedero: 'Vertedero',
  supervision_general: 'Supervisión Gral.'
}
export default function Inspecciones() {
  const [horario, setHorario] = useState([])
  const [visitas, setVisitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [sitioId, setSitioId] = useState('')
  const [fecha, setFecha] = useState(formatoFecha(new Date()))
  const [tipoArea, setTipoArea] = useState('nichos_publicos')
  const [inspectores, setInspectores] = useState('')
  const [notas, setNotas] = useState('')
  const [editandoId, setEditandoId] = useState(null)

  const inicioSemana = inicioDeSemana(new Date())
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana)
    d.setDate(d.getDate() + i)
    return d
  })

  async function cargarDatos() {
    setCargando(true)
    const desde = new Date()
    desde.setDate(desde.getDate() - 90)
    const hasta = new Date()
    hasta.setDate(hasta.getDate() + 30)
    const [{ data: h }, { data: v }] = await Promise.all([
      supabase.from('horario_planeado_inspecciones').select('*').order('dia_semana'),
      supabase
        .from('visitas_inspeccion')
        .select('*')
        .gte('fecha', formatoFecha(desde))
        .lte('fecha', formatoFecha(hasta))
        .order('fecha', { ascending: false })
    ])
    setHorario(h || [])
    setVisitas(v || [])
    if (!sitioId && h && h.length) setSitioId(h[0].sitio_id)
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  function visitaEnDia(sitio_id, fechaDia) {
    return visitas.find((v) => v.sitio_id === sitio_id && v.fecha === formatoFecha(fechaDia))
  }

  async function guardarVisita(e) {
    e.preventDefault()
    if (!sitioId || !fecha || !inspectores.trim()) {
      setMensaje('Completa sitio, fecha e inspectores.')
      return
    }
    setGuardando(true)
    setMensaje('')

    const datos = {
      sitio_id: sitioId,
      fecha,
      tipo_area: tipoArea,
      inspectores: inspectores.trim(),
      notas: notas.trim() || null
    }

    const { error } = editandoId
      ? await supabase.from('visitas_inspeccion').update(datos).eq('id', editandoId)
      : await supabase.from('visitas_inspeccion').insert(datos)

    setGuardando(false)
    if (error) {
      setMensaje('Error al guardar: ' + error.message)
      return
    }
    setMensaje(editandoId ? 'Visita actualizada.' : 'Visita registrada.')
    cancelarEdicion()
    cargarDatos()
  }

  function editarVisita(v) {
    setEditandoId(v.id)
    setSitioId(v.sitio_id)
    setFecha(v.fecha)
    setTipoArea(v.tipo_area || 'nichos_publicos')
    setInspectores(v.inspectores || '')
    setNotas(v.notas || '')
    setMensaje('')
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setFecha(formatoFecha(new Date()))
    setTipoArea('nichos_publicos')
    setInspectores('')
    setNotas('')
  }

  async function eliminarVisita(id) {
    if (!window.confirm('¿Eliminar esta visita? Esta acción no se puede deshacer.')) return
    setGuardando(true)
    setMensaje('')
    const { error } = await supabase.from('visitas_inspeccion').delete().eq('id', id)
    setGuardando(false)
    if (error) {
      setMensaje('Error al eliminar: ' + error.message)
      return
    }
    setMensaje('Visita eliminada.')
    if (editandoId === id) cancelarEdicion()
    cargarDatos()
  }

  const sitioSeleccionado = horario.find((h) => h.sitio_id === sitioId)

  function exportarCSV() {
    const encabezados = ['Sitio', 'Fecha', 'Tipo de área', 'Inspectores', 'Notas']
    const filas = visitas.map((v) => {
      const s = horario.find((h) => h.sitio_id === v.sitio_id)
      return [
        s ? s.sitio_nombre : v.sitio_id,
        v.fecha,
        etiquetaTipoArea(v.tipo_area),
        v.inspectores || '',
        v.notas || ''
      ]
    })
    const csv = [encabezados, ...filas]
      .map((fila) => fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(blob)
    enlace.download = `inspecciones_${formatoFecha(new Date())}.csv`
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  }

  return (
    <div>
      <div className="comparacion-header" style={{ marginBottom: 20 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Calendario semanal de inspecciones</h2>
        <button className="btn-ghost" onClick={exportarCSV}>⬇ Exportar CSV</button>
      </div>
<div className="card" style={{ marginBottom: 24 }}>
        {horario.map((h) => (
          <div key={h.sitio_id} className="calendario-sitio">
            <div className="calendario-sitio-nombre">{NOMBRE_CORTO[h.sitio_id] || h.sitio_nombre}</div>
            <div className="calendario-dias-fila">
              {diasSemana.map((d, i) => {
                const visita = visitaEnDia(h.sitio_id, d)
                const esPlaneado = d.getDay() === h.dia_semana
                let contenido = ''
                let color = 'var(--tinta-suave)'
                let fondo = 'var(--papel)'
                if (visita) {
                  contenido = '✓'
                  color = 'var(--papel)'
                  fondo = 'var(--verde)'
                } else if (esPlaneado) {
                  contenido = '·'
                  color = 'var(--bronce)'
                }
                return (
                  <div
                    key={i}
                    className="calendario-dia-chip"
                    style={{ background: fondo, cursor: visita ? 'pointer' : 'default' }}
                    onClick={visita ? () => editarVisita(visita) : undefined}
                    title={visita ? 'Editar esta visita' : undefined}
                  >
                    <span className="calendario-dia-etiqueta">{DIAS_CORTO[i]}</span>
                    <span className="calendario-dia-numero">{d.getDate()}</span>
                    <span className="calendario-dia-icono" style={{ color, fontWeight: 700 }}>{contenido}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mensaje-estado" style={{ marginTop: -12, marginBottom: 24 }}>
        <span style={{ color: 'var(--verde)', fontWeight: 600 }}>✓</span> visita realizada &nbsp;·&nbsp;
        <span style={{ color: 'var(--bronce)', fontWeight: 600 }}>·</span> día planeado, pendiente
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>{editandoId ? 'Editar visita' : 'Registrar visita'}</h3>
        <form onSubmit={guardarVisita} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="form-fila">
            <select value={sitioId} onChange={(e) => setSitioId(e.target.value)} style={{ flex: 1 }}>
              {horario.map((h) => (
                <option key={h.sitio_id} value={h.sitio_id}>{h.sitio_nombre}</option>
              ))}
            </select>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          <div className="form-fila">
            <select value={tipoArea} onChange={(e) => setTipoArea(e.target.value)} style={{ flex: 1 }}>
              <option value="nichos_publicos">Nichos públicos</option>
              <option value="bovedas_privadas">Bóvedas privadas</option>
              <option value="ambos">Nichos y bóvedas</option>
              <option value="terreno">Visita en el terreno</option>
            </select>
          </div>

          <div className="form-fila">
            <input
              type="text"
              placeholder="Nombres de quienes hacen la visita"
              value={inspectores}
              onChange={(e) => setInspectores(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>

          <div className="form-fila">
            <textarea
              placeholder="Notas (opcional)"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-principal" disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar visita'}
            </button>
            {editandoId && (
              <button type="button" className="btn-ghost" onClick={cancelarEdicion}>Cancelar</button>
            )}
            {editandoId && (
              <button
                type="button"
                className="btn-eliminar"
                onClick={() => eliminarVisita(editandoId)}
                disabled={guardando}
              >
                Eliminar
              </button>
            )}
          </div>
          {mensaje && <p className="mensaje-estado">{mensaje}</p>}
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Visitas registradas</h3>
        {!editandoId && mensaje && <p className="mensaje-estado">{mensaje}</p>}
        {cargando && <p className="mensaje-estado">Cargando...</p>}
        {!cargando && visitas.length === 0 && (
          <div className="vacio">Todavía no hay visitas registradas.</div>
        )}
        <ul className="lista-recibo">
          {visitas.map((v) => {
            const s = horario.find((h) => h.sitio_id === v.sitio_id)
            return (
              <li key={v.id} className="recibo-item">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{s ? s.sitio_nombre : v.sitio_id}</div>
                  <div className="recibo-detalle">
                    {v.fecha} · {v.inspectores}
                    {v.tipo_area && ` · ${etiquetaTipoArea(v.tipo_area)}`}
                  </div>
                  {v.notas && <div className="recibo-desc">{v.notas}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn-ghost" onClick={() => editarVisita(v)}>Editar</button>
                  <button className="btn-eliminar" onClick={() => eliminarVisita(v.id)}>Eliminar</button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
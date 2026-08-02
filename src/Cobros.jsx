import { useState } from 'react'
import { supabase } from './supabaseClient'

const CAMPOS_VACIOS = {
  rmc: '', nombre_cliente: '', sector_barrio: '', calle: '', numero: '',
  tipo_cliente: '', categoria: '', contrato: 'RECOLECCION DESECHOS SOLIDOS',
  cantidad: 1, valor: '', balance: '', inmueble: '', telefonos: ''
}

function Cobros() {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [yaBusco, setYaBusco] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [form, setForm] = useState(CAMPOS_VACIOS)
  const [mensaje, setMensaje] = useState('')
  const [mostrarNuevo, setMostrarNuevo] = useState(false)

  async function buscar(e) {
    if (e) e.preventDefault()
    setBuscando(true)
    setMensaje('')
    setYaBusco(true)

    const termino = busqueda.trim()
    let query = supabase.from('clientes_cobros').select('*').order('nombre_cliente').limit(100)

    if (termino) {
      const esNumero = /^\d+$/.test(termino)
      if (esNumero) {
        query = query.eq('rmc', termino)
      } else {
        query = query.or(
          `nombre_cliente.ilike.%${termino}%,sector_barrio.ilike.%${termino}%,calle.ilike.%${termino}%,tipo_cliente.ilike.%${termino}%,telefonos.ilike.%${termino}%`
        )
      }
    }

    const { data, error } = await query
    if (error) setMensaje('Error: ' + error.message)
    setResultados(data || [])
    setBuscando(false)
  }

  function abrirCliente(cliente) {
    setSeleccionado(cliente.id)
    setForm({ ...cliente })
    setMostrarNuevo(false)
    setMensaje('')
  }

  function abrirNuevo() {
    setSeleccionado('nuevo')
    setForm(CAMPOS_VACIOS)
    setMostrarNuevo(true)
    setMensaje('')
  }

  function cerrarPanel() {
    setSeleccionado(null)
    setForm(CAMPOS_VACIOS)
    setMostrarNuevo(false)
  }

  async function guardar(e) {
    e.preventDefault()
    setMensaje('Guardando...')

    const datos = {
      rmc: form.rmc ? String(form.rmc).trim() : null,
      nombre_cliente: form.nombre_cliente,
      sector_barrio: form.sector_barrio,
      calle: form.calle,
      numero: String(form.numero || ''),
      tipo_cliente: form.tipo_cliente,
      categoria: form.categoria,
      contrato: form.contrato,
      cantidad: form.cantidad ? Number(form.cantidad) : null,
      valor: form.valor ? Number(form.valor) : null,
      balance: form.balance !== '' ? Number(form.balance) : null,
      inmueble: form.inmueble,
      telefonos: form.telefonos
    }

    let error
    if (mostrarNuevo) {
      ;({ error } = await supabase.from('clientes_cobros').insert(datos))
    } else {
      ;({ error } = await supabase.from('clientes_cobros').update(datos).eq('id', seleccionado))
    }

    if (error) {
      setMensaje('Error: ' + error.message)
    } else {
      setMensaje('Guardado correctamente.')
      cerrarPanel()
      buscar()
    }
  }

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  return (
    <div>
      <div className="comparacion-header">
        <h2 className="section-title" style={{ marginBottom: 0 }}>Consulta de clientes</h2>
        <button className="btn-ghost" onClick={abrirNuevo}>+ Nuevo cliente</button>
      </div>

      <form onSubmit={buscar} style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por RMC, nombre, sector, calle o teléfono..."
          aria-label="Buscar cliente"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="submit" className="btn-principal" style={{ width: 'auto', padding: '0 20px', flexShrink: 0 }} disabled={buscando}>
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {seleccionado && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>{mostrarNuevo ? 'Nuevo cliente' : 'Editar cliente'}</h3>
          <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-fila">
              <input placeholder="RMC" aria-label="RMC" value={form.rmc} onChange={(e) => actualizarCampo('rmc', e.target.value)} />
              <input placeholder="Nombre del cliente" aria-label="Nombre del cliente" value={form.nombre_cliente} onChange={(e) => actualizarCampo('nombre_cliente', e.target.value)} required />
            </div>
            <div className="form-fila">
              <input placeholder="Sector / Barrio" aria-label="Sector / Barrio" value={form.sector_barrio} onChange={(e) => actualizarCampo('sector_barrio', e.target.value)} />
              <input placeholder="Calle" aria-label="Calle" value={form.calle} onChange={(e) => actualizarCampo('calle', e.target.value)} />
              <input placeholder="No." aria-label="Número" value={form.numero} onChange={(e) => actualizarCampo('numero', e.target.value)} />
            </div>
            <div className="form-fila">
              <input placeholder="Tipo de cliente" aria-label="Tipo de cliente" value={form.tipo_cliente} onChange={(e) => actualizarCampo('tipo_cliente', e.target.value)} />
              <input placeholder="Categoría (A-J)" aria-label="Categoría" value={form.categoria} onChange={(e) => actualizarCampo('categoria', e.target.value)} maxLength={2} style={{ maxWidth: 120 }} />
            </div>
            <div className="form-fila">
              <input placeholder="Cantidad" aria-label="Cantidad" type="number" value={form.cantidad} onChange={(e) => actualizarCampo('cantidad', e.target.value)} />
              <input placeholder="Valor (RD$)" aria-label="Valor en pesos dominicanos" type="number" value={form.valor} onChange={(e) => actualizarCampo('valor', e.target.value)} />
              <input placeholder="Balance (RD$)" aria-label="Balance en pesos dominicanos" type="number" value={form.balance} onChange={(e) => actualizarCampo('balance', e.target.value)} />
            </div>
            <div className="form-fila">
              <input placeholder="Inmueble" aria-label="Inmueble" value={form.inmueble} onChange={(e) => actualizarCampo('inmueble', e.target.value)} />
              <input placeholder="Teléfonos" aria-label="Teléfonos" value={form.telefonos} onChange={(e) => actualizarCampo('telefonos', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-principal">Guardar</button>
              <button type="button" className="btn-ghost" onClick={cerrarPanel}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {mensaje && !seleccionado && <p className="mensaje-estado">{mensaje}</p>}

      {!yaBusco && (
        <div className="vacio">Escribe un nombre, RMC, sector o teléfono arriba y dale a "Buscar".</div>
      )}

      {yaBusco && !buscando && resultados.length === 0 && (
        <div className="vacio">No se encontraron clientes con ese criterio.</div>
      )}

      {resultados.length > 0 && (
        <div className="card tabla-mensual-wrap">
          <table className="tabla-mensual">
            <thead>
              <tr>
                <th className="col-oculta-movil">RMC</th>
                <th>Nombre</th>
                <th className="col-oculta-movil">Sector</th>
                <th>Cat.</th>
                <th>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((c) => (
                <tr key={c.id}>
                  <td className="col-oculta-movil">{c.rmc}</td>
                  <td>{c.nombre_cliente}</td>
                  <td className="col-oculta-movil">{c.sector_barrio}</td>
                  <td>{c.categoria}</td>
                  <td style={{ color: Number(c.balance) > 0 ? 'var(--terracota)' : 'var(--verde)', fontWeight: 600 }}>
                    RD$ {Number(c.balance || 0).toFixed(2)}
                  </td>
                  <td>
                    <button className="btn-ghost" onClick={() => abrirCliente(c)}>Ver / Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resultados.length === 100 && (
            <p style={{ fontSize: 13, color: 'var(--tinta-suave)', padding: '10px 16px' }}>
              Mostrando los primeros 100 resultados — afina la búsqueda para ver menos clientes a la vez.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Cobros

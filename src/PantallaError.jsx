export default function PantallaError() {
  return (
    <div style={{ padding: 40, fontFamily: 'Inter, sans-serif' }}>
      <p>Algo falló al cargar la app.</p>
      <button onClick={() => window.location.reload()}>Recargar</button>
    </div>
  )
}

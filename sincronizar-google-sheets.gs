// ============================================================
// Sincroniza la hoja de Google con la app de Consulta (Supabase)
// ============================================================
// Configuración necesaria (una sola vez):
// 1. Extensiones > Apps Script > ícono de engranaje (Configuración del proyecto)
// 2. Baja hasta "Propiedades de secuencia de comandos" > Agregar propiedad
//    - Propiedad: SUPABASE_URL       Valor: https://tu-proyecto.supabase.co
//    - Propiedad: SUPABASE_SERVICE_KEY   Valor: tu clave service_role (Settings > API en Supabase)
// ============================================================

const NOMBRE_HOJA = 'ACTUALIZACION DEL BALANCE'; // nombre exacto de la pestaña con los datos
const TABLA = 'clientes_cobros';
const TAMANO_LOTE = 500;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('App Consulta')
    .addItem('Actualizar app ahora', 'sincronizarConApp')
    .addToUi();
}

function sincronizarConApp() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const SUPABASE_URL = props.getProperty('SUPABASE_URL');
  const SERVICE_KEY = props.getProperty('SUPABASE_SERVICE_KEY');

  if (!SUPABASE_URL || !SERVICE_KEY) {
    ui.alert('Falta configurar SUPABASE_URL o SUPABASE_SERVICE_KEY en las propiedades del proyecto (ver instrucciones arriba en el código).');
    return;
  }

  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);
  if (!hoja) {
    ui.alert('No encontré una pestaña llamada "' + NOMBRE_HOJA + '". Revisa el nombre exacto.');
    return;
  }

  const datos = hoja.getDataRange().getValues();
  const filas = datos.slice(1); // sin encabezado

  const registros = filas
    .map((f) => ({
      rmc: f[0] ? Number(f[0]) : null,
      nombre_cliente: String(f[1] || '').trim(),
      sector_barrio: String(f[2] || '').trim(),
      calle: String(f[3] || '').trim(),
      numero: String(f[4] || '').trim(),
      tipo_cliente: String(f[5] || '').trim(),
      categoria: String(f[6] || '').trim(),
      contrato: String(f[7] || '').trim(),
      cantidad: f[8] !== '' ? Number(f[8]) : null,
      valor: f[9] !== '' ? Number(f[9]) : null,
      balance: f[10] !== '' ? Number(f[10]) : null,
      inmueble: String(f[11] || '').trim(),
      telefonos: String(f[12] || '').trim()
    }))
    .filter((r) => r.nombre_cliente); // ignora filas vacías

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY
  };

  // 1. Borra todos los registros existentes en la app
  UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/' + TABLA + '?id=gt.0', {
    method: 'delete',
    headers,
    muteHttpExceptions: true
  });

  // 2. Sube los nuevos registros en lotes
  for (let i = 0; i < registros.length; i += TAMANO_LOTE) {
    const lote = registros.slice(i, i + TAMANO_LOTE);
    const respuesta = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/' + TABLA, {
      method: 'post',
      contentType: 'application/json',
      headers: Object.assign({ Prefer: 'return=minimal' }, headers),
      payload: JSON.stringify(lote),
      muteHttpExceptions: true
    });
    if (respuesta.getResponseCode() >= 300) {
      ui.alert('Hubo un error subiendo un lote: ' + respuesta.getContentText());
      return;
    }
  }

  ui.alert('Listo: ' + registros.length + ' clientes sincronizados con la app.');
}

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
const NOMBRE_HOJA_INSPECCIONES = 'Inspecciones'; // pestaña donde se exportan las visitas
const NOMBRE_HOJA_CLIENTES_NUEVOS = 'Clientes Nuevos'; // pestaña donde se exportan los clientes agregados desde la app

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('App Consulta')
    .addItem('Actualizar app ahora', 'sincronizarConApp')
    .addItem('Exportar inspecciones a esta hoja', 'exportarInspeccionesASheets')
    .addItem('Exportar clientes nuevos a esta hoja', 'exportarClientesNuevosASheets')
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

  // 1. Borra todos los registros existentes en la app que vinieron del CSV (no toca los agregados manualmente desde "+ Nuevo cliente")
  UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/' + TABLA + '?id=gt.0&agregado_manual=eq.false', {
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

// ============================================================
// Exporta las visitas de inspección (cementerios y vertedero)
// desde Supabase hacia una pestaña de esta misma hoja.
// Una vez ahí, usa Archivo > Descargar > Excel o PDF para exportarlas.
// ============================================================
function exportarInspeccionesASheets() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const SUPABASE_URL = props.getProperty('SUPABASE_URL');
  const SERVICE_KEY = props.getProperty('SUPABASE_SERVICE_KEY');

  if (!SUPABASE_URL || !SERVICE_KEY) {
    ui.alert('Falta configurar SUPABASE_URL o SUPABASE_SERVICE_KEY en las propiedades del proyecto.');
    return;
  }

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY,
    'User-Agent': 'GoogleAppsScript-SincronizadorAppConsulta/1.0'
  };

  const url = SUPABASE_URL + '/rest/v1/visitas_inspeccion?select=*,horario_planeado_inspecciones(sitio_nombre)&order=fecha.desc';
  const respuesta = UrlFetchApp.fetch(url, { headers, muteHttpExceptions: true });

  if (respuesta.getResponseCode() >= 300) {
    ui.alert('Error consultando las visitas: ' + respuesta.getContentText());
    return;
  }

  const visitas = JSON.parse(respuesta.getContentText());

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = spreadsheet.getSheetByName(NOMBRE_HOJA_INSPECCIONES);
  if (!hoja) {
    hoja = spreadsheet.insertSheet(NOMBRE_HOJA_INSPECCIONES);
  }
  hoja.clear();

  const encabezados = ['Sitio', 'Fecha', 'Tipo de área', 'Inspectores', 'Notas', 'Registrado el'];
  const etiquetasTipo = {
    nichos_publicos: 'Nichos públicos',
    bovedas_privadas: 'Bóvedas privadas',
    ambos: 'Nichos y bóvedas',
    terreno: 'Visita en el terreno'
  };

  const filas = visitas.map((v) => [
    (v.horario_planeado_inspecciones && v.horario_planeado_inspecciones.sitio_nombre) || v.sitio_id,
    formatoFechaDR_(v.fecha),
    etiquetasTipo[v.tipo_area] || '',
    v.inspectores || '',
    v.notas || '',
    formatoFechaHoraDR_(v.creado_en)
  ]);

  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold');
  if (filas.length) {
    hoja.getRange(2, 1, filas.length, encabezados.length).setValues(filas);
  }
  hoja.autoResizeColumns(1, encabezados.length);

  ui.alert('Listo: ' + filas.length + ' visitas de inspección exportadas a la pestaña "' + NOMBRE_HOJA_INSPECCIONES + '".');
}

// ============================================================
// Exporta los clientes agregados manualmente desde "+ Nuevo cliente"
// en la app (no los del CSV importado) hacia una pestaña aparte, para
// poder revisarlos/trabajarlos antes de que entren a la sincronización
// masiva de "ACTUALIZACION DEL BALANCE".
// ============================================================
function exportarClientesNuevosASheets() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const SUPABASE_URL = props.getProperty('SUPABASE_URL');
  const SERVICE_KEY = props.getProperty('SUPABASE_SERVICE_KEY');

  if (!SUPABASE_URL || !SERVICE_KEY) {
    ui.alert('Falta configurar SUPABASE_URL o SUPABASE_SERVICE_KEY en las propiedades del proyecto.');
    return;
  }

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY,
    'User-Agent': 'GoogleAppsScript-SincronizadorAppConsulta/1.0'
  };

  const url = SUPABASE_URL + '/rest/v1/' + TABLA + '?select=*&agregado_manual=eq.true&order=id.desc';
  const respuesta = UrlFetchApp.fetch(url, { headers, muteHttpExceptions: true });

  if (respuesta.getResponseCode() >= 300) {
    ui.alert('Error consultando los clientes nuevos: ' + respuesta.getContentText());
    return;
  }

  const clientes = JSON.parse(respuesta.getContentText());

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = spreadsheet.getSheetByName(NOMBRE_HOJA_CLIENTES_NUEVOS);
  if (!hoja) {
    hoja = spreadsheet.insertSheet(NOMBRE_HOJA_CLIENTES_NUEVOS);
  }
  hoja.clear();

  const encabezados = [
    'RMC', 'Nombre del Cliente', 'Sector/Barrio', 'Calle', 'No.', 'Tipo de Cliente',
    'Categoría', 'Contrato', 'Cant.', 'Valor', 'Balance', 'Inmueble', 'Teléfonos'
  ];

  const filas = clientes.map((c) => [
    c.rmc || '',
    c.nombre_cliente || '',
    c.sector_barrio || '',
    c.calle || '',
    c.numero || '',
    c.tipo_cliente || '',
    c.categoria || '',
    c.contrato || '',
    c.cantidad || '',
    c.valor || '',
    c.balance || '',
    c.inmueble || '',
    c.telefonos || ''
  ]);

  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold');
  if (filas.length) {
    hoja.getRange(2, 1, filas.length, encabezados.length).setValues(filas);
  }
  hoja.autoResizeColumns(1, encabezados.length);

  ui.alert('Listo: ' + filas.length + ' clientes nuevos exportados a la pestaña "' + NOMBRE_HOJA_CLIENTES_NUEVOS + '".');
}

// ---- Helpers de fecha en zona horaria de República Dominicana ----

function formatoFechaDR_(fechaISO) {
  if (!fechaISO) return '';
  const partes = String(fechaISO).split('-');
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function formatoFechaHoraDR_(timestamp) {
  if (!timestamp) return '';
  const fecha = new Date(timestamp);
  return Utilities.formatDate(fecha, 'America/Santo_Domingo', 'dd/MM/yyyy HH:mm');
}

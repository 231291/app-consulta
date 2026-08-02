# App de Consulta - Departamentos

## Qué incluye este proyecto
- App en React + Vite, con login para el personal (sin auto-registro — las cuentas se crean a mano desde Supabase).
- Pestaña **Cobros**: buscar clientes (por RMC, nombre, sector, teléfono), ver su balance, y editar o agregar registros.
- Pestaña **Reportes**: resumen total de clientes y balance pendiente, gráfico de los sectores con más deuda, y tabla por categoría.
- Pestaña **Inspecciones**: calendario semanal de visitas, con registrar/editar/eliminar y exportación a CSV y a Google Sheets.
- `esquema_cobros.sql`: crea la tabla `clientes_cobros` en Supabase, con índices y seguridad (solo personal con sesión iniciada puede ver/editar).
- `clientes_cobros.csv`: los 6,808 clientes ya limpios y listos para importar.

## Pasos de configuración

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com) (uno separado del de finanzas personales).
2. Ve al **SQL Editor** y corre todo el contenido de `esquema_cobros.sql`.
3. Ve a **Table Editor** → tabla `clientes_cobros` → botón **Insert** → **Import data from CSV** → sube `clientes_cobros.csv`.
4. Ve a **Project Settings → API** y copia el **Project URL** y la **anon public key**.
5. Renombra `.env.example` a `.env` y pega ahí esos dos valores.
6. Corre `npm install` y luego `npm run dev` para probarlo localmente.
7. Cuando quieras publicarlo: sube el proyecto a GitHub y conéctalo a Vercel (igual que hicimos con la app de finanzas), agregando esas mismas dos variables de entorno en la configuración de Vercel.
8. En **Authentication → Sign In / Providers**, confirma que "Allow new users to sign up" esté **desactivado** — las cuentas del personal se crean a mano en **Authentication → Users → Add user**.

## Monitoreo de errores (opcional, recomendado)

Sin esto, si algo falla no te enteras hasta que el usuario se queje.

1. Crea una cuenta gratis en [sentry.io](https://sentry.io) y un proyecto tipo **React**.
2. Copia el **DSN** y agrégalo como variable de entorno `VITE_SENTRY_DSN` (local en `.env`, o en Vercel → Environment Variables).
3. Sin esa variable, la app funciona igual — solo que no manda nada a Sentry.

## Sincronizar desde Google Sheets (pegar y actualizar)

Si vas a mantener la base de datos actualizándola en una hoja de Google (pegando la data completa cada vez), usa `sincronizar-google-sheets.gs`:

1. Crea una Google Sheet nueva y pega ahí tus datos, con una pestaña llamada exactamente **"ACTUALIZACION DEL BALANCE"** (o cambia el nombre en el script) y las mismas columnas del CSV (RMC, Nombre del Cliente, Sector/Barrio, Calle, No., Tipo de Cliente, Categoría, Contrato, Cant., Valor, Balance, Inmueble, Teléfonos).
2. En la hoja: **Extensiones → Apps Script**. Borra el contenido de ejemplo y pega el contenido de `sincronizar-google-sheets.gs`.
3. En el editor de Apps Script: ícono de engranaje (Configuración del proyecto) → **Propiedades de secuencia de comandos** → agrega:
   - `SUPABASE_URL` = tu Project URL de Supabase
   - `SUPABASE_SERVICE_KEY` = tu clave **service_role** (Settings → API en Supabase — no la "anon", esta es la que puede escribir sin restricciones, guárdala solo ahí, nunca en el código de la app)
4. Guarda, y **recarga la hoja de Google** (cierra y abre de nuevo la pestaña del navegador).
5. Va a aparecer un menú nuevo arriba: **"App Consulta"** → **"Actualizar app ahora"**.
6. La primera vez que lo uses, Google te pedirá autorizar el script (permisos de tu cuenta) — acéptalo.
7. Cada vez que pegues datos nuevos en la hoja, entra a ese menú y dale a "Actualizar app ahora" — borra lo viejo y sube la versión nueva completa a la app en segundos.


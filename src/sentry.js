import * as Sentry from '@sentry/react'

// Si no se configura VITE_SENTRY_DSN, Sentry queda apagado y todas las
// llamadas a Sentry.captureException(...) en el resto de la app no hacen nada.
export function iniciarSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE
  })
}

export { Sentry }

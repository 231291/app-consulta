import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { iniciarSentry, Sentry } from './sentry'
import PantallaError from './PantallaError.jsx'

iniciarSentry()
registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<PantallaError />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

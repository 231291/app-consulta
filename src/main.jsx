import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { iniciarSentry, Sentry } from './sentry'
import PantallaError from './PantallaError.jsx'

iniciarSentry()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<PantallaError />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

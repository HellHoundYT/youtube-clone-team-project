import {
  StrictMode,
} from 'react'
import {
  createRoot,
} from 'react-dom/client'
import {
  BrowserRouter,
} from 'react-router-dom'
import App from './app/App'
import './shared/i18n'
import ThemeProvider from './shared/theme/ThemeProvider'
import './index.css'

createRoot(
  document.getElementById(
    'root',
  )!,
).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)

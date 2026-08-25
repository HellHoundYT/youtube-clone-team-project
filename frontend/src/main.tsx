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
import {
  initializeApplication,
} from './app/bootstrap'
import ThemeProvider from './shared/theme/ThemeProvider'
import './index.css'

async function bootstrap() {
  await initializeApplication()

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
}

void bootstrap()

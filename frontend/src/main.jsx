import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ClerkProviderWrapper from './context/ClerkProvider'
import { QueryProvider } from './lib/react-query'

createRoot(document.getElementById('root')).render(
  <ClerkProviderWrapper>
    <QueryProvider>
      <App />
    </QueryProvider>
  </ClerkProviderWrapper>
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx' // Importa o componente App principal
import { AuthProvider } from './context/AuthContext' // Mantém importação do AuthProvider
import { SystemProvider } from './context/SystemContext' // Mantém importação do SystemProvider
import { PartyHealthProvider } from './context/PartyHealthContext' // Mantém importação do PartyHealthProvider
import { RollFeedProvider } from './context/RollFeedContext'
import { GlobalControlsProvider } from './context/GlobalControlsContext'; // 1. Importa o novo provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SystemProvider>
      <AuthProvider>
        <GlobalControlsProvider> {/* 2. Adiciona o provider aqui */}
          <PartyHealthProvider>
            <RollFeedProvider>
              <App /> {/* Renderiza o componente App aqui */}
            </RollFeedProvider>
          </PartyHealthProvider>
        </GlobalControlsProvider>
      </AuthProvider>
    </SystemProvider>
  </React.StrictMode>,
)
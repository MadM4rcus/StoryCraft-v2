import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx' // Importa o componente App principal
import { AuthProvider } from './context/AuthContext' // Mantém importação do AuthProvider
import { SystemProvider } from './context/SystemContext' // Mantém importação do SystemProvider
import { EventManagerProvider } from './context/EventManagerContext' // Mantém importação do PartyHealthProvider
import { RollFeedProvider } from './context/RollFeedContext'
import { GlobalControlsProvider } from './context/GlobalControlsContext'; // 1. Importa o novo provider
import { UIStateProvider } from './context/UIStateContext'; // Importar o novo provider de UI

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SystemProvider>
      <AuthProvider>
        <UIStateProvider> {/* Provider para o estado da UI (visibilidade de painéis) */}
          <GlobalControlsProvider> {/* Provider para controles globais (modo edição, etc) */}
            <RollFeedProvider>
              <EventManagerProvider>
                <App /> {/* Renderiza o componente App aqui */}
              </EventManagerProvider>
            </RollFeedProvider>
          </GlobalControlsProvider>
        </UIStateProvider>
      </AuthProvider>
    </SystemProvider>
  </React.StrictMode>,
)
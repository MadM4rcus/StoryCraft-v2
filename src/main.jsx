import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider, RollFeedProvider } from '@/context'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RollFeedProvider>
        <App />
      </RollFeedProvider>
    </AuthProvider>
  </React.StrictMode>,
)
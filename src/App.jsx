// src/App.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getThemeById } from './services/themeService';
import { db } from './services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const appId = "1:727724875985:web:97411448885c68c289e5f0";

function App() {
  const { user, loading } = useAuth();
  const [activeTheme, setActiveTheme] = useState(null);
  
  // Efeito para aplicar o tema visualmente quando ele muda
  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme && activeTheme.styles) {
      // Aplicar estilos do tema
      document.body.style.backgroundImage = activeTheme.styles.backgroundImage || 'none';
      root.style.setProperty('--font-family', activeTheme.styles.fontFamily || 'ui-sans-serif');
      root.style.setProperty('--color-background', activeTheme.styles.colors.background);
      root.style.setProperty('--color-surface', activeTheme.styles.colors.surface);
      root.style.setProperty('--color-primary', activeTheme.styles.colors.primary);
      root.style.setProperty('--color-secondary', activeTheme.styles.colors.secondary);
      root.style.setProperty('--color-accent', activeTheme.styles.colors.accent);
      root.style.setProperty('--color-highlight', activeTheme.styles.colors.highlight);
    } else {
      // Aplicar estilos padrão se não houver tema
      document.body.style.backgroundImage = 'none';
      root.style.setProperty('--font-family', 'ui-sans-serif');
      root.style.setProperty('--color-background', '#1f2937'); // bg-gray-800
      root.style.setProperty('--color-surface', '#374151'); // bg-gray-700
      root.style.setProperty('--color-primary', '#f9fafb'); // text-gray-100
      root.style.setProperty('--color-secondary', '#9ca3af'); // text-gray-400
      root.style.setProperty('--color-accent', '#f59e0b'); // border-yellow-500
      root.style.setProperty('--color-highlight', '#8b5cf6'); // bg-purple-600
    }
  }, [activeTheme]);
  
  if (loading) {
    return (
      <div className="bg-background text-primary min-h-screen flex items-center justify-center">
        <h1 className="text-3xl">A carregar StoryCraft...</h1>
      </div>
    );
  }
  
  return (
    <div className="bg-background text-primary min-h-screen">
      {user ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;
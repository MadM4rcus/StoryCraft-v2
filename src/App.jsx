// src/App.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import SystemRouter from './components/SystemRouter';
import LoginScreen from './components/LoginScreen';
import GlobalControls from './components/GlobalControls'; // 1. Importamos o novo componente
import RollFeed from './components/RollFeed'; // RollFeed é um overlay global, pode ser renderizado aqui

function hexToRgb(hex) {
  if (!hex) return '55, 65, 81';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '55, 65, 81';
}

const applyThemeStyles = (styles) => {
  const root = document.documentElement;
  if (styles) {
    // ALTERADO: Em vez de aplicar diretamente ao body, definimos uma variável
    root.style.setProperty('--background-image', styles.backgroundImage || 'none');
    
    root.style.setProperty('--font-family', styles.fontFamily || 'ui-sans-serif');
    root.style.setProperty('--color-bgSurface-rgb', hexToRgb(styles.colors.bgSurface));
    root.style.setProperty('--surface-opacity', (styles.surfaceOpacity || 80) / 100);
    root.style.setProperty('--color-bgPage', styles.colors.bgPage);
    root.style.setProperty('--color-bgElement', styles.colors.bgElement);
    root.style.setProperty('--color-bgInput', styles.colors.bgInput);
    root.style.setProperty('--color-textPrimary', styles.colors.textPrimary);
    root.style.setProperty('--color-textSecondary', styles.colors.textSecondary);
    root.style.setProperty('--color-borderAccent', styles.colors.borderAccent);
    root.style.setProperty('--color-textAccent', styles.colors.textAccent);
    root.style.setProperty('--color-btnHighlightBg', styles.colors.btnHighlightBg);
    root.style.setProperty('--color-btnHighlightText', styles.colors.btnHighlightText);
  } else { // Estilos Padrão
    root.style.setProperty('--background-image', 'none');
    root.style.setProperty('--font-family', 'ui-sans-serif');
    root.style.setProperty('--color-bgSurface-rgb', '55, 65, 81');
    root.style.setProperty('--surface-opacity', '0.8');
    root.style.setProperty('--color-bgPage', '#111827');
    root.style.setProperty('--color-bgElement', '#374151');
    root.style.setProperty('--color-bgInput', '#4b5563');
    root.style.setProperty('--color-textPrimary', '#f9fafb');
    root.style.setProperty('--color-textSecondary', '#9ca3af');
    root.style.setProperty('--color-borderAccent', '#f59e0b');
    root.style.setProperty('--color-textAccent', '#fcd34d');
    root.style.setProperty('--color-btnHighlightBg', '#8b5cf6');
    root.style.setProperty('--color-btnHighlightText', '#ffffff');
  }
};

function App() {
  const { user, loading } = useAuth();
  const [activeTheme, setActiveTheme] = useState(null);
  const [previewTheme, setPreviewTheme] = useState(null);

  useEffect(() => {
    const themeToApply = previewTheme || activeTheme;
    applyThemeStyles(themeToApply ? themeToApply.styles : null);
  }, [activeTheme, previewTheme]);
  
  if (loading) {
    return (
      <div className="bg-bgPage text-textPrimary min-h-screen flex items-center justify-center">
        <h1 className="text-3xl">A carregar StoryCraft...</h1>
      </div>
    );
  }
  
  return (
    // ALTERADO: Adicionadas classes para controlar a imagem de fundo
    <div className="bg-bgPage bg-theme bg-cover bg-center bg-fixed text-textPrimary min-h-screen">
      {user ? ( // Se o usuário estiver logado, mostra o roteador de sistema e o RollFeed
        <>
          <SystemRouter activeTheme={activeTheme} setActiveTheme={setActiveTheme} previewTheme={previewTheme} setPreviewTheme={setPreviewTheme} />
          <GlobalControls /> {/* 2. Adicionamos o componente aqui */}
          <RollFeed /> {/* RollFeed é um overlay global, pode ficar aqui */}
        </>
      ) : <LoginScreen />} {/* Se não estiver logado, mostra a tela de login */}
    </div>
  );
}

export default App;
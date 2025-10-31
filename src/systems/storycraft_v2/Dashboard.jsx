import React from 'react';

function PlaceholderDashboard() {
  const goToV1 = () => {
    // Redireciona para a raiz do site, onde a V1 está.
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bgPage text-textPrimary text-center p-4">
      <h1 className="text-4xl font-bold text-textAccent mb-4 animate-pulse">Em Breve: StoryCraft V2</h1>
      <p className="text-lg mb-8 max-w-md">
        Tá apressado? Nossos escravos (Gemini) estão trabalhando no remaster visual.
      </p>
      <button onClick={goToV1} className="px-6 py-3 bg-btnHighlightBg text-btnHighlightText font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity">
        Ir para a V1
      </button>
    </div>
  );
}

export default PlaceholderDashboard;
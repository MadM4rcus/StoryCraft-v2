// src/components/SheetSkin.jsx

import React from 'react';

const SheetSkin = ({ title, isCollapsed, toggleSection, actions, children }) => {
  return (
    // A "CASCA" - toda a aparência da seção vive aqui.
    // Usamos as variáveis de cor do Tailwind que vêm do App.jsx.
    <section className="mb-8 p-6 bg-bgSurface backdrop-blur-sm rounded-xl shadow-inner border border-bgElement">
      
      {/* O Cabeçalho da Seção */}
      <div 
        className="text-2xl font-bold text-textAccent mb-4 border-b-2 border-borderAccent pb-2 cursor-pointer flex justify-between items-center"
        onClick={toggleSection}
      >
        {/* O Título da Seção */}
        <h2 className="truncate">{title}</h2>
        
        <div className="flex items-center gap-4">
          {/* Espaço para botões de ação específicos da seção (Ex: botão "+") */}
          {/* Usamos stopPropagation para que clicar nos botões não acione o toggleSection */}
          <div onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>

          {/* O Ícone de Expandir/Recolher */}
          <span>{isCollapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {/* O "MIOLO" - O conteúdo específico de cada seção será renderizado aqui. */}
      {!isCollapsed && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </section>
  );
};

export default SheetSkin;
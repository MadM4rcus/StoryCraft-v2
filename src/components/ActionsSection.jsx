import React from 'react';

const ActionsSection = ({ isCollapsed, toggleSection }) => {
  return (
    <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
      <h2 
        className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center"
        onClick={toggleSection}
      >
        Ações
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      
      {!isCollapsed && (
        <div className="text-center text-gray-400 italic">
          <p>Esta secção está em desenvolvimento.</p>
          <p>As ações rápidas, o construtor de fórmulas e os botões de curar/dano aparecerão aqui.</p>
        </div>
      )}
    </section>
  );
};

export default ActionsSection;
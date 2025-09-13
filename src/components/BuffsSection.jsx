import React from 'react';

const BuffsSection = ({ isCollapsed, toggleSection }) => {
  return (
    <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
      <h2 
        className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center"
        onClick={toggleSection}
      >
        Buffs
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      
      {!isCollapsed && (
        <div className="text-center text-gray-400 italic">
          <p>Esta secção está em desenvolvimento.</p>
          <p>A lista de buffs e os seus efeitos serão geridos aqui.</p>
        </div>
      )}
    </section>
  );
};

export default BuffsSection;
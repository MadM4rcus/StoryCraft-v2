import React from 'react';

const AttributesSection = ({ character, onUpdate, isCollapsed, toggleSection, buffModifiers }) => {
  
  const handleAddAttribute = () => {
    const newAttribute = { id: crypto.randomUUID(), name: '', base: 0, perm: 0, arma: 0, isCollapsed: false };
    const newAttributes = [...(character.attributes || []), newAttribute];
    onUpdate('attributes', newAttributes);
  };

  const handleRemoveAttribute = (id) => {
    const newAttributes = (character.attributes || []).filter(attr => attr.id !== id);
    onUpdate('attributes', newAttributes);
  };

  const handleAttributeChange = (id, field, value) => {
    const newAttributes = (character.attributes || []).map(attr => 
      attr.id === id ? { ...attr, [field]: field === 'name' ? value : parseInt(value, 10) || 0 } : attr
    );
    onUpdate('attributes', newAttributes);
  };

  const handleToggleCollapsed = (id) => {
    const newAttributes = (character.attributes || []).map(attr => 
      attr.id === id ? { ...attr, isCollapsed: !attr.isCollapsed } : attr
    );
    onUpdate('attributes', newAttributes);
  };

  return (
    <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
      <h2 
        className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center"
        onClick={toggleSection}
      >
        Atributos
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      {!isCollapsed && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(character.attributes || []).map((attr) => {
              const tempValue = buffModifiers[attr.name] || 0;
              const totalValue = (attr.base || 0) + (attr.perm || 0) + tempValue + (attr.arma || 0);
              
              if (attr.isCollapsed) {
                return (
                  <div key={attr.id} className="p-3 bg-gray-600 rounded-md shadow-sm border border-gray-500 flex justify-between items-center cursor-pointer" onClick={() => handleToggleCollapsed(attr.id)}>
                    <span className="font-semibold text-lg text-white flex-grow">{attr.name || 'Atributo Sem Nome'} <span className="ml-2 font-bold text-purple-300">{totalValue >= 0 ? '+' : ''}{totalValue}</span></span>
                    <button className="px-4 py-1 bg-gray-500 text-white font-bold rounded-lg whitespace-nowrap ml-4 text-sm shadow-md cursor-not-allowed" disabled>Rolar</button>
                  </div>
                );
              }

              return (
                <div key={attr.id} className="p-3 bg-gray-600 rounded-md shadow-sm border border-gray-500 relative flex flex-col gap-3">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggleCollapsed(attr.id)}>
                    <input type="text" placeholder="Nome do Atributo" value={attr.name} onClick={(e) => e.stopPropagation()} onChange={(e) => handleAttributeChange(attr.id, 'name', e.target.value)} className="w-full flex-grow p-2 bg-gray-700 border border-gray-500 rounded-md text-white font-semibold cursor-text" />
                    <span className="text-gray-400 text-xs whitespace-nowrap">Recolher ▲</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs justify-end w-full" onClick={(e) => e.stopPropagation()}>
                    {['base', 'perm', 'arma'].map(field => (
                      <div key={field} className="flex flex-col items-center">
                        <span className="text-gray-400 text-xs text-center capitalize">{field}</span>
                        <input type="number" value={attr[field] || ''} onChange={(e) => handleAttributeChange(attr.id, field, e.target.value)} className={`w-12 p-1 border rounded-md text-white text-center bg-gray-700 border-gray-500`} />
                      </div>
                    ))}
                    <div className="flex flex-col items-center">
                      <span className="text-gray-400 text-xs text-center capitalize">temp</span>
                      <input type="number" value={tempValue || ''} className={`w-12 p-1 border rounded-md text-white text-center bg-gray-800 border-gray-600 cursor-not-allowed`} readOnly />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-gray-400 text-xs text-center">Total</span>
                      <input type="number" value={totalValue || ''} readOnly className="w-12 p-1 bg-gray-800 border border-gray-600 rounded-md text-white font-bold cursor-not-allowed text-center" />
                    </div>
                  </div>
                  <div className="flex justify-start pt-2 mt-2 border-t border-gray-500/50" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleRemoveAttribute(attr.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md">Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center mt-4">
            <button onClick={handleAddAttribute} className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button>
          </div>
        </>
      )}
    </section>
  );
};

export default AttributesSection;
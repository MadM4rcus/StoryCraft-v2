import React from 'react';

const InventorySection = ({ character, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
  const handleAddItem = () => {
    const newItem = { id: crypto.randomUUID(), name: '', description: '', isCollapsed: false };
    const newInventory = [...(character.inventory || []), newItem];
    onUpdate('inventory', newInventory);
  };

  const handleRemoveItem = (id) => {
    const newInventory = (character.inventory || []).filter(item => item.id !== id);
    onUpdate('inventory', newInventory);
  };

  const handleItemChange = (id, field, value) => {
    const newInventory = (character.inventory || []).map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onUpdate('inventory', newInventory);
  };
  
  const toggleItemCollapsed = (id) => {
    const newInventory = (character.inventory || []).map(item =>
      item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item
    );
    onUpdate('inventory', newInventory);
  };

  return (
    <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
      <h2 
        className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center"
        onClick={toggleSection}
      >
        Inventário
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      {!isCollapsed && (
        <>
          <div className="space-y-3">
            {(character.inventory || []).length === 0 ? (
              <p className="text-gray-400 italic">Nenhum item no inventário.</p>
            ) : (
              (character.inventory || []).map(item => (
                <div key={item.id} className="flex flex-col p-3 bg-gray-600 rounded-md shadow-sm border-gray-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-lg w-full cursor-pointer text-white" onClick={() => toggleItemCollapsed(item.id)}>
                      {item.name || 'Item Sem Nome'} {item.isCollapsed ? '...' : ''}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Discord" className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-md whitespace-nowrap">Mostrar</button>
                      <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>
                    </div>
                  </div>
                  {!item.isCollapsed && (
                    <>
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} 
                        className="font-semibold text-lg w-full p-1 bg-gray-700 border border-gray-500 rounded-md text-white mb-2" 
                        placeholder="Nome do Item" 
                      />
                      <textarea 
                        value={item.description} 
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} 
                        placeholder="Descrição do item" 
                        className="text-sm text-gray-300 italic w-full p-1 bg-gray-700 border border-gray-500 rounded-md text-white resize-none" 
                        rows="2"
                      />
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="flex justify-center mt-4">
            <button onClick={handleAddItem} className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button>
          </div>
        </>
      )}
    </section>
  );
};

export default InventorySection;

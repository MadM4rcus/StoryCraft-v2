// src/components/InventorySection.jsx

import React, { useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

const AutoResizingTextarea = ({ value, onChange, placeholder, className, disabled }) => {
    const textareaRef = useRef(null);
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);
    return <textarea ref={textareaRef} value={value} onChange={onChange} placeholder={placeholder} className={`${className} resize-none overflow-hidden`} rows="1" disabled={disabled} />;
};

const InventorySection = ({ character, onUpdate, isCollapsed, toggleSection, onShowDiscord, isMaster }) => {
    const { user } = useAuth();
    if (!character || !user) return null;
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddItem = () => {
        const newItem = { id: crypto.randomUUID(), name: '', description: '', isCollapsed: true };
        onUpdate('inventory', [...(character.inventory || []), newItem]);
    };
    const handleRemoveItem = (id) => onUpdate('inventory', (character.inventory || []).filter(item => item.id !== id));
    const handleItemChange = (id, field, value) => onUpdate('inventory', (character.inventory || []).map(item => item.id === id ? { ...item, [field]: value } : item));
    const toggleItemCollapsed = (id) => onUpdate('inventory', (character.inventory || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

  return (
    <section className="mb-8 p-6 bg-bgSurface backdrop-blur-sm rounded-xl shadow-inner border border-bgElement">
      <h2 className="text-2xl font-bold text-textAccent mb-4 border-b-2 border-borderAccent pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
        Inventário <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      {!isCollapsed && (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(character.inventory || []).map(item => {
                    const isItemCollapsed = item.isCollapsed !== false;
                    return isItemCollapsed ? (
                        <div key={item.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>
                                {item.name || 'Item Sem Nome'}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Discord" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap">Mostrar</button>
                                {canEdit && <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">X</button>}
                            </div>
                        </div>
                    ) : (
                        <div key={item.id} className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm border border-bgInput">
                           <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(item.id)}>
                                {item.name || 'Item Sem Nome'}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Discord" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap">Mostrar</button>
                                {canEdit && <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
                                </div>
                            </div>
                            <input type="text" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} 
                                className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2" placeholder="Nome do Item" disabled={!canEdit}/>
                            <AutoResizingTextarea value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} 
                                placeholder="Descrição do item" className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md" disabled={!canEdit}/>
                        </div>
                    );
                })}
            </div>

            {(character.inventory || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhum item no inventário.</p>}

            {canEdit && (
                <div className="flex justify-center mt-4">
                    <button onClick={handleAddItem} className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button>
                </div>
            )}
        </>
      )}
    </section>
  );
};
export default InventorySection;
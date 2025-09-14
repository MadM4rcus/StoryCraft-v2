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

const EquippedItemsSection = ({ character, isMaster, onUpdate, onShowDiscord, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    if (!character || !user) return null;
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddItem = () => {
        const newItem = { id: crypto.randomUUID(), name: '', description: '', attributes: '', isCollapsed: true };
        onUpdate('equippedItems', [...(character.equippedItems || []), newItem]);
    };
    const handleRemoveItem = (id) => onUpdate('equippedItems', (character.equippedItems || []).filter(i => i.id !== id));
    const handleItemChange = (id, field, value) => onUpdate('equippedItems', (character.equippedItems || []).map(i => (i.id === id ? { ...i, [field]: value } : i)));
    const toggleItemCollapsed = (id) => {
        onUpdate('equippedItems', (character.equippedItems || []).map(item =>
            item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item
        ));
    };
    
    return (
        <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
                Itens Equipados
                <span>{isCollapsed ? '▼' : '▲'}</span>
            </h2>
            {!isCollapsed && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(character.equippedItems || []).map(item => {
                            const isItemCollapsed = item.isCollapsed !== false;
                            return isItemCollapsed ? (
                                <div key={item.id} className="p-3 bg-gray-600 rounded-md shadow-sm border border-gray-500 flex justify-between items-center">
                                    <span className="font-semibold text-lg cursor-pointer text-white flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>
                                        {item.name || 'Item Sem Nome'}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Discord" className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-md whitespace-nowrap">Mostrar</button>
                                        {canEdit && <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">X</button>}
                                    </div>
                                </div>
                            ) : (
                                <div key={item.id} className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col p-3 bg-gray-600 rounded-md shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-lg w-full cursor-pointer text-white" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <button onClick={() => onShowDiscord(item.name, item.description)} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-md">Mostrar</button>
                                            {canEdit && <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
                                        </div>
                                    </div>
                                    <input type="text" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className="font-semibold text-lg w-full p-1 bg-gray-700 border border-gray-500 rounded-md mb-2 text-white" placeholder="Nome" disabled={!canEdit} />
                                    <AutoResizingTextarea value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} placeholder="Descrição" className="text-sm text-gray-300 italic w-full p-1 bg-gray-700 border border-gray-500 rounded-md mb-2 text-white" disabled={!canEdit} />
                                    <AutoResizingTextarea value={item.attributes} onChange={(e) => handleItemChange(item.id, 'attributes', e.target.value)} placeholder="Atributos/Efeitos" className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-sm text-white" disabled={!canEdit} />
                                </div>
                            );
                        })}
                    </div>
                    {(character.equippedItems || []).length === 0 && <p className="text-gray-400 italic mt-4">Nenhum item equipado.</p>}
                    {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddItem} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-full shadow-lg">+</button></div>}
                </>
            )}
        </section>
    );
};

export default EquippedItemsSection;
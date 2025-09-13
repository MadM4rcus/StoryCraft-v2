import React from 'react';
import { useAuth } from '../hooks/useAuth';

const AutoResizingTextarea = ({ value, onChange, placeholder, className, disabled }) => {
    const textareaRef = React.useRef(null);
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);
    return <textarea ref={textareaRef} value={value} onChange={onChange} placeholder={placeholder} className={`${className} resize-none overflow-hidden`} rows="1" disabled={disabled} />;
};

const EquippedItemsSection = ({ character, isMaster, onUpdate, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddItem = () => {
        const newItem = { id: crypto.randomUUID(), name: '', description: '', attributes: '', isCollapsed: false };
        onUpdate('equippedItems', [...(character.equippedItems || []), newItem]);
    };
    const handleRemoveItem = (id) => onUpdate('equippedItems', (character.equippedItems || []).filter(i => i.id !== id));
    const handleItemChange = (id, field, value) => onUpdate('equippedItems', (character.equippedItems || []).map(i => (i.id === id ? { ...i, [field]: value } : i)));
    const toggleItemCollapsed = (id) => {
        const newList = (character.equippedItems || []).map(item =>
            item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item
        );
        onUpdate('equippedItems', newList);
    };
    const handleShowOnDiscord = (name, description) => alert(`Mostrar no Discord:\n\nTítulo: ${name}\nDescrição: ${description}`);

    return (
        <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
                Itens Equipados
                <span>{isCollapsed ? '▼' : '▲'}</span>
            </h2>
            {!isCollapsed && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(character.equippedItems || []).map(item => (
                            <div key={item.id} className="flex flex-col p-3 bg-gray-600 rounded-md shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-lg w-full cursor-pointer text-white" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'} {item.isCollapsed ? '...' : ''}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        <button onClick={() => handleShowOnDiscord(item.name, item.description)} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-md">Mostrar</button>
                                        {canEdit && <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
                                    </div>
                                </div>
                                {!item.isCollapsed && <>
                                    <input type="text" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className="font-semibold text-lg w-full p-1 bg-gray-700 border border-gray-500 rounded-md mb-2 text-white" placeholder="Nome" disabled={!canEdit} />
                                    <AutoResizingTextarea value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} placeholder="Descrição" className="text-sm text-gray-300 italic w-full p-1 bg-gray-700 border border-gray-500 rounded-md mb-2 text-white" disabled={!canEdit} />
                                    <AutoResizingTextarea value={item.attributes} onChange={(e) => handleItemChange(item.id, 'attributes', e.target.value)} placeholder="Atributos/Efeitos" className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-sm text-white" disabled={!canEdit} />
                                </>}
                            </div>
                        ))}
                    </div>
                    {canEdit && <div className="flex justify-end mt-4"><button onClick={handleAddItem} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-full shadow-lg">+</button></div>}
                </>
            )}
        </section>
    );
};

export default EquippedItemsSection;
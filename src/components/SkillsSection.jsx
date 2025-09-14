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

const AbilitiesSection = ({ character, isMaster, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddAbility = () => {
        const newAbility = { id: crypto.randomUUID(), title: '', description: '', isCollapsed: false };
        onUpdate('abilities', [...(character.abilities || []), newAbility]);
    };

    const handleRemoveAbility = (id) => onUpdate('abilities', (character.abilities || []).filter(a => a.id !== id));
    
    const handleAbilityChange = (id, field, value) => onUpdate('abilities', (character.abilities || []).map(a => (a.id === id ? { ...a, [field]: value } : a)));

    const toggleItemCollapsed = (id) => {
        const newList = (character.abilities || []).map(item =>
            item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item
        );
        onUpdate('abilities', newList);
    };

    return (
        <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
            <h2 
                className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center"
                onClick={toggleSection}
            >
                Habilidades
                <span>{isCollapsed ? '▼' : '▲'}</span>
            </h2>
            {!isCollapsed && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(character.abilities || []).map(ability => (
                            <div key={ability.id} className="flex flex-col p-3 bg-gray-600 rounded-md shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-lg w-full cursor-pointer text-white" onClick={() => toggleItemCollapsed(ability.id)}>
                                        {ability.title || 'Habilidade Sem Título'} {ability.isCollapsed ? '...' : ''}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        <button onClick={() => onShowDiscord(ability.title, ability.description)} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-md">Mostrar</button>
                                        {canEdit && <button onClick={() => handleRemoveAbility(ability.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
                                    </div>
                                </div>
                                {!ability.isCollapsed && (
                                    <>
                                        <input 
                                            type="text" 
                                            value={ability.title} 
                                            onChange={(e) => handleAbilityChange(ability.id, 'title', e.target.value)} 
                                            className="font-semibold text-lg w-full p-1 bg-gray-700 border border-gray-500 rounded-md mb-2 text-white" 
                                            placeholder="Título" 
                                            disabled={!canEdit} 
                                        />
                                        <AutoResizingTextarea 
                                            value={ability.description} 
                                            onChange={(e) => handleAbilityChange(ability.id, 'description', e.target.value)} 
                                            placeholder="Descrição" 
                                            className="text-sm text-gray-300 italic w-full p-1 bg-gray-700 border border-gray-500 rounded-md text-white" 
                                            disabled={!canEdit} 
                                        />
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    {canEdit && (
                        <div className="flex justify-end mt-4">
                            <button onClick={handleAddAbility} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-full shadow-lg">+</button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default AbilitiesSection;

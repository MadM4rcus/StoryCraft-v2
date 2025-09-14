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

const SkillsSection = ({ character, isMaster, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
    const { user } = useAuth();
    if (!character || !user) return null;
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddAbility = () => {
        const newAbility = { id: crypto.randomUUID(), title: '', description: '', isCollapsed: true };
        onUpdate('abilities', [...(character.abilities || []), newAbility]);
    };

    const handleRemoveAbility = (id) => onUpdate('abilities', (character.abilities || []).filter(a => a.id !== id));
    const handleAbilityChange = (id, field, value) => onUpdate('abilities', (character.abilities || []).map(a => (a.id === id ? { ...a, [field]: value } : a)));

    const toggleItemCollapsed = (id) => {
        onUpdate('abilities', (character.abilities || []).map(item =>
            item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item
        ));
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(character.abilities || []).map(ability => {
                            const isAbilityCollapsed = ability.isCollapsed !== false;
                            return isAbilityCollapsed ? (
                                <div key={ability.id} className="p-3 bg-gray-600 rounded-md shadow-sm border border-gray-500 flex justify-between items-center">
                                    <span className="font-semibold text-lg cursor-pointer text-white flex-grow truncate" onClick={() => toggleItemCollapsed(ability.id)}>
                                        {ability.title || 'Habilidade Sem Título'}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <button onClick={() => onShowDiscord(ability.title, ability.description)} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-md">Mostrar</button>
                                        {canEdit && <button onClick={() => handleRemoveAbility(ability.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">X</button>}
                                    </div>
                                </div>
                            ) : (
                                <div key={ability.id} className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col p-3 bg-gray-600 rounded-md shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-lg w-full cursor-pointer text-white" onClick={() => toggleItemCollapsed(ability.id)}>
                                            {ability.title || 'Habilidade Sem Título'}
                                        </span>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <button onClick={() => onShowDiscord(ability.title, ability.description)} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-md">Mostrar</button>
                                            {canEdit && <button onClick={() => handleRemoveAbility(ability.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
                                        </div>
                                    </div>
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
                                </div>
                            );
                        })}
                    </div>
                    {(character.abilities || []).length === 0 && <p className="text-gray-400 italic mt-4">Nenhuma habilidade adicionada.</p>}
                    {canEdit && (
                        <div className="flex justify-center mt-4">
                            <button onClick={handleAddAbility} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-full shadow-lg">+</button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default SkillsSection;
// src/components/ListSections.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import SheetSkin from './SheetSkin';

// Helper de Textarea (usado por vários sub-componentes)
const AutoResizingTextarea = ({ value, onChange, onBlur, placeholder, className, disabled, name }) => {
    const textareaRef = useRef(null);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);
    return <textarea ref={textareaRef} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} className={`${className} resize-none overflow-hidden`} rows="1" disabled={disabled} name={name} />;
};

// --- Sub-componente para Inventário ---
const InventoryList = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, onShowDiscord }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;

    // Estado local para os itens do inventário
    const [localInventory, setLocalInventory] = useState(character.inventory || []);

    // Sincroniza o estado local com o estado da ficha pai
    useEffect(() => {
        setLocalInventory(character.inventory || []);
    }, [character.inventory]);

    const handleAddItem = () => onUpdate('inventory', [...(character.inventory || []), { id: crypto.randomUUID(), name: '', description: '', isCollapsed: false }]);
    const handleRemoveItem = (id) => onUpdate('inventory', (character.inventory || []).filter(item => item.id !== id));

    const handleLocalChange = (id, field, value) => {
        setLocalInventory(prevInventory => prevInventory.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSave = useCallback((id, field) => {
        const localItem = localInventory.find(item => item.id === id);
        const originalItem = (character.inventory || []).find(item => item.id === id);

        if (localItem && originalItem && localItem[field] !== originalItem[field]) {
            onUpdate('inventory', (character.inventory || []).map(item => item.id === id ? { ...item, [field]: localItem[field] } : item));
        }
    }, [localInventory, character.inventory, onUpdate]);

    const toggleItemCollapsed = (id) => {
        const itemToToggle = localInventory.find(item => item.id === id);
        if (itemToToggle) {
            onUpdate('inventory', (character.inventory || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));
        }
    };

    return (
        <SheetSkin title="Inventário" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(localInventory || []).map(item => {
                    const isItemCollapsed = item.isCollapsed !== false;
                    return isItemCollapsed ? (
                        <div key={item.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                            <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-2">Mostrar no Feed</button>
                        </div>
                    ) : (
                        <div key={item.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm border border-bgInput">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>                                
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-4">Mostrar no Feed</button>
                            </div>
                            <span className="text-textSecondary text-xs whitespace-nowrap cursor-pointer self-end" onClick={() => toggleItemCollapsed(item.id)}>Recolher ▲</span>
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleLocalChange(item.id, 'name', e.target.value)}
                                onBlur={() => handleSave(item.id, 'name')}
                                className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2"
                                placeholder="Nome do Item"
                                disabled={!canEdit}
                            />
                            <AutoResizingTextarea
                                name="description"
                                value={item.description}
                                onChange={(e) => handleLocalChange(item.id, 'description', e.target.value)}
                                onBlur={() => handleSave(item.id, 'description')}
                                placeholder="Descrição do item"
                                className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md"
                                disabled={!canEdit}
                            />
                            {canEdit && (
                                <div className="flex justify-end mt-2 pt-2 border-t border-bgInput/50">
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)} 
                                        className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                                        title="Remover Item"
                                    ><span role="img" aria-label="Remover" className="text-xl">🗑️</span></button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {(localInventory || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhum item no inventário.</p>}
            {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddItem} className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button></div>}
        </SheetSkin>
    );
};

// --- Sub-componente para Itens Equipados ---
const EquippedItemsList = ({ character, isMaster, onUpdate, onShowDiscord, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const [localEquippedItems, setLocalEquippedItems] = useState(character.equippedItems || []);

    useEffect(() => {
        setLocalEquippedItems(character.equippedItems || []);
    }, [character.equippedItems]);

    const handleAddItem = () => onUpdate('equippedItems', [...(character.equippedItems || []), { id: crypto.randomUUID(), name: '', description: '', attributes: '', isCollapsed: false }]);
    const handleRemoveItem = (id) => onUpdate('equippedItems', (character.equippedItems || []).filter(i => i.id !== id));

    const handleLocalChange = (id, field, value) => {
        setLocalEquippedItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const handleSave = useCallback((id, field) => {
        const localItem = localEquippedItems.find(item => item.id === id);
        const originalItem = (character.equippedItems || []).find(item => item.id === id);
        if (localItem && originalItem && localItem[field] !== originalItem[field]) {
            onUpdate('equippedItems', (character.equippedItems || []).map(i => (i.id === id ? { ...i, [field]: localItem[field] } : i)));
        }
    }, [localEquippedItems, character.equippedItems, onUpdate]);

    const toggleItemCollapsed = (id) => onUpdate('equippedItems', (character.equippedItems || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

    return (
        <SheetSkin title="Itens Equipados" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(localEquippedItems || []).map(item => {
                    const isItemCollapsed = item.isCollapsed !== false;
                    return isItemCollapsed ? (
                        <div key={item.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                            <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-2">Mostrar no Feed</button>
                        </div>
                    ) : (
                        <div key={item.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm border border-bgInput">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-4">Mostrar no Feed</button>
                            </div>
                            <span className="text-textSecondary text-xs whitespace-nowrap cursor-pointer self-end" onClick={() => toggleItemCollapsed(item.id)}>Recolher ▲</span>
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleLocalChange(item.id, 'name', e.target.value)}
                                onBlur={() => handleSave(item.id, 'name')}
                                className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2"
                                placeholder="Nome"
                                disabled={!canEdit}
                            />
                            <AutoResizingTextarea
                                value={item.description}
                                onChange={(e) => handleLocalChange(item.id, 'description', e.target.value)}
                                onBlur={() => handleSave(item.id, 'description')}
                                placeholder="Descrição"
                                className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md mb-2"
                                disabled={!canEdit}
                            />
                            <AutoResizingTextarea
                                value={item.attributes}
                                onChange={(e) => handleLocalChange(item.id, 'attributes', e.target.value)}
                                onBlur={() => handleSave(item.id, 'attributes')}
                                placeholder="Atributos/Efeitos"
                                className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-sm text-textPrimary"
                                disabled={!canEdit}
                            />
                            {canEdit && (
                                <div className="flex justify-end mt-2 pt-2 border-t border-bgInput/50">
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)} 
                                        className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                                        title="Remover Item"
                                    ><span role="img" aria-label="Remover" className="text-xl">🗑️</span></button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {(localEquippedItems || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhum item equipado.</p>}
            {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddItem} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
        </SheetSkin>
    );
};

// --- Sub-componente para Habilidades ---
const SkillsList = ({ character, isMaster, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const [localAbilities, setLocalAbilities] = useState(character.abilities || []);

    useEffect(() => {
        setLocalAbilities(character.abilities || []);
    }, [character.abilities]);

    const handleAddAbility = () => onUpdate('abilities', [...(character.abilities || []), { id: crypto.randomUUID(), title: '', description: '', isCollapsed: false }]);
    const handleRemoveAbility = (id) => onUpdate('abilities', (character.abilities || []).filter(a => a.id !== id));

    const handleLocalChange = (id, field, value) => {
        setLocalAbilities(prevAbilities => prevAbilities.map(ability => (ability.id === id ? { ...ability, [field]: value } : ability)));
    };

    const handleSave = useCallback((id, field) => {
        const localAbility = localAbilities.find(a => a.id === id);
        const originalAbility = (character.abilities || []).find(a => a.id === id);
        if (localAbility && originalAbility && localAbility[field] !== originalAbility[field]) {
            onUpdate('abilities', (character.abilities || []).map(a => (a.id === id ? { ...a, [field]: localAbility[field] } : a)));
        }
    }, [localAbilities, character.abilities, onUpdate]);

    const toggleItemCollapsed = (id) => onUpdate('abilities', (character.abilities || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

    return (
        <SheetSkin title="Habilidades" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(localAbilities || []).map(ability => {
                    const isAbilityCollapsed = ability.isCollapsed !== false;
                    return isAbilityCollapsed ? (
                        <div key={ability.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(ability.id)}>{ability.title || 'Habilidade Sem Título'}</span>                            
                            <button onClick={() => onShowDiscord(ability.title, ability.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-2">Mostrar no Feed</button>
                        </div>
                    ) : (
                        <div key={ability.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(ability.id)}>{ability.title || 'Habilidade Sem Título'}</span>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                    <button onClick={() => onShowDiscord(ability.title, ability.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap">Mostrar no Feed</button>
                                    <span className="text-textSecondary text-xs whitespace-nowrap cursor-pointer" onClick={() => toggleItemCollapsed(ability.id)}>Recolher ▲</span>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={ability.title}
                                onChange={(e) => handleLocalChange(ability.id, 'title', e.target.value)}
                                onBlur={() => handleSave(ability.id, 'title')}
                                className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2"
                                placeholder="Título"
                                disabled={!canEdit}
                            />
                            <AutoResizingTextarea
                                value={ability.description}
                                onChange={(e) => handleLocalChange(ability.id, 'description', e.target.value)}
                                onBlur={() => handleSave(ability.id, 'description')}
                                placeholder="Descrição"
                                className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md"
                                disabled={!canEdit}
                            />
                            {canEdit && (
                                <div className="flex justify-end mt-2 pt-2 border-t border-bgInput/50">
                                    <button 
                                        onClick={() => handleRemoveAbility(ability.id)} 
                                        className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                                        title="Remover Habilidade"
                                    ><span role="img" aria-label="Remover" className="text-xl">🗑️</span></button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {(localAbilities || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhuma habilidade adicionada.</p>}
            {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddAbility} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
        </SheetSkin>
    );
};

// --- Sub-componente para Vantagens/Desvantagens ---
const PerksList = ({ character, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
    const canEdit = true;
    const handleAddPerk = (type) => onUpdate(type, [...(character[type] || []), { id: crypto.randomUUID(), name: '', description: '', origin: { class: false, race: false, manual: true }, value: 0, isCollapsed: false }]);
    const handleRemovePerk = (type, id) => onUpdate(type, (character[type] || []).filter(p => p.id !== id));
    const handlePerkOriginChange = (type, id, originType) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, origin: { ...p.origin, [originType]: !p.origin[originType] } } : p));
    const handlePerkUpdate = (type, id, field, value) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, [field]: value } : p));
    const toggleItemCollapsed = (type, id) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, isCollapsed: !p.isCollapsed } : p));

    return (
        <SheetSkin title="Vantagens e Desvantagens" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xl font-semibold text-textAccent/80 mb-3 border-b border-borderAccent/50 pb-1">Vantagens</h3>
                    <div className="space-y-2">
                        {(character.advantages || []).map(perk => <PerkItem key={perk.id} perk={perk} type="advantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkUpdate} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={onShowDiscord} />)}
                        {canEdit && <div className="flex justify-end mt-4"><button onClick={() => handleAddPerk('advantages')} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-textAccent/80 mb-3 border-b border-borderAccent/50 pb-1">Desvantagens</h3>
                    <div className="space-y-2">
                        {(character.disadvantages || []).map(perk => <PerkItem key={perk.id} perk={perk} type="disadvantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkUpdate} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={onShowDiscord} />)}
                        {canEdit && <div className="flex justify-end mt-4"><button onClick={() => handleAddPerk('disadvantages')} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
                    </div>
                </div>
            </div>
        </SheetSkin>
    );
};

const PerkItem = ({ perk, type, canEdit, onRemove, onChange, onOriginChange, onToggleCollapse, onShowDiscord }) => {
    const [localPerk, setLocalPerk] = useState(perk);

    useEffect(() => {
        setLocalPerk(perk);
    }, [perk.id]);

    const handleLocalChange = (e) => {
        const { name, value, type: inputType } = e.target;
        const parsedValue = inputType === 'number' ? parseInt(value, 10) || 0 : value;
        setLocalPerk(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSave = useCallback((field) => {
        if (localPerk[field] !== perk[field]) {
            onChange(type, localPerk.id, field, localPerk[field]);
        }
    }, [localPerk, perk, type, onChange]);

    return (
        <div className="flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
            <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => onToggleCollapse(type, perk.id)}>{localPerk.name || 'Sem Nome'} {perk.isCollapsed ? '...' : ''}</span>
                <button onClick={() => onShowDiscord(localPerk.name, localPerk.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-2">Mostrar no Feed</button>
            </div>
            {!perk.isCollapsed && (<>
                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="text"
                        name="name" // O nome do campo corresponde ao estado
                        value={localPerk.name}
                        onChange={handleLocalChange}
                        onBlur={() => handleSave('name')}
                        className="font-semibold text-lg flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                        placeholder="Nome"
                        disabled={!canEdit}
                    />
                    <input
                        type="number"
                        name="value" // O nome do campo corresponde ao estado
                        value={localPerk.value === 0 ? '' : localPerk.value}
                        onChange={handleLocalChange}
                        onBlur={() => handleSave('value')}
                        className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-center text-textPrimary"
                        placeholder="Valor"
                        disabled={!canEdit}
                    />
                </div>
                <AutoResizingTextarea
                    name="description" // O nome do campo corresponde ao estado
                    value={localPerk.description}
                    onChange={handleLocalChange}
                    onBlur={() => handleSave('description')}
                    placeholder="Descrição"
                    className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md"
                    disabled={!canEdit}
                />
                <div className="flex gap-3 text-sm text-textSecondary mt-2">
                    {['class', 'race', 'manual'].map(originType => (
                        <label key={originType} className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={perk.origin?.[originType] || false}
                                onChange={() => onOriginChange(type, perk.id, originType)}
                                className="form-checkbox text-btnHighlightBg rounded"
                                disabled={!canEdit}
                            />
                            {originType.charAt(0).toUpperCase() + originType.slice(1)}
                        </label>
                    ))}
                </div>
                {canEdit && (
                    <div className="flex justify-end mt-2 pt-2 border-t border-bgInput/50">
                        <button 
                            onClick={() => onRemove(type, perk.id)} 
                            className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                            title={`Remover ${type === 'advantages' ? 'Vantagem' : 'Desvantagem'}`}
                        ><span role="img" aria-label="Remover" className="text-xl">🗑️</span></button>
                    </div>
                )}
            </>)}
        </div>
    );
};

// Exporta cada componente individualmente para que o CharacterSheet possa controlá-los
export { InventoryList, EquippedItemsList, SkillsList, PerksList };
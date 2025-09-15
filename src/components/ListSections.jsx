// src/components/ListSections.jsx

import React, { useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import SheetSkin from './SheetSkin';

// Helper de Textarea (usado por vários sub-componentes)
const AutoResizingTextarea = ({ value, onChange, placeholder, className, disabled }) => {
    const textareaRef = useRef(null);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);
    return <textarea ref={textareaRef} value={value} onChange={onChange} placeholder={placeholder} className={`${className} resize-none overflow-hidden`} rows="1" disabled={disabled} />;
};

// --- Sub-componente para Inventário ---
const InventoryList = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, onShowDiscord }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddItem = () => onUpdate('inventory', [...(character.inventory || []), { id: crypto.randomUUID(), name: '', description: '', isCollapsed: true }]);
    const handleRemoveItem = (id) => onUpdate('inventory', (character.inventory || []).filter(item => item.id !== id));
    const handleItemChange = (id, field, value) => onUpdate('inventory', (character.inventory || []).map(item => item.id === id ? { ...item, [field]: value } : item));
    const toggleItemCollapsed = (id) => onUpdate('inventory', (character.inventory || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

    return (
        <SheetSkin title="Inventário" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(character.inventory || []).map(item => {
                    const isItemCollapsed = item.isCollapsed !== false;
                    return isItemCollapsed ? (
                        <div key={item.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Discord" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap">Mostrar</button>
                                {canEdit && <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">X</button>}
                            </div>
                        </div>
                    ) : (
                        <div key={item.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm border border-bgInput">
                           <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Discord" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap">Mostrar</button>
                                {canEdit && <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
                                </div>
                            </div>
                            <input type="text" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2" placeholder="Nome do Item" disabled={!canEdit}/>
                            <AutoResizingTextarea value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} placeholder="Descrição do item" className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md" disabled={!canEdit}/>
                        </div>
                    );
                })}
            </div>
            {(character.inventory || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhum item no inventário.</p>}
            {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddItem} className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button></div>}
        </SheetSkin>
    );
};

// --- Sub-componente para Itens Equipados ---
const EquippedItemsList = ({ character, isMaster, onUpdate, onShowDiscord, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const handleAddItem = () => onUpdate('equippedItems', [...(character.equippedItems || []), { id: crypto.randomUUID(), name: '', description: '', attributes: '', isCollapsed: true }]);
    const handleRemoveItem = (id) => onUpdate('equippedItems', (character.equippedItems || []).filter(i => i.id !== id));
    const handleItemChange = (id, field, value) => onUpdate('equippedItems', (character.equippedItems || []).map(i => (i.id === id ? { ...i, [field]: value } : i)));
    const toggleItemCollapsed = (id) => onUpdate('equippedItems', (character.equippedItems || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));
    
    return (
        <SheetSkin title="Itens Equipados" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(character.equippedItems || []).map(item => {
                     const isItemCollapsed = item.isCollapsed !== false;
                    return isItemCollapsed ? (
                        <div key={item.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Discord" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap">Mostrar</button>
                                {canEdit && <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">X</button>}
                            </div>
                        </div>
                    ) : (
                        <div key={item.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                    <button onClick={() => onShowDiscord(item.name, item.description)} className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md">Mostrar</button>
                                    {canEdit && <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
                                </div>
                            </div>
                            <input type="text" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md mb-2 text-textPrimary" placeholder="Nome" disabled={!canEdit} />
                            <AutoResizingTextarea value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} placeholder="Descrição" className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md mb-2" disabled={!canEdit} />
                            <AutoResizingTextarea value={item.attributes} onChange={(e) => handleItemChange(item.id, 'attributes', e.target.value)} placeholder="Atributos/Efeitos" className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-sm text-textPrimary" disabled={!canEdit} />
                        </div>
                    );
                })}
            </div>
            {(character.equippedItems || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhum item equipado.</p>}
            {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddItem} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
        </SheetSkin>
    );
};

// --- Sub-componente para Habilidades ---
const SkillsList = ({ character, isMaster, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const handleAddAbility = () => onUpdate('abilities', [...(character.abilities || []), { id: crypto.randomUUID(), title: '', description: '', isCollapsed: true }]);
    const handleRemoveAbility = (id) => onUpdate('abilities', (character.abilities || []).filter(a => a.id !== id));
    const handleAbilityChange = (id, field, value) => onUpdate('abilities', (character.abilities || []).map(a => (a.id === id ? { ...a, [field]: value } : a)));
    const toggleItemCollapsed = (id) => onUpdate('abilities', (character.abilities || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

    return (
        <SheetSkin title="Habilidades" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {(character.abilities || []).map(ability => {
                    const isAbilityCollapsed = ability.isCollapsed !== false;
                    return isAbilityCollapsed ? (
                        <div key={ability.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(ability.id)}>{ability.title || 'Habilidade Sem Título'}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <button onClick={() => onShowDiscord(ability.title, ability.description)} className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md">Mostrar</button>
                                {canEdit && <button onClick={() => handleRemoveAbility(ability.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">X</button>}
                            </div>
                        </div>
                    ) : (
                        <div key={ability.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(ability.id)}>{ability.title || 'Habilidade Sem Título'}</span>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                    <button onClick={() => onShowDiscord(ability.title, ability.description)} className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md">Mostrar</button>
                                    {canEdit && <button onClick={() => handleRemoveAbility(ability.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
                                </div>
                            </div>
                            <input type="text" value={ability.title} onChange={(e) => handleAbilityChange(ability.id, 'title', e.target.value)} className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2" placeholder="Título" disabled={!canEdit} />
                            <AutoResizingTextarea value={ability.description} onChange={(e) => handleAbilityChange(ability.id, 'description', e.target.value)} placeholder="Descrição" className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md" disabled={!canEdit} />
                        </div>
                    );
                })}
            </div>
            {(character.abilities || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhuma habilidade adicionada.</p>}
            {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddAbility} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
        </SheetSkin>
    );
};

// --- Sub-componente para Vantagens/Desvantagens ---
const PerksList = ({ character, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
    const canEdit = true;
    const handleAddPerk = (type) => onUpdate(type, [...(character[type] || []), { id: crypto.randomUUID(), name: '', description: '', origin: { class: false, race: false, manual: true }, value: 0, isCollapsed: false }]);
    const handleRemovePerk = (type, id) => onUpdate(type, (character[type] || []).filter(p => p.id !== id));
    const handlePerkChange = (type, id, field, value) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, [field]: field === 'value' ? parseInt(value, 10) || 0 : value } : p));
    const handlePerkOriginChange = (type, id, originType) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, origin: { ...p.origin, [originType]: !p.origin[originType] } } : p));
    const toggleItemCollapsed = (type, id) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, isCollapsed: !p.isCollapsed } : p));

    return (
        <SheetSkin title="Vantagens e Desvantagens" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xl font-semibold text-textAccent/80 mb-3 border-b border-borderAccent/50 pb-1">Vantagens</h3>
                    <div className="space-y-2">
                        {(character.advantages || []).map(perk => <PerkItem key={perk.id} perk={perk} type="advantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkChange} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={onShowDiscord} />)}
                        {canEdit && <div className="flex justify-end mt-4"><button onClick={() => handleAddPerk('advantages')} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-textAccent/80 mb-3 border-b border-borderAccent/50 pb-1">Desvantagens</h3>
                    <div className="space-y-2">
                        {(character.disadvantages || []).map(perk => <PerkItem key={perk.id} perk={perk} type="disadvantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkChange} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={onShowDiscord} />)}
                        {canEdit && <div className="flex justify-end mt-4"><button onClick={() => handleAddPerk('disadvantages')} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
                    </div>
                </div>
            </div>
        </SheetSkin>
    );
};

const PerkItem = ({ perk, type, canEdit, onRemove, onChange, onOriginChange, onToggleCollapse, onShowDiscord }) => (
    <div className="flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => onToggleCollapse(type, perk.id)}>{perk.name || 'Sem Nome'} {perk.isCollapsed ? '...' : ''}</span>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button onClick={() => onShowDiscord(perk.name, perk.description)} title="Mostrar no Discord" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md">Mostrar</button>
            {canEdit && <button onClick={() => onRemove(type, perk.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
          </div>
        </div>
        {!perk.isCollapsed && (<>
            <div className="flex items-center gap-2 mb-2">
              <input type="text" value={perk.name} onChange={(e) => onChange(type, perk.id, 'name', e.target.value)} className="font-semibold text-lg flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" placeholder="Nome" disabled={!canEdit} />
              <input type="number" value={perk.value === 0 ? '' : perk.value} onChange={(e) => onChange(type, perk.id, 'value', e.target.value)} className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-center text-textPrimary" placeholder="Valor" disabled={!canEdit} />
            </div>
            <AutoResizingTextarea value={perk.description} onChange={(e) => onChange(type, perk.id, 'description', e.target.value)} placeholder="Descrição" className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md" disabled={!canEdit} />
            <div className="flex gap-3 text-sm text-textSecondary mt-2">
              {['class', 'race', 'manual'].map(originType => (<label key={originType} className="flex items-center gap-1"><input type="checkbox" checked={perk.origin?.[originType]} onChange={() => onOriginChange(type, perk.id, originType)} className="form-checkbox text-btnHighlightBg rounded" disabled={!canEdit} /> {originType.charAt(0).toUpperCase() + originType.slice(1)}</label>))}
            </div>
        </>)}
    </div>
);

// --- Sub-componente para Perícias ---
const SpecializationsList = ({ character, isMaster, onUpdate, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const handleAddSpecialization = () => onUpdate('specializations', [...(character.specializations || []), { id: crypto.randomUUID(), name: '', modifier: 0, bonus: 0, isCollapsed: false }]);
    const handleRemoveSpecialization = (id) => onUpdate('specializations', (character.specializations || []).filter(s => s.id !== id));
    const handleSpecializationChange = (id, field, value) => onUpdate('specializations', (character.specializations || []).map(s => (s.id === id ? { ...s, [field]: field === 'name' ? value : parseInt(value, 10) || 0 } : s)));
    const toggleItemCollapsed = (id) => onUpdate('specializations', (character.specializations || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

    return (
        <SheetSkin title="Perícias" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(character.specializations || []).map(spec => (
                     <div key={spec.id} className="flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(spec.id)}>{spec.name || 'Perícia Sem Nome'} {spec.isCollapsed ? '...' : ''}</span>
                            {canEdit && <button onClick={() => handleRemoveSpecialization(spec.id)} className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md flex-shrink-0">Remover</button>}
                        </div>
                        {!spec.isCollapsed && (<>
                            <input type="text" value={spec.name} onChange={(e) => handleSpecializationChange(spec.id, 'name', e.target.value)} className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2" placeholder="Nome da Perícia" disabled={!canEdit} />
                            <div className="flex gap-4 text-sm mt-2 text-textPrimary">
                                <label className="flex items-center gap-1">Mod: <input type="number" value={spec.modifier === 0 ? '' : spec.modifier} onChange={(e) => handleSpecializationChange(spec.id, 'modifier', e.target.value)} className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center" disabled={!canEdit} /></label>
                                <label className="flex items-center gap-1">Bônus: <input type="number" value={spec.bonus === 0 ? '' : spec.bonus} onChange={(e) => handleSpecializationChange(spec.id, 'bonus', e.target.value)} className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center" disabled={!canEdit} /></label>
                            </div>
                        </>)}
                    </div>
                ))}
            </div>
            {canEdit && <div className="flex justify-end mt-4"><button onClick={handleAddSpecialization} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
        </SheetSkin>
    );
};


// Exporta cada componente individualmente para que o CharacterSheet possa controlá-los
export { InventoryList, EquippedItemsList, SkillsList, PerksList, SpecializationsList };
// src/components/BuffsSection.jsx

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import SheetSkin from './SheetSkin';

const BuffsSection = ({ character, isMaster, onUpdate, allAttributes, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    if (!character || !user) return <div className="p-6 text-center text-textSecondary">A carregar buffs...</div>;
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddBuff = () => {
        const newBuff = { 
            id: crypto.randomUUID(), name: 'Novo Buff', effects: [],
            isActive: false, isCollapsed: false, costValue: 0, costType: ''
        };
        onUpdate('buffs', [...(character.buffs || []), newBuff]);
    };

    const handleRemoveBuff = (id) => onUpdate('buffs', (character.buffs || []).filter(b => b.id !== id));
    
    const handleBuffChange = (buffId, field, value) => {
        const updatedBuffs = (character.buffs || []).map(buff => {
            if (buff.id === buffId) {
                const newValue = field === 'costValue' ? parseInt(value, 10) || 0 : value;
                return { ...buff, [field]: newValue };
            }
            return buff;
        });
        onUpdate('buffs', updatedBuffs);
    };

    const handleToggleBuffActive = (id) => onUpdate('buffs', (character.buffs || []).map(buff => buff.id === id ? { ...buff, isActive: !buff.isActive } : buff));
    const toggleItemCollapsed = (id) => onUpdate('buffs', (character.buffs || []).map(buff => buff.id === id ? { ...buff, isCollapsed: !buff.isCollapsed } : buff));

    const handleAddBuffEffect = (buffId, type) => {
        const newEffect = { id: crypto.randomUUID(), type, target: '', value: type === 'attribute' ? 0 : '1d6' };
        const updatedBuffs = (character.buffs || []).map(buff => {
            if (buff.id === buffId) { return { ...buff, effects: [...(buff.effects || []), newEffect] }; }
            return buff;
        });
        onUpdate('buffs', updatedBuffs);
    };

    const handleRemoveBuffEffect = (buffId, effectId) => {
        const updatedBuffs = (character.buffs || []).map(buff => {
            if (buff.id === buffId) { return { ...buff, effects: (buff.effects || []).filter(eff => eff.id !== effectId) }; }
            return buff;
        });
        onUpdate('buffs', updatedBuffs);
    };

    const handleBuffEffectChange = (buffId, effectId, field, value) => {
        const updatedBuffs = (character.buffs || []).map(buff => {
            if (buff.id === buffId) {
                const updatedEffects = (buff.effects || []).map(eff => {
                    if (eff.id === effectId) {
                        const updatedEffect = { ...eff, [field]: value };
                        if (field === 'type') {
                            updatedEffect.target = '';
                            updatedEffect.value = value === 'attribute' ? 0 : '1d6';
                        }
                        return updatedEffect;
                    }
                    return eff;
                });
                return { ...buff, effects: updatedEffects };
            }
            return buff;
        });
        onUpdate('buffs', updatedBuffs);
    };
    
    return (
        <SheetSkin title="Buffs" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(character.buffs || []).map(buff => {
                        const isBuffCollapsed = buff.isCollapsed !== false;
                        
                        return isBuffCollapsed ? (
                            <div key={buff.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                                <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(buff.id)}>
                                    {buff.name || 'Buff Sem Nome'}
                                </span>
                                <label className="flex items-center cursor-pointer ml-2">
                                    <div className="relative">
                                        <input type="checkbox" checked={buff.isActive} onChange={() => handleToggleBuffActive(buff.id)} className="sr-only" disabled={!canEdit}/>
                                        <div className={`block w-12 h-6 rounded-full ${buff.isActive ? 'bg-green-500' : 'bg-bgInput'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${buff.isActive ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div key={buff.id} className="col-span-1 sm:col-span-2 lg:col-span-3 p-4 bg-bgElement rounded-md shadow-sm border border-bgInput">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow" onClick={() => toggleItemCollapsed(buff.id)}>
                                        {buff.name || 'Buff Sem Nome'}
                                    </span>
                                    <div className="flex items-center gap-4 ml-4">
                                        <label className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input type="checkbox" checked={buff.isActive} onChange={() => handleToggleBuffActive(buff.id)} className="sr-only" disabled={!canEdit}/>
                                                <div className={`block w-14 h-8 rounded-full ${buff.isActive ? 'bg-green-500' : 'bg-bgInput'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${buff.isActive ? 'transform translate-x-6' : ''}`}></div>
                                            </div>
                                        </label>
                                        {canEdit && <button onClick={() => handleRemoveBuff(buff.id)} className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-full flex items-center justify-center flex-shrink-0">X</button>}
                                    </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-bgInput/50 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-textSecondary block mb-1">Nome do Buff:</label>
                                            <input type="text" placeholder="Nome do Buff" value={buff.name} onChange={(e) => handleBuffChange(buff.id, 'name', e.target.value)} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary font-semibold mb-4" disabled={!canEdit}/>
                                            
                                            <label className="text-sm font-medium text-textSecondary block mb-1">Custo de Manutenção:</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" placeholder="0" value={buff.costValue || ''} onChange={(e) => handleBuffChange(buff.id, 'costValue', e.target.value)} className="w-20 p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit}/>
                                                <select value={buff.costType} onChange={(e) => handleBuffChange(buff.id, 'costType', e.target.value)} className="p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit}>
                                                    <option value="">N/A</option>
                                                    <option value="HP">HP</option>
                                                    <option value="MP">MP</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-textSecondary block mb-1">Efeitos do Buff:</label>
                                            <div className="space-y-2">
                                                {(buff.effects || []).map(effect => (
                                                    <div key={effect.id} className="grid grid-cols-3 gap-2">
                                                        <select value={effect.type} onChange={(e) => handleBuffEffectChange(buff.id, effect.id, 'type', e.target.value)} className="p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary col-span-3 sm:col-span-1" disabled={!canEdit}>
                                                            <option value="attribute">Modificar Atributo</option>
                                                            <option value="dice">Adicionar Dado/Nº</option>
                                                        </select>
                                                        
                                                        {effect.type === 'attribute' ? (
                                                            <select value={effect.target} onChange={(e) => handleBuffEffectChange(buff.id, effect.id, 'target', e.target.value)} className="p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary col-span-3 sm:col-span-1" disabled={!canEdit}>
                                                                <option value="">Selecione Atributo</option>
                                                                {allAttributes.map(name => <option key={name} value={name}>{name}</option>)}
                                                            </select>
                                                        ) : (
                                                            <div className="p-2 bg-bgPage border-bgElement rounded-md text-textSecondary text-center italic col-span-3 sm:col-span-1">Não aplicável</div>
                                                        )}

                                                        <div className="flex items-center gap-2 col-span-3 sm:col-span-1">
                                                            <input type="text" placeholder={effect.type === 'attribute' ? "Valor (+/-)" : "1d6 ou 6"} value={effect.value || ''} onChange={(e) => handleBuffEffectChange(buff.id, effect.id, 'value', e.target.value)} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center" disabled={!canEdit}/>
                                                            {canEdit && <button onClick={() => handleRemoveBuffEffect(buff.id, effect.id)} className="w-7 h-7 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">-</button>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {canEdit && (
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => handleAddBuffEffect(buff.id, 'attribute')} className="px-2 py-1 text-xs bg-btnHighlightBg text-btnHighlightText rounded-md">+ Atributo</button>
                                                    <button onClick={() => handleAddBuffEffect(buff.id, 'dice')} className="px-2 py-1 text-xs bg-btnHighlightBg text-btnHighlightText rounded-md">+ Dado/Nº</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {(character.buffs || []).length === 0 && <p className="text-textSecondary italic">Nenhum buff criado.</p>}
                {canEdit && (<div className="flex justify-center mt-4"><button onClick={handleAddBuff} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button></div>)}
            </>
        </SheetSkin>
    );
};

export default BuffsSection;
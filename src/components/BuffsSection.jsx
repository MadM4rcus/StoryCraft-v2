import React from 'react';
import { useAuth } from '../hooks/useAuth';

const BuffsSection = ({ character, isMaster, onUpdate, allAttributes, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    if (!character || !user) return <div className="p-6 text-center text-gray-400">A carregar buffs...</div>;
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddBuff = () => {
        const newBuff = { id: crypto.randomUUID(), name: '', type: 'attribute', target: '', value: 0, costValue: 0, costType: '', isActive: false, isCollapsed: true };
        onUpdate('buffs', [...(character.buffs || []), newBuff]);
    };
    const handleRemoveBuff = (id) => onUpdate('buffs', (character.buffs || []).filter(b => b.id !== id));
    const handleBuffChange = (id, field, value) => {
        onUpdate('buffs', (character.buffs || []).map(buff => {
            if (buff.id === id) {
                const updatedBuff = { ...buff, [field]: value };
                if (field === 'type') {
                    updatedBuff.target = '';
                    updatedBuff.value = value === 'attribute' ? 0 : '';
                }
                return updatedBuff;
            }
            return buff;
        }));
    };
    const handleToggleBuffActive = (id) => onUpdate('buffs', (character.buffs || []).map(buff => buff.id === id ? { ...buff, isActive: !buff.isActive } : buff));
    const toggleItemCollapsed = (id) => onUpdate('buffs', (character.buffs || []).map(buff => buff.id === id ? { ...buff, isCollapsed: !buff.isCollapsed } : buff));
    
    return (
        <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
                Buffs <span>{isCollapsed ? '▼' : '▲'}</span>
            </h2>
            {!isCollapsed && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(character.buffs || []).map(buff => {
                            const isBuffCollapsed = buff.isCollapsed !== false;
                            return isBuffCollapsed ? (
                                <div key={buff.id} className="p-3 bg-gray-600 rounded-md shadow-sm border border-gray-500 flex justify-between items-center">
                                    <span className="font-semibold text-lg cursor-pointer text-white flex-grow truncate" onClick={() => toggleItemCollapsed(buff.id)}>
                                        {buff.name || 'Buff Sem Nome'}
                                    </span>
                                    <label className="flex items-center cursor-pointer ml-2">
                                        <div className="relative">
                                            <input type="checkbox" checked={buff.isActive} onChange={() => handleToggleBuffActive(buff.id)} className="sr-only" disabled={!canEdit}/>
                                            <div className={`block w-12 h-6 rounded-full ${buff.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${buff.isActive ? 'transform translate-x-6' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <div key={buff.id} className="col-span-1 sm:col-span-2 lg:col-span-3 p-3 bg-gray-600 rounded-md shadow-sm border border-gray-500">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-lg cursor-pointer text-white flex-grow" onClick={() => toggleItemCollapsed(buff.id)}>
                                            {buff.name || 'Buff Sem Nome'}
                                        </span>
                                        <div className="flex items-center gap-4 ml-4">
                                            <label className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" checked={buff.isActive} onChange={() => handleToggleBuffActive(buff.id)} className="sr-only" disabled={!canEdit}/>
                                                    <div className={`block w-14 h-8 rounded-full ${buff.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${buff.isActive ? 'transform translate-x-6' : ''}`}></div>
                                                </div>
                                            </label>
                                            {canEdit && <button onClick={() => handleRemoveBuff(buff.id)} className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-full flex items-center justify-center flex-shrink-0">X</button>}
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-500">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-center">
                                            <input type="text" placeholder="Nome do Buff" value={buff.name} onChange={(e) => handleBuffChange(buff.id, 'name', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white font-semibold" disabled={!canEdit}/>
                                            <select value={buff.type} onChange={(e) => handleBuffChange(buff.id, 'type', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white" disabled={!canEdit}>
                                                <option value="attribute">Modificar Atributo</option>
                                                <option value="dice">Adicionar Dado/Número</option>
                                            </select>
                                            {buff.type === 'attribute' && (
                                                <select value={buff.target} onChange={(e) => handleBuffChange(buff.id, 'target', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white" disabled={!canEdit}>
                                                    <option value="">Selecione um Atributo</option>
                                                    {allAttributes.map(name => <option key={name} value={name}>{name}</option>)}
                                                </select>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 items-center">
                                            <input type="text" placeholder={buff.type === 'attribute' ? "Valor (+/-)" : "1d6 ou 6"} value={buff.value || ''} onChange={(e) => handleBuffChange(buff.id, 'value', e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white text-center" disabled={!canEdit}/>
                                            <div className="flex items-center gap-2">
                                                <input type="number" placeholder="Custo" value={buff.costValue || ''} onChange={(e) => handleBuffChange(buff.id, 'costValue', e.target.value)} className="w-16 p-2 bg-gray-700 border border-gray-500 rounded-md text-white" disabled={!canEdit}/>
                                                <select value={buff.costType} onChange={(e) => handleBuffChange(buff.id, 'costType', e.target.value)} className="p-2 bg-gray-700 border border-gray-500 rounded-md text-white" disabled={!canEdit}>
                                                    <option value="">N/A</option>
                                                    <option value="HP">HP</option>
                                                    <option value="MP">MP</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {(character.buffs || []).length === 0 && <p className="text-gray-400 italic">Nenhum buff criado.</p>}
                    {canEdit && (
                        <div className="flex justify-center mt-4">
                            <button onClick={handleAddBuff} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};
export default BuffsSection;
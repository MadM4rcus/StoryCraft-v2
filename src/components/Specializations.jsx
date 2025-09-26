// src/components/Specializations.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import SheetSkin from './SheetSkin';

// --- Sub-componente para Perícias ---
const SpecializationsList = ({ character, isMaster, onUpdate, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const [localSpecializations, setLocalSpecializations] = useState(character.specializations || []);

    useEffect(() => {
        setLocalSpecializations(character.specializations || []);
    }, [character.specializations]);

    const handleAddSpecialization = () => onUpdate('specializations', [...(character.specializations || []), { id: crypto.randomUUID(), name: '', modifier: 0, bonus: 0, isCollapsed: false }]);
    const handleRemoveSpecialization = (id) => onUpdate('specializations', (character.specializations || []).filter(s => s.id !== id));

    const handleLocalChange = (id, field, value) => {
        setLocalSpecializations(prevSpecs => prevSpecs.map(spec => (spec.id === id ? { ...spec, [field]: value } : spec)));
    };

    const handleSave = useCallback((id, field) => {
        const localSpec = localSpecializations.find(s => s.id === id);
        const originalSpec = (character.specializations || []).find(s => s.id === id);

        if (localSpec && originalSpec && localSpec[field] !== originalSpec[field]) {
            const finalValue = field === 'name' ? localSpec[field] : parseInt(localSpec[field], 10) || 0;
            onUpdate('specializations', (character.specializations || []).map(s => (s.id === id ? { ...s, [field]: finalValue } : s)));
        }
    }, [localSpecializations, character.specializations, onUpdate]);

    const toggleItemCollapsed = (id) => onUpdate('specializations', (character.specializations || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

    return (
        <SheetSkin title="Perícias" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(localSpecializations || []).map(spec => (
                    <div key={spec.id} className="flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(spec.id)}>{spec.name || 'Perícia Sem Nome'} {spec.isCollapsed ? '...' : ''}</span>
                            {canEdit && <button onClick={() => handleRemoveSpecialization(spec.id)} className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md flex-shrink-0">Remover</button>}
                        </div>
                        {!spec.isCollapsed && (<>
                            <input
                                type="text"
                                name="name"
                                value={spec.name}
                                onChange={(e) => handleLocalChange(spec.id, 'name', e.target.value)}
                                onBlur={() => handleSave(spec.id, 'name')}
                                className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2"
                                placeholder="Nome da Perícia"
                                disabled={!canEdit}
                            />
                            <div className="flex gap-4 text-sm mt-2 text-textPrimary">
                                <label className="flex items-center gap-1">
                                    Mod:
                                    <input
                                        type="number"
                                        name="modifier"
                                        value={spec.modifier === 0 ? '' : spec.modifier}
                                        onChange={(e) => handleLocalChange(spec.id, 'modifier', e.target.value)}
                                        onBlur={() => handleSave(spec.id, 'modifier')}
                                        className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center"
                                        disabled={!canEdit}
                                    />
                                </label>
                                <label className="flex items-center gap-1">
                                    Bônus:
                                    <input
                                        type="number"
                                        name="bonus"
                                        value={spec.bonus === 0 ? '' : spec.bonus}
                                        onChange={(e) => handleLocalChange(spec.id, 'bonus', e.target.value)}
                                        onBlur={() => handleSave(spec.id, 'bonus')}
                                        className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center"
                                        disabled={!canEdit}
                                    />
                                </label>
                            </div>
                        </>)}
                    </div>
                ))}
            </div>
            {canEdit && <div className="flex justify-end mt-4"><button onClick={handleAddSpecialization} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
        </SheetSkin>
    );
};

export default SpecializationsList;

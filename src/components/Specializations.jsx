import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import SheetSkin from './SheetSkin';

const AutoResizingTextarea = ({ value, onChange, onBlur, placeholder, className, disabled }) => {
    const textareaRef = useRef(null);
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);
    return <textarea ref={textareaRef} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} className={`${className} resize-none overflow-hidden`} rows="1" disabled={disabled} />;
};

const SpecializationsList = ({
    character,
    isMaster,
    isCollapsed,
    toggleSection,
    allAttributes,
    onUpdate,
    onExecuteFormula
}) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const [localSpecializations, setLocalSpecializations] = useState(character.specializations || []);

    useEffect(() => {
        setLocalSpecializations(character.specializations || []);
    }, [character.specializations]);

    const handleUpdate = (newSpecializations) => {
        onUpdate('specializations', newSpecializations);
    };

    const handleAddSpecialization = () => {
        const newSpecialization = {
            id: crypto.randomUUID(),
            name: 'Nova Perícia',
            isCollapsed: false,
            mainDice: '1d20',
            components: [],
            description: '',
            trained: false,
            bonusRules: []
        };
        handleUpdate([...(character.specializations || []), newSpecialization]);
    };

    const handleRemoveSpecialization = (id) => {
        handleUpdate((character.specializations || []).filter(s => s.id !== id));
    };

    const handleLocalChange = (id, field, value) => {
        setLocalSpecializations(prevSpecs => prevSpecs.map(spec => (spec.id === id ? { ...spec, [field]: value } : spec)));
    };

    const handleSave = useCallback((id, field, value) => {
        const localSpec = localSpecializations.find(s => s.id === id);
        const originalSpec = (character.specializations || []).find(s => s.id === id);
        const finalValue = value !== undefined ? value : localSpec[field];

        if (localSpec && originalSpec && finalValue !== originalSpec[field]) {
            const updatedSpecs = (character.specializations || []).map(s => (s.id === id ? { ...s, [field]: finalValue } : s));
            handleUpdate(updatedSpecs);
        }
    }, [localSpecializations, character.specializations, onUpdate]);

    const toggleItemCollapsed = (id) => {
        const updatedSpecs = (character.specializations || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item);
        handleUpdate(updatedSpecs);
    };

    const handleAddComponent = (specId, type) => {
        const newComponent = { id: crypto.randomUUID(), type, value: '' };
        if (type === 'dice') newComponent.value = '1d6';
        if (type === 'number') newComponent.value = '0';
        const updatedSpecs = (character.specializations || []).map(s => s.id === specId ? { ...s, components: [...(s.components || []), newComponent] } : s);
        handleUpdate(updatedSpecs);
    };

    const handleRemoveComponent = (specId, componentId) => {
        const updatedSpecs = (character.specializations || []).map(s => s.id === specId ? { ...s, components: (s.components || []).filter(c => c.id !== componentId) } : s);
        handleUpdate(updatedSpecs);
    };

    const handleLocalComponentChange = (specId, componentId, field, value) => {
        setLocalSpecializations(prevSpecs => prevSpecs.map(s => s.id === specId ? {
            ...s, components: s.components.map(c => c.id === componentId ? { ...c, [field]: value } : c)
        } : s));
    };

    const handleSaveComponentChange = useCallback((specId, componentId, field) => {
        const localSpec = localSpecializations.find(s => s.id === specId);
        const localComponent = localSpec?.components.find(c => c.id === componentId);
        const originalSpec = (character.specializations || []).find(s => s.id === specId);
        const originalComponent = originalSpec?.components.find(c => c.id === componentId);

        if (localComponent && originalComponent && localComponent[field] !== originalComponent[field]) {
            const updatedSpecs = (character.specializations || []).map(s => s.id === specId ? {
                ...s, components: s.components.map(c => c.id === componentId ? { ...c, [field]: localComponent[field] } : c)
            } : s);
            handleUpdate(updatedSpecs);
        }
    }, [localSpecializations, character.specializations, onUpdate]);

    const handleAddBonusRule = (specId) => {
        const newRule = { id: crypto.randomUUID(), enabled: true, bonus: 1, each: 1, source: 'level', condition: 'none' };
        const updatedSpecs = (character.specializations || []).map(s => s.id === specId ? { ...s, bonusRules: [...(s.bonusRules || []), newRule] } : s);
        handleUpdate(updatedSpecs);
    };

    const handleRemoveBonusRule = (specId, ruleId) => {
        const updatedSpecs = (character.specializations || []).map(s => s.id === specId ? { ...s, bonusRules: (s.bonusRules || []).filter(r => r.id !== ruleId) } : s);
        handleUpdate(updatedSpecs);
    };

    const handleLocalBonusRuleChange = (specId, ruleId, field, value) => {
        setLocalSpecializations(prevSpecs => prevSpecs.map(s => s.id === specId ? {
            ...s,
            bonusRules: s.bonusRules.map(r => r.id === ruleId ? { ...r, [field]: value } : r)
        } : s))
    };

    const handleSaveBonusRuleChange = useCallback((specId, ruleId, field) => {
        const localSpec = localSpecializations.find(s => s.id === specId);
        const localRule = localSpec?.bonusRules.find(r => r.id === ruleId);
        const originalSpec = (character.specializations || []).find(s => s.id === specId);
        const originalRule = originalSpec?.bonusRules.find(r => r.id === ruleId);

        if (localRule && originalRule && localRule[field] !== originalRule[field]) {
            const updatedSpecs = (character.specializations || []).map(s => s.id === specId ? {
                ...s,
                bonusRules: s.bonusRules.map(r => r.id === ruleId ? { ...r, [field]: localRule[field] } : r)
            } : s);
            handleUpdate(updatedSpecs);
        }
    }, [localSpecializations, character.specializations, onUpdate]);

    const getAttributeValue = (attrName) => {
        if (!character) return 0;
        if (['Iniciativa', 'FA', 'FM', 'FD'].includes(attrName)) {
            return character.mainAttributes[attrName.toLowerCase()] || 0;
        }
        const dynamicAttr = (character.attributes || []).find(a => a.name === attrName);
        return dynamicAttr ? (dynamicAttr.base || 0) + (dynamicAttr.perm || 0) + (dynamicAttr.arma || 0) : 0;
    };

    const calculateTotalBonus = (spec) => {
        let total = (spec.components || []).reduce((acc, comp) => {
            if (comp.type === 'number') {
                return acc + (parseInt(comp.value, 10) || 0);
            }
            return acc;
        }, 0);

        (spec.bonusRules || []).forEach(rule => {
            if (!rule.enabled) return;
            if (rule.condition === 'trained' && !spec.trained) return;

            let sourceValue = 0;
            if (rule.source === 'level') {
                sourceValue = character.level || 1;
            } else if (rule.source && rule.source.startsWith('attribute_')) {
                const attrName = rule.source.replace('attribute_', '');
                sourceValue = getAttributeValue(attrName);
            }

            const each = parseInt(rule.each, 10) || 1;
            const bonus = parseInt(rule.bonus, 10) || 0;
            if (each > 0) {
                total += Math.floor(sourceValue / each) * bonus;
            }
        });

        return total;
    };

    return (
        <SheetSkin title="Perícias" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(localSpecializations || []).map(spec => {
                    const isSpecCollapsed = spec.isCollapsed !== false;
                    const totalBonus = calculateTotalBonus(spec);

                    return isSpecCollapsed ? (
                        <div key={spec.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(spec.id)}>
                                {spec.trained && '✅'} {spec.name || 'Perícia Sem Nome'}
                                {totalBonus !== 0 && ` (${totalBonus > 0 ? '+' : ''}${totalBonus})`}
                            </span>
                            <button onClick={() => onExecuteFormula({ ...spec, discordText: spec.description, components: [...(spec.components || []), { id: crypto.randomUUID(), type: 'dice', value: spec.mainDice }, { id: crypto.randomUUID(), type: 'number', value: totalBonus }] })} className="px-4 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg whitespace-nowrap ml-2 text-sm">Rolar</button>
                        </div>
                    ) : (
                        <div key={spec.id} className="col-span-1 sm:col-span-2 lg:col-span-3 p-4 bg-bgElement rounded-md shadow-sm border border-bgInput">
                            <div className="flex justify-between items-center gap-2 mb-3">
                                <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow" onClick={() => toggleItemCollapsed(spec.id)}>
                                    {spec.name || 'Perícia Sem Nome'}
                                </span>
                                <button onClick={() => onExecuteFormula({ ...spec, discordText: spec.description, components: [...(spec.components || []).filter(c => c.type !== 'number'), { id: crypto.randomUUID(), type: 'dice', value: spec.mainDice }, { id: crypto.randomUUID(), type: 'number', value: totalBonus }] })} className="px-5 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg whitespace-nowrap">Rolar</button>
                                {canEdit && <button onClick={() => toggleItemCollapsed(spec.id)} className="w-10 h-10 bg-gray-600 text-white text-lg rounded-md flex items-center justify-center font-bold">↑</button>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-bgInput pt-3 mt-3">
                                <div className="md:col-span-1">
                                    <label className="text-sm font-medium text-textSecondary block mb-1">Nome da Perícia:</label>
                                    <input type="text" placeholder="Nome da Perícia" value={spec.name} onChange={(e) => handleLocalChange(spec.id, 'name', e.target.value)} onBlur={() => handleSave(spec.id, 'name')} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary font-semibold mb-3" disabled={!canEdit} />
                                    <label className="text-sm font-medium text-textSecondary block mb-1">Dado Principal:</label>
                                    <input type="text" placeholder="1d20" value={spec.mainDice} onChange={(e) => handleLocalChange(spec.id, 'mainDice', e.target.value)} onBlur={() => handleSave(spec.id, 'mainDice')} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-3" disabled={!canEdit} />
                                    <div className="flex items-center mb-3">
                                        <input type="checkbox" id={`trained-${spec.id}`} checked={spec.trained} onChange={(e) => handleSave(spec.id, 'trained', e.target.checked)} className="form-checkbox text-green-500 rounded-sm" disabled={!canEdit} />
                                        <label htmlFor={`trained-${spec.id}`} className="ml-2 text-sm text-textSecondary">Treinado</label>
                                    </div>
                                    <label className="text-sm font-medium text-textSecondary block mb-2">Descrição:</label>
                                    <AutoResizingTextarea placeholder="Descrição..." value={spec.description} onChange={(e) => handleLocalChange(spec.id, 'description', e.target.value)} onBlur={() => handleSave(spec.id, 'description')} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-sm mb-3" disabled={!canEdit} />
                                    {canEdit && <button onClick={() => handleRemoveSpecialization(spec.id)} className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover Perícia</button>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-textSecondary block mb-2">Bônus Adicionais:</label>
                                    <div className="space-y-2 mb-3">
                                        {(spec.components || []).map(comp => (
                                            <div key={comp.id} className="flex items-center gap-2">
                                                {comp.type === 'number' ? (
                                                    <><input type="number" placeholder="0" value={comp.value} onChange={(e) => handleLocalComponentChange(spec.id, comp.id, 'value', e.target.value)} onBlur={() => handleSaveComponentChange(spec.id, comp.id, 'value')} className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit} /><div className="text-textSecondary flex-shrink-0">Número</div></>
                                                ) : comp.type === 'dice' ? (
                                                    <><input type="text" placeholder="1d6" value={comp.value} onChange={(e) => handleLocalComponentChange(spec.id, comp.id, 'value', e.target.value)} onBlur={() => handleSaveComponentChange(spec.id, comp.id, 'value')} className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit} /><div className="text-textSecondary flex-shrink-0">Dado</div></>
                                                ) : comp.type === 'attribute' ? (
                                                    <><select value={comp.value} onChange={(e) => handleLocalComponentChange(spec.id, comp.id, 'value', e.target.value)} onBlur={() => handleSaveComponentChange(spec.id, comp.id, 'value')} className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit}><option value="">Selecione Atributo</option>{allAttributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}</select><div className="text-textSecondary flex-shrink-0">Atributo</div></>
                                                ) : null}
                                                {canEdit && (<button onClick={() => handleRemoveComponent(spec.id, comp.id)} className="w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">-</button>)}
                                            </div>
                                        ))}
                                    </div>
                                    {canEdit && (
                                        <div className="flex gap-2 flex-wrap mb-4">
                                            <button onClick={() => handleAddComponent(spec.id, 'number')} className="px-2 py-1 text-xs bg-btnHighlightBg text-btnHighlightText rounded-md">+ Número</button>
                                            <button onClick={() => handleAddComponent(spec.id, 'dice')} className="px-2 py-1 text-xs bg-btnHighlightBg text-btnHighlightText rounded-md">+ Dado</button>
                                            <button onClick={() => handleAddComponent(spec.id, 'attribute')} className="px-2 py-1 text-xs bg-btnHighlightBg text-btnHighlightText rounded-md">+ Atributo</button>
                                        </div>
                                    )}

                                    <label className="text-sm font-medium text-textSecondary block mb-2">Bônus Condicionais:</label>
                                    <div className="space-y-2 mb-3">
                                        {(spec.bonusRules || []).map(rule => (
                                            <div key={rule.id} className="flex flex-col gap-2 p-2 rounded-md border border-dashed border-textSecondary/30">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <input type="checkbox" checked={rule.enabled} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'enabled', e.target.checked)} onBlur={() => handleSaveBonusRuleChange(spec.id, rule.id, 'enabled')} disabled={!canEdit} />
                                                    <span>Se</span>
                                                    <select value={rule.condition} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'condition', e.target.value)} onBlur={() => handleSaveBonusRuleChange(spec.id, rule.id, 'condition')} className="p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit}>
                                                        <option value="none">Sempre</option>
                                                        <option value="trained">Treinado</option>
                                                    </select>
                                                    <span>, a cada</span>
                                                    <input type="number" value={rule.each} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'each', e.target.value)} onBlur={() => handleSaveBonusRuleChange(spec.id, rule.id, 'each')} className="w-16 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit} />
                                                    <select value={rule.source} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'source', e.target.value)} onBlur={() => handleSaveBonusRuleChange(spec.id, rule.id, 'source')} className="p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit}>
                                                        <option value="level">Nível</option>
                                                        {allAttributes.map(attr => <option key={attr} value={`attribute_${attr}`}>{attr}</option>)}
                                                    </select>
                                                    <span>, ganha +</span>
                                                    <input type="number" value={rule.bonus} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'bonus', e.target.value)} onBlur={() => handleSaveBonusRuleChange(spec.id, rule.id, 'bonus')} className="w-16 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit} />
                                                    {canEdit && <button onClick={() => handleRemoveBonusRule(spec.id, rule.id)} className="w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">-</button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {canEdit && <button onClick={() => handleAddBonusRule(spec.id)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md">+ Regra de Bônus</button>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddSpecialization} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">+ Adicionar Perícia</button></div>}
        </SheetSkin>
    );
};

export default SpecializationsList;
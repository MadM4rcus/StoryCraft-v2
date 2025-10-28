import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks';
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

// --- NOVO COMPONENTE DE LETREIRO ---
// Este componente detecta se seu conteúdo é maior que o espaço disponível
// e aplica a animação de letreiro apenas se for.
const MarqueeWhenOverflow = ({ children, className, onClick }) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const containerRef = useRef(null);

    // useLayoutEffect é usado para medições de DOM antes da pintura
    React.useLayoutEffect(() => {
        const checkOverflow = () => {
            const el = containerRef.current;
            if (el) {
                // Compara o tamanho real do conteúdo (scrollWidth) 
                // com o tamanho visível (clientWidth)
                const hasOverflow = el.scrollWidth > el.clientWidth;
                if (hasOverflow !== isOverflowing) {
                    setIsOverflowing(hasOverflow);
                }
            }
        };

        // Verifica imediatamente
        checkOverflow();

        // Usa ResizeObserver para verificar de forma eficiente se o 
        // tamanho do elemento mudar (ex: resize da janela)
        const observer = new ResizeObserver(checkOverflow);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        // Limpa o observer ao desmontar
        return () => {
            observer.disconnect();
        };
    }, [children, isOverflowing]); // Re-executa se o texto (children) mudar

    return (
        <span ref={containerRef} className={`relative overflow-hidden whitespace-nowrap ${className}`} onClick={onClick}>
            <span className={isOverflowing ? 'animate-scroll-left' : 'inline-block'}>
                <span className={isOverflowing ? "inline-block pr-8" : "inline-block"}>{children}</span>
                {isOverflowing && (<span className="inline-block pr-8">{children}</span>)}
            </span>
        </span>
    );
};

const SpecializationsList = ({
    character,
    isMaster,
    isCollapsed,
    toggleSection,
    allAttributes,
    onUpdate,
    onExecuteFormula,
    isEditMode
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

    // --- LÓGICA PARA ADICIONAR/REMOVER COMPONENTES (ATRIBUTOS/NÚMEROS) ---
    const handleAddComponent = (specId, type) => {
        const newValue = type === 'attribute' ? allAttributes[0] || '' : 0;
        const newComponent = { id: crypto.randomUUID(), type, value: newValue };
        const updatedSpecs = (character.specializations || []).map(s => s.id === specId ? { ...s, components: [...(s.components || []), newComponent] } : s);
        handleUpdate(updatedSpecs);
    };

    const handleRemoveComponent = (specId, componentId) => {
        const updatedSpecs = (character.specializations || []).map(s => s.id === specId ? { ...s, components: (s.components || []).filter(c => c.id !== componentId) } : s);
        handleUpdate(updatedSpecs);
    };

    const handleLocalComponentChange = (specId, componentId, value) => {
        setLocalSpecializations(prevSpecs => prevSpecs.map(s => s.id === specId ? {
            ...s,
            components: s.components.map(c => c.id === componentId ? { ...c, value } : c)
        } : s));
    };

    const handleSaveComponent = useCallback((specId, componentId) => {
        const localSpec = localSpecializations.find(s => s.id === specId);
        const localComp = localSpec?.components.find(c => c.id === componentId);
        // ... (lógica de save mais complexa poderia ser adicionada se necessário, mas onUpdate já resolve)
        handleUpdate(localSpecializations);
    }, [localSpecializations, handleUpdate]);


    const handleAddSpecialization = () => {
        const newSpecialization = {
            id: crypto.randomUUID(), name: 'Nova Perícia', isCollapsed: false, mainDice: '1d20',
            components: [], description: '', trained: false, bonusRules: []
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
        const updatedSpecs = (character.specializations || []).map(s => (s.id === id ? { ...s, [field]: value } : s));
        handleUpdate(updatedSpecs);
    }, [character.specializations, handleUpdate]);

    const toggleItemCollapsed = (id) => {
        const updatedSpecs = (character.specializations || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item);
        handleUpdate(updatedSpecs);
    };

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
            ...s, bonusRules: s.bonusRules.map(r => r.id === ruleId ? { ...r, [field]: value } : r)
        } : s));
    };
    
    const handleSaveBonusRuleChange = (specId) => {
         const specToSave = localSpecializations.find(s => s.id === specId);
         const updatedSpecs = (character.specializations || []).map(s => s.id === specId ? specToSave : s);
         handleUpdate(updatedSpecs);
    };
    
    const getAttributeValue = (attrName) => {
        if (!character) return 0;
        if (character.mainAttributes && ['Iniciativa', 'FA', 'FM', 'FD'].includes(attrName)) {
            return character.mainAttributes[attrName.toLowerCase()] || 0;
        }
        const dynamicAttr = (character.attributes || []).find(a => a.name === attrName);
        return dynamicAttr ? (dynamicAttr.base || 0) + (dynamicAttr.perm || 0) + (dynamicAttr.arma || 0) : 0;
    };

    const calculateTotalBonus = (spec) => {
        let total = (spec.components || []).reduce((acc, comp) => {
            if (comp.type === 'number') { return acc + (parseInt(comp.value, 10) || 0); }
            if (comp.type === 'attribute') { return acc + getAttributeValue(comp.value); }
            return acc;
        }, 0);

        (spec.bonusRules || []).forEach(rule => {
            if (!rule.enabled || (rule.condition === 'trained' && !spec.trained)) return;
            let sourceValue = 0;
            if (rule.source === 'level') { sourceValue = character.level || 1; }
            else if (rule.source && rule.source.startsWith('attribute_')) {
                sourceValue = getAttributeValue(rule.source.replace('attribute_', ''));
            }
            const each = parseInt(rule.each, 10) || 1;
            const bonus = parseInt(rule.bonus, 10) || 0;
            if (each > 0) { total += Math.floor(sourceValue / each) * bonus; }
        });
        return total;
    };

    return (
        <SheetSkin title="Perícias" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(localSpecializations || []).map(spec => {
                    const isSpecCollapsed = spec.isCollapsed !== false;
                    const totalBonus = calculateTotalBonus(spec);
                    const rollAction = () => {
                        const rollComponents = [...(spec.components || [])];
                        rollComponents.push({ id: crypto.randomUUID(), type: 'dice', value: spec.mainDice });
                        (spec.bonusRules || []).forEach(rule => {
                            if (!rule.enabled || (rule.condition === 'trained' && !spec.trained)) return;
                            let sourceValue = 0, sourceName = '';
                            if (rule.source === 'level') { sourceValue = character.level || 1; sourceName = 'Nível'; }
                            else if (rule.source && rule.source.startsWith('attribute_')) {
                                const attrName = rule.source.replace('attribute_', '');
                                sourceValue = getAttributeValue(attrName); sourceName = attrName;
                            }
                            const each = parseInt(rule.each, 10) || 1, bonus = parseInt(rule.bonus, 10) || 0;
                            if (each > 0) {
                                const calculatedBonus = Math.floor(sourceValue / each) * bonus;
                                if (calculatedBonus !== 0) {
                                    const conditionLabel = rule.condition === 'trained' ? ' (Treinado)' : '';
                                    rollComponents.push({ id: crypto.randomUUID(), type: 'number', value: calculatedBonus, label: `Bônus ${sourceName}${conditionLabel}` });
                                }
                            }
                        });
                        onExecuteFormula({ ...spec, discordText: spec.description, components: rollComponents });
                    };

                    return isSpecCollapsed ? (
                        <div key={spec.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <MarqueeWhenOverflow 
                                className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow" 
                                onClick={() => toggleItemCollapsed(spec.id)}
                            >
                                {spec.trained && '✅'} {spec.name || 'Perícia Sem Nome'} {totalBonus !== 0 && ` (${totalBonus > 0 ? '+' : ''}${totalBonus})`}
                            </MarqueeWhenOverflow>
                            <button onClick={rollAction} className="px-4 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg whitespace-nowrap ml-2 text-sm">Rolar</button>
                        </div>
                    ) : (
                        <div key={spec.id} className="col-span-1 sm:col-span-2 lg:col-span-3 p-4 bg-bgElement rounded-md shadow-sm border border-bgInput">
                            <div className="flex justify-between items-center gap-2 mb-3">
                                <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow" onClick={() => toggleItemCollapsed(spec.id)}>{spec.name || 'Perícia Sem Nome'}</span>
                                <button onClick={rollAction} className="px-5 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg whitespace-nowrap">Rolar</button>
                                {canEdit && isEditMode && <span className="text-textSecondary text-xs whitespace-nowrap cursor-pointer" onClick={() => toggleItemCollapsed(spec.id)}>Recolher ▲</span>}
                            </div>
                            {canEdit && isEditMode && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-bgInput pt-3 mt-3">
                                <div className="md:col-span-1">
                                    <label className="text-sm font-medium text-textSecondary block mb-1">Nome da Perícia:</label>
                                    <input type="text" placeholder="Nome da Perícia" value={spec.name} onChange={(e) => handleLocalChange(spec.id, 'name', e.target.value)} onBlur={(e) => handleSave(spec.id, 'name', e.target.value)} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary font-semibold mb-3" disabled={!canEdit || !isEditMode} />
                                    <label className="text-sm font-medium text-textSecondary block mb-1">Dado Principal:</label>
                                    <input type="text" placeholder="1d20" value={spec.mainDice} onChange={(e) => handleLocalChange(spec.id, 'mainDice', e.target.value)} onBlur={(e) => handleSave(spec.id, 'mainDice', e.target.value)} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-3" disabled={!canEdit || !isEditMode} />
                                    <div className="flex items-center mb-3">
                                        <input type="checkbox" id={`trained-${spec.id}`} checked={spec.trained} onChange={(e) => handleSave(spec.id, 'trained', e.target.checked)} className="form-checkbox text-green-500 rounded-sm" disabled={!canEdit || !isEditMode} />
                                        <label htmlFor={`trained-${spec.id}`} className="ml-2 text-sm text-textSecondary">Treinado</label>
                                    </div>
                                    <label className="text-sm font-medium text-textSecondary block mb-2">Descrição:</label>
                                    <AutoResizingTextarea placeholder="Descrição..." value={spec.description} onChange={(e) => handleLocalChange(spec.id, 'description', e.target.value)} onBlur={(e) => handleSave(spec.id, 'description', e.target.value)} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-sm mb-3" disabled={!canEdit || !isEditMode} />
                                    {canEdit && isEditMode && <button onClick={() => handleRemoveSpecialization(spec.id)} className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover Perícia</button>}
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-textSecondary block mb-2">Bônus Adicionais:</label>
                                        <div className="space-y-2">
                                            {(spec.components || []).map(comp => (
                                                <div key={comp.id} className="flex items-center gap-2">
                                                    {comp.type === 'attribute' && <select value={comp.value} onChange={(e) => handleLocalComponentChange(spec.id, comp.id, e.target.value)} onBlur={() => handleSaveComponent(spec.id, comp.id)} className="p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary w-full" disabled={!canEdit || !isEditMode}><option disabled value="">Selecione Atributo</option>{allAttributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}</select>}
                                                    {comp.type === 'number' && <input type="number" value={comp.value} onChange={(e) => handleLocalComponentChange(spec.id, comp.id, e.target.value)} onBlur={() => handleSaveComponent(spec.id, comp.id)} className="w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit || !isEditMode} />}
                                                    {canEdit && isEditMode && <button onClick={() => handleRemoveComponent(spec.id, comp.id)} className="w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">-</button>}
                                                </div>
                                            ))}
                                        </div>
                                        {canEdit && isEditMode && <div className="flex gap-2 mt-2"><button onClick={() => handleAddComponent(spec.id, 'attribute')} className="px-2 py-1 text-xs bg-green-600 text-white rounded-md">+ Atributo</button><button onClick={() => handleAddComponent(spec.id, 'number')} className="px-2 py-1 text-xs bg-green-600 text-white rounded-md">+ Número</button></div>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-textSecondary block mb-2">Bônus Condicionais:</label>
                                        <div className="space-y-2 mb-3">
                                            {(spec.bonusRules || []).map(rule => (<div key={rule.id} className="flex items-center gap-2 flex-wrap p-2 rounded-md border border-dashed border-textSecondary/30">
                                                <input type="checkbox" checked={rule.enabled} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'enabled', e.target.checked)} onBlur={() => handleSaveBonusRuleChange(spec.id)} disabled={!canEdit || !isEditMode} />
                                                <span>Se</span>
                                                <select value={rule.condition} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'condition', e.target.value)} onBlur={() => handleSaveBonusRuleChange(spec.id)} className="p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit || !isEditMode}><option value="none">Sempre</option><option value="trained">Treinado</option></select>
                                                <span>, a cada</span>
                                                <input type="number" value={rule.each} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'each', e.target.value)} onBlur={() => handleSaveBonusRuleChange(spec.id)} className="w-16 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit || !isEditMode} />
                                                <select value={rule.source} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'source', e.target.value)} onBlur={() => handleSaveBonusRuleChange(spec.id)} className="p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit || !isEditMode}><option value="level">Nível</option>{allAttributes.map(attr => <option key={attr} value={`attribute_${attr}`}>{attr}</option>)}</select>
                                                <span>, +</span>
                                                <input type="number" value={rule.bonus} onChange={(e) => handleLocalBonusRuleChange(spec.id, rule.id, 'bonus', e.target.value)} onBlur={() => handleSaveBonusRuleChange(spec.id)} className="w-16 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit || !isEditMode} />
                                                {canEdit && isEditMode && <button onClick={() => handleRemoveBonusRule(spec.id, rule.id)} className="w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">-</button>}
                                            </div>))}
                                        </div>
                                        {canEdit && isEditMode && <button onClick={() => handleAddBonusRule(spec.id)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md">+ Regra de Bônus</button>}
                                    </div>
                                </div>
                            </div>}
                        </div>
                    )
                })}
            </div>
            {canEdit && isEditMode && <div className="flex justify-center mt-4"><button onClick={handleAddSpecialization} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">+ Adicionar Perícia</button></div>}
        </SheetSkin>
    );
};

export default SpecializationsList;
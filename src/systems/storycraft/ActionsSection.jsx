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

const ActionsSection = ({
    character, isMaster, isCollapsed, toggleSection, onOpenActionModal, allAttributes, onUpdate, onExecuteFormula, isEditMode
}) => {
    const { user } = useAuth();
    if (!character || !user) return null;
    // A permissão geral de edição ainda é verificada, mas agora combinada com o isEditMode
    const canEdit = user.uid === character.ownerUid || isMaster;

    const [localActions, setLocalActions] = useState(character.formulaActions || []);

    useEffect(() => {
        setLocalActions(character.formulaActions || []);
    }, [character.formulaActions]);

    const handleAddFormulaAction = () => {
        const newAction = {
            id: crypto.randomUUID(), name: 'Nova Ação', components: [{ id: crypto.randomUUID(), type: 'dice', value: '1d6' }],
            multiplier: 1, discordText: '', isCollapsed: false, costValue: 0, costType: '',
            recoverHP: false,
            recoverMP: false,
        };
        onUpdate('formulaActions', [...(character.formulaActions || []), newAction]);
    };

    const handleRemoveFormulaAction = (actionId) => {
        onUpdate('formulaActions', (character.formulaActions || []).filter(a => a.id !== actionId));
    };

    const handleLocalActionChange = (actionId, field, value) => {
        setLocalActions(prevActions => prevActions.map(a =>
            a.id === actionId ? { ...a, [field]: value } : a
        ));
    };

    const handleSaveActionChange = useCallback((actionId, field, valueOverride) => {
        const localAction = localActions.find(a => a.id === actionId);
        const originalAction = (character.formulaActions || []).find(a => a.id === actionId);

        if (localAction && originalAction) {
            const finalValue = valueOverride !== undefined ? valueOverride : localAction[field];

            if (finalValue !== originalAction[field]) {
                onUpdate('formulaActions', (character.formulaActions || []).map(a =>
                    a.id === actionId ? { ...a, [field]: finalValue } : a
                ));
            }
        }
    }, [localActions, character.formulaActions, onUpdate]);

    const handleAddActionComponent = (actionId, type) => {
        let newComponent;
        if (type === 'dice') {
            newComponent = { id: crypto.randomUUID(), type, value: '1d6' };
        } else if (type === 'attribute') {
            newComponent = { id: crypto.randomUUID(), type, value: '' };
        } else if (type === 'critDice') {
            newComponent = { id: crypto.randomUUID(), type, value: '1d6', critValue: 6, critBonusAttribute: '', critBonusMultiplier: 1 };
        }

        onUpdate('formulaActions', (character.formulaActions || []).map(a =>
            a.id === actionId ? { ...a, components: [...(a.components || []), newComponent] } : a
        ));
    };

    const handleRemoveActionComponent = (actionId, componentId) => {
        onUpdate('formulaActions', (character.formulaActions || []).map(a =>
            a.id === actionId ? { ...a, components: (a.components || []).filter(c => c.id !== componentId) } : a
        ));
    };

    const handleLocalComponentChange = (actionId, componentId, field, value) => {
        setLocalActions(prevActions => prevActions.map(a =>
            a.id === actionId ? {
                ...a, components: a.components.map(c =>
                    c.id === componentId ? { ...c, [field]: value } : c
                )
            } : a
        ));
    };

    const handleSaveComponentChange = useCallback((actionId, componentId, field, valueOverride) => {
        const localAction = localActions.find(a => a.id === actionId);
        const localComponent = localAction?.components.find(c => c.id === componentId);
        const originalAction = (character.formulaActions || []).find(a => a.id === actionId);
        const originalComponent = originalAction?.components.find(c => c.id === componentId);

        if (localComponent && originalComponent) {
            const finalValue = valueOverride !== undefined ? valueOverride : localComponent[field];

            if (finalValue !== originalComponent[field]) {
                onUpdate('formulaActions', (character.formulaActions || []).map(a =>
                    a.id === actionId ? {
                        ...a, components: a.components.map(c =>
                            c.id === componentId ? { ...c, [field]: finalValue } : c
                        )
                    } : a
                ));
            }
        }
    }, [localActions, character.formulaActions, onUpdate]);

    const toggleItemCollapsed = (id) => {
        onUpdate('formulaActions', (character.formulaActions || []).map(action =>
            action.id === id ? { ...action, isCollapsed: !action.isCollapsed } : action
        ));
    };

    return (
        <SheetSkin title="Ações" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <>
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-textAccent/80 mb-3">Construtor de Ações Rápidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(localActions || []).map(action => {
                            const isActionCollapsed = action.isCollapsed !== false;
                            return isActionCollapsed ? (
                                <div key={action.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                                    <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(action.id)}>
                                        {action.name || 'Ação Sem Nome'}
                                    </span>
                                    <button onClick={() => onExecuteFormula(action)} className="px-4 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg whitespace-nowrap ml-2 text-sm">Usar</button>
                                </div>
                            ) : (
                                <div key={action.id} className="col-span-1 sm:col-span-2 lg:col-span-3 p-4 bg-bgElement rounded-md shadow-sm border border-bgInput">
                                    <div className="flex justify-between items-center gap-2 mb-3">
                                        <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow" onClick={() => toggleItemCollapsed(action.id)}>
                                            {action.name || 'Ação Sem Nome'}
                                        </span>
                                        <button onClick={() => onExecuteFormula(action)} className="px-5 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg whitespace-nowrap">Usar</button>
                                        {canEdit && isEditMode && (
                                            <span className="text-textSecondary text-xs whitespace-nowrap cursor-pointer" onClick={() => toggleItemCollapsed(action.id)}>Recolher ▲</span>
                                        )}
                                    </div>
                                    {canEdit && isEditMode && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-bgInput pt-3 mt-3 flex-grow">
                                        <div>
                                            <label className="text-sm font-medium text-textSecondary block mb-1">Nome da Ação:</label>
                                            <input
                                                type="text"
                                                placeholder="Nome da Ação"
                                                value={action.name}
                                                onChange={(e) => handleLocalActionChange(action.id, 'name', e.target.value)}
                                                onBlur={() => handleSaveActionChange(action.id, 'name')}
                                                className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary font-semibold mb-3"
                                                disabled={!canEdit || !isEditMode}
                                            />
                                            <label className="text-sm font-medium text-textSecondary block mb-2">Componentes da Fórmula:</label>
                                            <div className="space-y-2 mb-3">
                                                {(action.components || []).map(comp => (
                                                    <div key={comp.id} className="flex flex-col gap-2 p-2 rounded-md border border-dashed border-textSecondary/30">
                                                        {comp.type === 'dice' ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="1d6 ou 10"
                                                                    value={comp.value}
                                                                    onChange={(e) => handleLocalComponentChange(action.id, comp.id, 'value', e.target.value)}
                                                                    onBlur={() => handleSaveComponentChange(action.id, comp.id, 'value')}
                                                                    className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                                                                    disabled={!canEdit || !isEditMode}
                                                                />
                                                                <div className="text-textSecondary flex-shrink-0">Dado/Nº</div>
                                                                {canEdit && isEditMode && (<button onClick={() => handleRemoveActionComponent(action.id, comp.id)} className="w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">-</button>)}
                                                            </div>
                                                        ) : comp.type === 'attribute' ? (
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    value={comp.value}
                                                                    onChange={(e) => handleLocalComponentChange(action.id, comp.id, 'value', e.target.value)}
                                                                    onBlur={() => handleSaveComponentChange(action.id, comp.id, 'value')}
                                                                    className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                                                                    disabled={!canEdit || !isEditMode}
                                                                >
                                                                    <option value="">Selecione Atributo</option>
                                                                    {allAttributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                                                                </select>
                                                                <div className="text-textSecondary flex-shrink-0">Atributo</div>
                                                                {canEdit && isEditMode && (<button onClick={() => handleRemoveActionComponent(action.id, comp.id)} className="w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">-</button>)}
                                                            </div>
                                                        ) : comp.type === 'critDice' ? (
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="1d6"
                                                                        value={comp.value}
                                                                        onChange={(e) => handleLocalComponentChange(action.id, comp.id, 'value', e.target.value)}
                                                                        onBlur={() => handleSaveComponentChange(action.id, comp.id, 'value')}
                                                                        className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                                                                        disabled={!canEdit || !isEditMode}
                                                                    />
                                                                    <div className="text-textSecondary flex-shrink-0">Dado Crítico</div>
                                                                    {canEdit && isEditMode && (<button onClick={() => handleRemoveActionComponent(action.id, comp.id)} className="w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">-</button>)}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-textSecondary">
                                                                    <span className="flex-shrink-0">Crit. ≥</span>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="6"
                                                                        value={comp.critValue || ''}
                                                                        onChange={(e) => handleLocalComponentChange(action.id, comp.id, 'critValue', e.target.value)}
                                                                        onBlur={() => handleSaveComponentChange(action.id, comp.id, 'critValue')}
                                                                        className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                                                                        disabled={!canEdit || !isEditMode}
                                                                    />
                                                                    <span className="flex-shrink-0">Bônus:</span>
                                                                    <select
                                                                        value={comp.critBonusAttribute || ''}
                                                                        onChange={(e) => handleLocalComponentChange(action.id, comp.id, 'critBonusAttribute', e.target.value)}
                                                                        onBlur={() => handleSaveComponentChange(action.id, comp.id, 'critBonusAttribute')}
                                                                        className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                                                                        disabled={!canEdit || !isEditMode}
                                                                    >
                                                                        <option value="">Nenhum</option>
                                                                        {allAttributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                                                                    </select>
                                                                    <span className="flex-shrink-0">x</span>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="1"
                                                                        value={comp.critBonusMultiplier || ''}
                                                                        onChange={(e) => handleLocalComponentChange(action.id, comp.id, 'critBonusMultiplier', e.target.value)}
                                                                        onBlur={() => handleSaveComponentChange(action.id, comp.id, 'critBonusMultiplier')}
                                                                        className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                                                                        disabled={!canEdit || !isEditMode}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                            {canEdit && isEditMode && (
                                                <div className="flex gap-2 flex-wrap">
                                                    <button onClick={() => handleAddActionComponent(action.id, 'dice')} className="px-2 py-1 text-xs bg-btnHighlightBg text-btnHighlightText rounded-md">+ Dado/Nº</button>
                                                    <button onClick={() => handleAddActionComponent(action.id, 'attribute')} className="px-2 py-1 text-xs bg-btnHighlightBg text-btnHighlightText rounded-md">+ Atributo</button>
                                                    <button onClick={() => handleAddActionComponent(action.id, 'critDice')} className="px-2 py-1 text-xs bg-purple-600 text-white rounded-md">+ Dado Crítico</button>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-textSecondary block mb-2">Multiplicador:</label>
                                            <input
                                                type="number"
                                                value={action.multiplier || ''}
                                                onChange={(e) => handleLocalActionChange(action.id, 'multiplier', e.target.value)}
                                                onBlur={() => handleSaveActionChange(action.id, 'multiplier')}
                                                className="w-20 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-3"
                                                placeholder="1"
                                                disabled={!canEdit || !isEditMode}
                                            />
                                            <label className="text-sm font-medium text-textSecondary block mb-2">Descrição da Ação:</label>
                                            <AutoResizingTextarea
                                                placeholder="Descrição..."
                                                value={action.discordText}
                                                onChange={(e) => handleLocalActionChange(action.id, 'discordText', e.target.value)}
                                                onBlur={() => handleSaveActionChange(action.id, 'discordText')}
                                                className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-sm"
                                                disabled={!canEdit || !isEditMode}
                                            />
                                            <label className="text-sm font-medium text-textSecondary block mb-2 mt-3">Custo da Ação:</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Custo"
                                                    value={action.costValue || ''}
                                                    onChange={(e) => handleLocalActionChange(action.id, 'costValue', e.target.value)}
                                                    onBlur={() => handleSaveActionChange(action.id, 'costValue')}
                                                    className="w-20 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                                                    disabled={!canEdit || !isEditMode}
                                                />
                                                <select
                                                    value={action.costType}
                                                    onChange={(e) => handleLocalActionChange(action.id, 'costType', e.target.value)}
                                                    onBlur={() => handleSaveActionChange(action.id, 'costType')}
                                                    className="p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                                                    disabled={!canEdit || !isEditMode}
                                                >
                                                    <option value="">N/A</option>
                                                    <option value="HP">HP</option>
                                                    <option value="MP">MP</option>
                                                </select>
                                            </div>
                                            {canEdit && (
                                                <div className="flex gap-4 mt-4" style={{ display: isEditMode ? 'flex' : 'none' }}>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`recover-hp-${action.id}`}
                                                            checked={action.recoverHP || false}
                                                            onChange={(e) => handleSaveActionChange(action.id, 'recoverHP', e.target.checked)}
                                                            className="form-checkbox text-green-500 rounded-sm"                                                            
                                                            disabled={!canEdit}
                                                        />
                                                        <label htmlFor={`recover-hp-${action.id}`} className="ml-2 text-sm text-textSecondary">Recuperar HP</label>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`recover-mp-${action.id}`}
                                                            checked={action.recoverMP || false}
                                                            onChange={(e) => handleSaveActionChange(action.id, 'recoverMP', e.target.checked)}
                                                            className="form-checkbox text-blue-500 rounded-sm"                                                            
                                                            disabled={!canEdit}
                                                        />
                                                        <label htmlFor={`recover-mp-${action.id}`} className="ml-2 text-sm text-textSecondary">Recuperar MP</label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>}
                                    {canEdit && isEditMode && (
                                        <div className="flex justify-end mt-4 pt-4 border-t border-bgInput/50">
                                            <button 
                                                onClick={() => handleRemoveFormulaAction(action.id)} 
                                                className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                                                title="Remover Ação"
                                            ><span role="img" aria-label="Remover" className="text-xl">🗑️</span></button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {canEdit && isEditMode && (
                        <div className="flex justify-center mt-4">
                            <button onClick={handleAddFormulaAction} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">+ Adicionar Ação Rápida</button>
                        </div>
                    )}
                </div>
            </>
        </SheetSkin>
    );
};

export default ActionsSection;
// src/components/ActionsSection.jsx

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

const ActionsSection = ({ 
    character, isMaster, isCollapsed, toggleSection, onOpenActionModal, allAttributes, onUpdate, onExecuteFormula
}) => {
    const { user } = useAuth();
    if (!character || !user) return null;
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddFormulaAction = () => {
        const newAction = {
          id: crypto.randomUUID(), name: 'Nova Ação', components: [{ id: crypto.randomUUID(), type: 'dice', value: '1d6' }],
          multiplier: 1, discordText: '', isCollapsed: false, costValue: 0, costType: '',
        };
        onUpdate('formulaActions', [...(character.formulaActions || []), newAction]);
    };

    const handleRemoveFormulaAction = (actionId) => {
        onUpdate('formulaActions', (character.formulaActions || []).filter(a => a.id !== actionId));
    };

    const handleFormulaActionChange = (actionId, field, value) => {
        const updatedActions = (character.formulaActions || []).map(a => 
            a.id === actionId 
            ? { ...a, 
                [field]: 
                    field === 'multiplier' 
                    ? (parseInt(value, 10) || 1) 
                    : (field === 'costValue' ? (parseInt(value, 10) || 0) : value) 
              } 
            : a
        );
        onUpdate('formulaActions', updatedActions);
    };

    const handleAddActionComponent = (actionId, type) => {
        const newComponent = { id: crypto.randomUUID(), type, value: type === 'dice' ? '1d6' : '' };
        const updatedActions = (character.formulaActions || []).map(a => 
            a.id === actionId ? { ...a, components: [...(a.components || []), newComponent] } : a
        );
        onUpdate('formulaActions', updatedActions);
    };

    const handleRemoveActionComponent = (actionId, componentId) => {
        const updatedActions = (character.formulaActions || []).map(a => 
            a.id === actionId ? { ...a, components: (a.components || []).filter(c => c.id !== componentId) } : a
        );
        onUpdate('formulaActions', updatedActions);
    };

    const handleActionComponentChange = (actionId, componentId, field, value) => {
        const updatedActions = (character.formulaActions || []).map(a => 
            a.id === actionId 
            ? { ...a, components: (a.components || []).map(c => c.id === componentId ? { ...c, [field]: value } : c) } 
            : a
        );
        onUpdate('formulaActions', updatedActions);
    };

    const toggleItemCollapsed = (id) => {
        onUpdate('formulaActions', (character.formulaActions || []).map(action =>
          action.id === id ? { ...action, isCollapsed: !action.isCollapsed } : action
        ));
    };

  return (
    <section className="mb-8 p-6 bg-bgSurface backdrop-blur-sm rounded-xl shadow-inner border border-bgElement">
      <h2 className="text-2xl font-bold text-textAccent mb-4 border-b-2 border-borderAccent pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
        Ações <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      
      {!isCollapsed && (
        <>
            <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-bgElement">
                <button onClick={() => onOpenActionModal('heal')} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">Curar</button>
                <button onClick={() => onOpenActionModal('damage')} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md">Receber Dano</button>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold text-textAccent/80 mb-3">Construtor de Ações Rápidas</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(character.formulaActions || []).map(action => {
                        const isActionCollapsed = action.isCollapsed !== false;
                        return isActionCollapsed ? (
                            <div key={action.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                                <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(action.id)}>
                                    {action.name || 'Ação Sem Nome'}
                                </span>
                                <button onClick={() => onExecuteFormula(action.id)} className="px-4 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg whitespace-nowrap ml-2 text-sm">Usar</button>
                            </div>
                        ) : (
                            <div key={action.id} className="col-span-1 sm:col-span-2 lg:col-span-3 p-4 bg-bgElement rounded-md shadow-sm border border-bgInput">
                                <div className="flex justify-between items-center gap-2 mb-3">
                                    <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow" onClick={() => toggleItemCollapsed(action.id)}>
                                        {action.name || 'Ação Sem Nome'}
                                    </span>
                                    <button onClick={() => onExecuteFormula(action.id)} className="px-5 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg whitespace-nowrap">Usar</button>
                                    {canEdit && <button onClick={() => handleRemoveFormulaAction(action.id)} className="w-10 h-10 bg-red-600 text-white text-lg rounded-md flex items-center justify-center font-bold">X</button>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-bgInput pt-3 mt-3">
                                    <div>
                                        <label className="text-sm font-medium text-textSecondary block mb-1">Nome da Ação:</label>
                                        <input type="text" placeholder="Nome da Ação" value={action.name} onChange={(e) => handleFormulaActionChange(action.id, 'name', e.target.value)} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary font-semibold mb-3" disabled={!canEdit} />
                                        <label className="text-sm font-medium text-textSecondary block mb-2">Componentes da Fórmula:</label>
                                        <div className="space-y-2 mb-3">
                                            {(action.components || []).map(comp => (
                                                <div key={comp.id} className="flex items-center gap-2">
                                                    {comp.type === 'dice' ? (
                                                        <input type="text" placeholder="1d6 ou 10" value={comp.value} onChange={(e) => handleActionComponentChange(action.id, comp.id, 'value', e.target.value)} className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit} />
                                                    ) : (
                                                        <select value={comp.value} onChange={(e) => handleActionComponentChange(action.id, comp.id, 'value', e.target.value)} className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit}>
                                                            <option value="">Selecione Atributo</option>
                                                            {allAttributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                                                        </select>
                                                    )}
                                                    {canEdit && (<button onClick={() => handleRemoveActionComponent(action.id, comp.id)} className="w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">-</button>)}
                                                </div>
                                            ))}
                                        </div>
                                        {canEdit && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAddActionComponent(action.id, 'dice')} className="px-2 py-1 text-xs bg-btnHighlightBg text-btnHighlightText rounded-md">+ Dado/Nº</button>
                                                <button onClick={() => handleAddActionComponent(action.id, 'attribute')} className="px-2 py-1 text-xs bg-btnHighlightBg text-btnHighlightText rounded-md">+ Atributo</button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-textSecondary block mb-2">Multiplicador:</label>
                                        <input type="number" value={action.multiplier || ''} onChange={(e) => handleFormulaActionChange(action.id, 'multiplier', e.target.value)} className="w-20 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-3" placeholder="1" disabled={!canEdit} />
                                        <label className="text-sm font-medium text-textSecondary block mb-2">Descrição da Ação (Discord):</label>
                                        <AutoResizingTextarea placeholder="Descrição para Discord/Roll20..." value={action.discordText} onChange={(e) => handleFormulaActionChange(action.id, 'discordText', e.target.value)} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-sm" disabled={!canEdit} />
                                        <label className="text-sm font-medium text-textSecondary block mb-2 mt-3">Custo da Ação:</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" placeholder="Custo" value={action.costValue || ''} onChange={(e) => handleFormulaActionChange(action.id, 'costValue', e.target.value)} className="w-20 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit} />
                                            <select value={action.costType} onChange={(e) => handleFormulaActionChange(action.id, 'costType', e.target.value)} className="p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" disabled={!canEdit}>
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
                {canEdit && (
                    <div className="flex justify-center mt-4">
                        <button onClick={handleAddFormulaAction} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">+ Adicionar Ação Rápida</button>
                    </div>
                )}
            </div>
        </>
      )}
    </section>
  );
};

export default ActionsSection;
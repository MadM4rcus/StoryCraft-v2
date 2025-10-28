// src/components/AttributesSection.jsx

import React, { useState, useEffect, useCallback } from 'react';
import SheetSkin from './SheetSkin';

const AttributesSection = ({ character, onUpdate, isCollapsed, toggleSection, buffModifiers, onOpenRollModal, isEditMode }) => {

    // Estado local para a lista de atributos
    const [localAttributes, setLocalAttributes] = useState(character.attributes || []);

    // Sincroniza o estado local com o estado da ficha pai
    useEffect(() => {
        setLocalAttributes(character.attributes || []);
    }, [character.attributes]);

    const handleAddAttribute = () => {
        const newAttribute = { id: crypto.randomUUID(), name: '', base: 0, perm: 0, arma: 0, isCollapsed: false };
        onUpdate('attributes', [...(character.attributes || []), newAttribute]);
    };

    const handleRemoveAttribute = (id) => {
        onUpdate('attributes', (character.attributes || []).filter(attr => attr.id !== id));
    };

    // Lógica para alterar o estado local do atributo
    const handleLocalAttributeChange = (id, field, value) => {
        setLocalAttributes(prevAttrs => prevAttrs.map(attr =>
            attr.id === id ? { ...attr, [field]: value } : attr
        ));
    };

    // Lógica para salvar a alteração no estado pai (chamado no onBlur)
    const handleSaveAttributeChange = useCallback((id, field) => {
        const localAttr = localAttributes.find(attr => attr.id === id);
        const originalAttr = (character.attributes || []).find(attr => attr.id === id);

        if (localAttr && originalAttr && localAttr[field] !== originalAttr[field]) {
            const newAttributes = (character.attributes || []).map(attr =>
                attr.id === id ? {
                    ...attr,
                    [field]: field === 'name' ? localAttr[field] : parseInt(localAttr[field], 10) || 0
                } : attr
            );
            onUpdate('attributes', newAttributes);
        }
    }, [localAttributes, character.attributes, onUpdate]);

    const handleToggleCollapsed = (id) => {
        onUpdate('attributes', (character.attributes || []).map(attr =>
            attr.id === id ? { ...attr, isCollapsed: !attr.isCollapsed } : attr
        ));
    };

    return (
        <SheetSkin title="Atributos" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(localAttributes || []).map((attr) => {
                        const tempValue = buffModifiers[attr.name] || 0;
                        const totalValue = (parseInt(attr.base, 10) || 0) + (parseInt(attr.perm, 10) || 0) + tempValue + (parseInt(attr.arma, 10) || 0);
                        const isAttrCollapsed = attr.isCollapsed !== false;

                        return isAttrCollapsed ? (
                            <div key={attr.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center gap-2 overflow-hidden">
                                <div className="flex-grow overflow-hidden relative group" onClick={() => handleToggleCollapsed(attr.id)}>
                                    <span className="font-semibold text-lg text-textPrimary cursor-pointer whitespace-nowrap group-hover:animate-marquee">
                                        {attr.name || 'Atributo Sem Nome'}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-bold text-btnHighlightBg text-lg">{totalValue >= 0 ? '+' : ''}{totalValue}</span>
                                </div>
                                <button onClick={() => onOpenRollModal(attr.id)} className="px-4 py-1 bg-btnHighlightBg text-btnHighlightText font-bold rounded-lg whitespace-nowrap ml-4 text-sm shadow-md">
                                    Rolar
                                </button>
                            </div>
                        ) : (
                            <div key={attr.id} className="col-span-1 md:col-span-2 p-3 bg-bgElement rounded-md shadow-sm border border-bgInput relative flex flex-col gap-3">
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggleCollapsed(attr.id)}>
                                    <input
                                        type="text"
                                        placeholder="Nome do Atributo"
                                        value={attr.name}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleLocalAttributeChange(attr.id, 'name', e.target.value)}
                                        onBlur={() => handleSaveAttributeChange(attr.id, 'name')}
                                        className="w-full flex-grow p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary font-semibold cursor-text"
                                    />
                                    <span className="text-textSecondary text-xs whitespace-nowrap">Recolher ▲</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 text-xs justify-end w-full" onClick={(e) => e.stopPropagation()}>
                                    {['base', 'perm', 'arma'].map(field => (
                                        <div key={field} className="flex flex-col items-center">
                                            <span className="text-textSecondary text-xs text-center capitalize">{field}</span>
                                            <input
                                                type="number"
                                                value={attr[field] || ''}
                                                onChange={(e) => handleLocalAttributeChange(attr.id, field, e.target.value)}
                                                onBlur={() => handleSaveAttributeChange(attr.id, field)}
                                                className={`w-12 p-1 border rounded-md text-textPrimary text-center bg-bgInput border-bgElement`}
                                            />
                                        </div>
                                    ))}
                                    <div className="flex flex-col items-center">
                                        <span className="text-textSecondary text-xs text-center capitalize">temp</span>
                                        <input type="number" value={tempValue || ''} className={`w-12 p-1 border rounded-md text-textPrimary text-center bg-bgPage border-bgElement cursor-not-allowed`} readOnly />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-textSecondary text-xs text-center">Total</span>
                                        <input type="number" value={totalValue || ''} readOnly className="w-12 p-1 bg-bgPage border border-bgElement rounded-md text-textPrimary font-bold cursor-not-allowed text-center" />
                                    </div>
                                </div>
                                {isEditMode && <div className="flex justify-end pt-2 mt-2 border-t border-bgInput/50" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => handleRemoveAttribute(attr.id)} 
                                        className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                                        title="Remover Atributo"
                                    >
                                        <span role="img" aria-label="Remover">🗑️</span>
                                    </button>
                                </div>}
                            </div>
                        );
                    })}
                </div>
                {isEditMode && <div className="flex justify-center mt-4">
                    <button onClick={handleAddAttribute} className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button>
                </div>}
            </>
        </SheetSkin>
    );
};

export default AttributesSection;
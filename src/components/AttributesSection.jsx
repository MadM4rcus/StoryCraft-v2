// src/components/AttributesSection.jsx

import React from 'react';
import SheetSkin from './SheetSkin';

const AttributesSection = ({ character, onUpdate, isCollapsed, toggleSection, buffModifiers, onOpenRollModal }) => {
  
  const handleAddAttribute = () => {
    const newAttribute = { id: crypto.randomUUID(), name: '', base: 0, perm: 0, arma: 0, isCollapsed: false };
    const newAttributes = [...(character.attributes || []), newAttribute];
    onUpdate('attributes', newAttributes);
  };

  const handleRemoveAttribute = (id) => {
    const newAttributes = (character.attributes || []).filter(attr => attr.id !== id);
    onUpdate('attributes', newAttributes);
  };

  const handleAttributeChange = (id, field, value) => {
    const newAttributes = (character.attributes || []).map(attr => 
      attr.id === id ? { ...attr, [field]: field === 'name' ? value : parseInt(value, 10) || 0 } : attr
    );
    onUpdate('attributes', newAttributes);
  };

  const handleToggleCollapsed = (id) => {
    onUpdate('attributes', (character.attributes || []).map(attr => 
      attr.id === id ? { ...attr, isCollapsed: !attr.isCollapsed } : attr
    ));
  };

  return (
    <SheetSkin title="Atributos" isCollapsed={isCollapsed} toggleSection={toggleSection}>
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(character.attributes || []).map((attr) => {
              const tempValue = buffModifiers[attr.name] || 0;
              const totalValue = (attr.base || 0) + (attr.perm || 0) + tempValue + (attr.arma || 0);
              const isAttrCollapsed = attr.isCollapsed !== false;

              return isAttrCollapsed ? (
                <div key={attr.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                  <span className="font-semibold text-lg text-textPrimary flex-grow cursor-pointer truncate" onClick={() => handleToggleCollapsed(attr.id)}>
                      {attr.name || 'Atributo Sem Nome'} 
                      <span className="ml-2 font-bold text-btnHighlightBg">{totalValue >= 0 ? '+' : ''}{totalValue}</span>
                  </span>
                  <button onClick={() => onOpenRollModal(attr.id)} className="px-4 py-1 bg-btnHighlightBg text-btnHighlightText font-bold rounded-lg whitespace-nowrap ml-4 text-sm shadow-md">
                      Rolar
                  </button>
                </div>
              ) : (
                <div key={attr.id} className="col-span-1 md:col-span-2 p-3 bg-bgElement rounded-md shadow-sm border border-bgInput relative flex flex-col gap-3">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggleCollapsed(attr.id)}>
                    <input type="text" placeholder="Nome do Atributo" value={attr.name} onClick={(e) => e.stopPropagation()} onChange={(e) => handleAttributeChange(attr.id, 'name', e.target.value)} className="w-full flex-grow p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary font-semibold cursor-text" />
                    <span className="text-textSecondary text-xs whitespace-nowrap">Recolher ▲</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs justify-end w-full" onClick={(e) => e.stopPropagation()}>
                    {['base', 'perm', 'arma'].map(field => (
                      <div key={field} className="flex flex-col items-center">
                        <span className="text-textSecondary text-xs text-center capitalize">{field}</span>
                        <input type="number" value={attr[field] || ''} onChange={(e) => handleAttributeChange(attr.id, field, e.target.value)} className={`w-12 p-1 border rounded-md text-textPrimary text-center bg-bgInput border-bgElement`} />
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
                  <div className="flex justify-start pt-2 mt-2 border-t border-bgInput/50" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleRemoveAttribute(attr.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md">Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center mt-4">
            <button onClick={handleAddAttribute} className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button>
          </div>
        </>
    </SheetSkin>
  );
};

export default AttributesSection;
// src/components/PerksSection.jsx

import React, { useRef, useEffect } from 'react';

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

const PerksSection = ({ character, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
  const canEdit = true;

  const handleAddPerk = (type) => {
    const newPerk = { id: crypto.randomUUID(), name: '', description: '', origin: { class: false, race: false, manual: true }, value: 0, isCollapsed: false };
    onUpdate(type, [...(character[type] || []), newPerk]);
  };

  const handleRemovePerk = (type, id) => onUpdate(type, (character[type] || []).filter(p => p.id !== id));
  const handlePerkChange = (type, id, field, value) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, [field]: field === 'value' ? parseInt(value, 10) || 0 : value } : p));
  const handlePerkOriginChange = (type, id, originType) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, origin: { ...p.origin, [originType]: !p.origin[originType] } } : p));
  const toggleItemCollapsed = (type, id) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, isCollapsed: !p.isCollapsed } : p));

  return (
    <section className="mb-8 p-6 bg-bgSurface backdrop-blur-sm rounded-xl shadow-inner border border-bgElement">
      <h2 className="text-2xl font-bold text-textAccent mb-4 border-b-2 border-borderAccent pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
        Vantagens e Desvantagens
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold text-textAccent/80 mb-3 border-b border-borderAccent/50 pb-1">Vantagens</h3>
            <div className="space-y-2">
              {(character.advantages || []).map(perk => (
                <PerkItem key={perk.id} perk={perk} type="advantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkChange} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={onShowDiscord} />
              ))}
              {canEdit && (
                <div className="flex justify-end mt-4">
                  <button onClick={() => handleAddPerk('advantages')} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-textAccent/80 mb-3 border-b border-borderAccent/50 pb-1">Desvantagens</h3>
            <div className="space-y-2">
              {(character.disadvantages || []).map(perk => (
                <PerkItem key={perk.id} perk={perk} type="disadvantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkChange} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={onShowDiscord} />
              ))}
              {canEdit && (
                <div className="flex justify-end mt-4">
                  <button onClick={() => handleAddPerk('disadvantages')} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const PerkItem = ({ perk, type, canEdit, onRemove, onChange, onOriginChange, onToggleCollapse, onShowDiscord }) => (
  <div className="flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
    <div className="flex justify-between items-center mb-1">
      <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => onToggleCollapse(type, perk.id)}>
        {perk.name || 'Sem Nome'} {perk.isCollapsed ? '...' : ''}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <button onClick={() => onShowDiscord(perk.name, perk.description)} title="Mostrar no Discord" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md">Mostrar</button>
        {canEdit && <button onClick={() => onRemove(type, perk.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
      </div>
    </div>
    {!perk.isCollapsed && (
      <>
        <div className="flex items-center gap-2 mb-2">
          <input type="text" value={perk.name} onChange={(e) => onChange(type, perk.id, 'name', e.target.value)} className="font-semibold text-lg flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary" placeholder="Nome" disabled={!canEdit} />
          <input type="number" value={perk.value === 0 ? '' : perk.value} onChange={(e) => onChange(type, perk.id, 'value', e.target.value)} className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-center text-textPrimary" placeholder="Valor" disabled={!canEdit} />
        </div>
        <AutoResizingTextarea 
            value={perk.description} 
            onChange={(e) => onChange(type, perk.id, 'description', e.target.value)} 
            placeholder="Descrição" 
            className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md" 
            disabled={!canEdit} 
        />
        <div className="flex gap-3 text-sm text-textSecondary mt-2">
          {['class', 'race', 'manual'].map(originType => (
            <label key={originType} className="flex items-center gap-1">
              <input type="checkbox" checked={perk.origin?.[originType]} onChange={() => onOriginChange(type, perk.id, originType)} className="form-checkbox text-btnHighlightBg rounded" disabled={!canEdit} /> {originType.charAt(0).toUpperCase() + originType.slice(1)}
            </label>
          ))}
        </div>
      </>
    )}
  </div>
);

export default PerksSection;
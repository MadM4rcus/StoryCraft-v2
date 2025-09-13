import React from 'react';
import { useAuth } from '../hooks/useAuth';

const PerksSection = ({ character, isMaster, onUpdate, isCollapsed, toggleSection }) => {
  const { user } = useAuth();

  // Apenas o dono da ficha ou o mestre podem editar
  const canEdit = user.uid === character.ownerUid || isMaster;

  const handleAddPerk = (type) => {
    const newPerk = { 
      id: crypto.randomUUID(), 
      name: '', 
      description: '', 
      origin: { class: false, race: false, manual: true }, 
      value: 0, 
      isCollapsed: false 
    };
    const newPerks = [...(character[type] || []), newPerk];
    onUpdate(type, newPerks);
  };

  const handleRemovePerk = (type, id) => {
    const newPerks = (character[type] || []).filter(p => p.id !== id);
    onUpdate(type, newPerks);
  };

  const handlePerkChange = (type, id, field, value) => {
    const newPerks = (character[type] || []).map(p => 
      p.id === id ? { ...p, [field]: field === 'value' ? parseInt(value, 10) || 0 : value } : p
    );
    onUpdate(type, newPerks);
  };
  
  const handlePerkOriginChange = (type, id, originType) => {
    const newPerks = (character[type] || []).map(p => 
      p.id === id ? { ...p, origin: { ...p.origin, [originType]: !p.origin[originType] } } : p
    );
    onUpdate(type, newPerks);
  };

  const toggleItemCollapsed = (type, id) => {
    const newPerks = (character[type] || []).map(p =>
      p.id === id ? { ...p, isCollapsed: !p.isCollapsed } : p
    );
    onUpdate(type, newPerks);
  };

  const handleShowOnDiscord = (name, description) => {
    alert(`Mostrar no Discord:\n\nTítulo: ${name}\nDescrição: ${description}`);
  };

  return (
    <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
      <h2 
        className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center"
        onClick={toggleSection}
      >
        Vantagens e Desvantagens
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna de Vantagens */}
          <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-3 border-b border-purple-500 pb-1">Vantagens</h3>
            <div className="space-y-2">
              {(character.advantages || []).map(perk => (
                <PerkItem key={perk.id} perk={perk} type="advantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkChange} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={handleShowOnDiscord} />
              ))}
              {canEdit && (
                <div className="flex justify-end mt-4">
                  <button onClick={() => handleAddPerk('advantages')} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-full shadow-lg">+</button>
                </div>
              )}
            </div>
          </div>
          {/* Coluna de Desvantagens */}
          <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-3 border-b border-purple-500 pb-1">Desvantagens</h3>
            <div className="space-y-2">
              {(character.disadvantages || []).map(perk => (
                <PerkItem key={perk.id} perk={perk} type="disadvantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkChange} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={handleShowOnDiscord} />
              ))}
              {canEdit && (
                <div className="flex justify-end mt-4">
                  <button onClick={() => handleAddPerk('disadvantages')} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-full shadow-lg">+</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Sub-componente para cada Vantagem/Desvantagem
const PerkItem = ({ perk, type, canEdit, onRemove, onChange, onOriginChange, onToggleCollapse, onShowDiscord }) => (
  <div className="flex flex-col p-3 bg-gray-600 rounded-md shadow-sm">
    <div className="flex justify-between items-center mb-1">
      <span className="font-semibold text-lg w-full cursor-pointer text-white" onClick={() => onToggleCollapse(type, perk.id)}>
        {perk.name || 'Sem Nome'} {perk.isCollapsed ? '...' : ''}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <button onClick={() => onShowDiscord(perk.name, perk.description)} title="Mostrar no Discord" className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-md">Mostrar</button>
        {canEdit && <button onClick={() => onRemove(type, perk.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md">Remover</button>}
      </div>
    </div>
    {!perk.isCollapsed && (
      <>
        <div className="flex items-center gap-2 mb-2">
          <input type="text" value={perk.name} onChange={(e) => onChange(type, perk.id, 'name', e.target.value)} className="font-semibold text-lg flex-grow p-1 bg-gray-700 border border-gray-500 rounded-md text-white" placeholder="Nome" disabled={!canEdit} />
          <input type="number" value={perk.value === 0 ? '' : perk.value} onChange={(e) => onChange(type, perk.id, 'value', e.target.value)} className="w-12 p-1 bg-gray-700 border border-gray-500 rounded-md text-center text-white" placeholder="Valor" disabled={!canEdit} />
        </div>
        <textarea value={perk.description} onChange={(e) => onChange(type, perk.id, 'description', e.target.value)} placeholder="Descrição" className="text-sm text-gray-300 italic w-full p-1 bg-gray-700 border border-gray-500 rounded-md text-white resize-none" rows="2" disabled={!canEdit} />
        <div className="flex gap-3 text-sm text-gray-400 mt-2">
          {['class', 'race', 'manual'].map(originType => (
            <label key={originType} className="flex items-center gap-1">
              <input type="checkbox" checked={perk.origin?.[originType]} onChange={() => onOriginChange(type, perk.id, originType)} className="form-checkbox text-purple-500 rounded" disabled={!canEdit} /> {originType.charAt(0).toUpperCase() + originType.slice(1)}
            </label>
          ))}
        </div>
      </>
    )}
  </div>
);

export default PerksSection;
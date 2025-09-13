import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

const MainAttributesSection = ({ character, onUpdate, isMaster, isCollapsed, toggleSection }) => {
  const { user } = useAuth();
  
  const dexterityValue = useMemo(() => 0, []); // Placeholder
  const initiativeTotal = dexterityValue + (character.mainAttributes.initiative || 0);
  
  const handleMainAttributeChange = (e, attributeKey) => {
    const { name, value } = e.target;
    onUpdate('mainAttributes', { ...character.mainAttributes, [attributeKey]: { ...character.mainAttributes[attributeKey], [name]: parseInt(value, 10) || 0 } });
  };

  const handleSingleAttributeChange = (e) => {
    const { name, value } = e.target;
    onUpdate('mainAttributes', { ...character.mainAttributes, [name]: parseInt(value, 10) || 0 });
  };
  
  // Calcula os totais como no V1
  const calculateTotal = (base, modifierKey) => {
    const modifier = 0; // Placeholder para os modificadores de buffs
    return (base || 0) + modifier;
  };

  return (
    <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
      <h2 className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
        Atributos Principais
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-2 bg-gray-600 rounded-md">
            <label className="text-lg font-medium text-gray-300 mb-1 uppercase">HP</label>
            <div className="flex items-center gap-1">
              <input type="number" name="current" value={character.mainAttributes.hp.current || ''} onChange={(e) => handleMainAttributeChange(e, 'hp')} className="w-14 p-2 text-center bg-gray-700 border border-gray-500 rounded-md text-white text-xl font-bold" disabled={!isMaster} />
              <span className="text-gray-300">/</span>
              <input type="number" name="max" value={character.mainAttributes.hp.max || ''} onChange={(e) => handleMainAttributeChange(e, 'hp')} className="w-14 p-2 text-center bg-gray-700 border border-gray-500 rounded-md text-white text-xl font-bold" disabled={!isMaster} />
              <span className="text-blue-400 font-bold text-xl ml-1">+</span>
              <input type="number" title="HP Temporário" name="temp" value={character.mainAttributes.hp.temp || ''} onChange={(e) => handleMainAttributeChange(e, 'hp')} className="w-14 p-2 text-center bg-gray-700 border border-blue-400 rounded-md text-blue-300 text-xl font-bold" disabled={!isMaster} />
            </div>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-600 rounded-md">
            <label className="text-lg font-medium text-gray-300 mb-1 uppercase">MP</label>
            <div className="flex items-center gap-2">
              <input type="number" name="current" value={character.mainAttributes.mp.current || ''} onChange={(e) => handleMainAttributeChange(e, 'mp')} className="w-14 p-2 text-center bg-gray-700 border border-gray-500 rounded-md text-white text-xl font-bold" disabled={!isMaster} />
              <span className="text-gray-300">/</span>
              <input type="number" name="max" value={character.mainAttributes.mp.max || ''} onChange={(e) => handleMainAttributeChange(e, 'mp')} className="w-14 p-2 text-center bg-gray-700 border border-gray-500 rounded-md text-white text-xl font-bold" disabled={!isMaster} />
            </div>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-600 rounded-md">
            <label className="capitalize text-lg font-medium text-gray-300 mb-1">Iniciativa:</label>
            <div className="flex items-center gap-2">
              <span title="Valor da Destreza" className="w-14 p-2 text-center bg-gray-800 border border-gray-600 rounded-md text-white text-xl font-bold">{dexterityValue}</span>
              <span className="text-gray-300">=</span>
              <span className="w-14 p-2 text-center bg-gray-800 border border-gray-600 rounded-md text-white text-xl font-bold">{initiativeTotal}</span>
            </div>
          </div>
          {['fa', 'fm', 'fd'].map(key => {
            const baseValue = character.mainAttributes[key] || 0;
            const total = calculateTotal(baseValue, key.toUpperCase());
            return (
              <div key={key} className="flex flex-col items-center p-2 bg-gray-600 rounded-md">
                <label htmlFor={key} className="capitalize text-lg font-medium text-gray-300 mb-1">{key.toUpperCase()}:</label>
                <div className="flex items-center gap-2">
                  <input type="number" id={key} name={key} value={baseValue || ''} onChange={handleSingleAttributeChange} className="w-14 p-2 text-center bg-gray-700 border border-gray-500 rounded-md text-white text-xl font-bold" disabled={user.uid !== character.ownerUid && !isMaster} />
                  <span className="text-gray-300">=</span>
                  <span className="w-14 p-2 text-center bg-gray-800 border border-gray-600 rounded-md text-white text-xl font-bold">{total}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MainAttributesSection;
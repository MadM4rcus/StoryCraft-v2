// src/components/MainAttributesSection.jsx

import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

const MainAttributesSection = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, buffModifiers }) => {
  const { user } = useAuth();
  const canEditGeneral = user.uid === character.ownerUid || isMaster;

  const dexterityValue = useMemo(() => {
    const searchTerms = ['dex', 'des', 'agi'];
    const dexterityAttr = (character.attributes || []).find(attr => {
        if (!attr.name) return false;
        return searchTerms.some(term => attr.name.toLowerCase().includes(term));
    });
    if (!dexterityAttr) return 0;
    const tempValue = buffModifiers[dexterityAttr.name] || 0;
    return (dexterityAttr.base || 0) + (dexterityAttr.perm || 0) + tempValue + (dexterityAttr.arma || 0);
  }, [character.attributes, buffModifiers]);

  const initiativeTotal = dexterityValue + (buffModifiers['Iniciativa'] || 0);
  const handleMainAttributeChange = (e, attributeKey) => onUpdate('mainAttributes', { ...character.mainAttributes, [attributeKey]: { ...character.mainAttributes[attributeKey], [e.target.name]: parseInt(e.target.value, 10) || 0 } });
  const handleSingleAttributeChange = (e) => onUpdate('mainAttributes', { ...character.mainAttributes, [e.target.name]: parseInt(e.target.value, 10) || 0 });
  const calculateTotal = (base, key) => (base || 0) + (buffModifiers[key] || 0);

  return (
    <section className="mb-8 p-6 bg-bgSurface backdrop-blur-sm rounded-xl shadow-inner border border-bgElement">
      <h2 className="text-2xl font-bold text-textAccent mb-4 border-b-2 border-borderAccent pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
        Atributos Principais
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Bloco de HP */}
          <div className="flex flex-col items-center p-2 bg-bgElement rounded-md">
            <label className="text-lg font-medium text-textSecondary mb-1 uppercase">HP</label>
            <div className="flex items-center gap-1">
              <input type="number" name="current" value={character.mainAttributes?.hp?.current || ''} onChange={(e) => handleMainAttributeChange(e, 'hp')} className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!isMaster} />
              <span className="text-textSecondary">/</span>
              <input type="number" name="max" value={character.mainAttributes?.hp?.max || ''} onChange={(e) => handleMainAttributeChange(e, 'hp')} className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!isMaster} />
              <span className="text-blue-400 font-bold text-xl ml-1">+</span>
              <input type="number" title="HP Temporário" name="temp" value={character.mainAttributes?.hp?.temp || ''} onChange={(e) => handleMainAttributeChange(e, 'hp')} className="w-14 p-2 text-center bg-bgInput border border-blue-400 rounded-md text-blue-300 text-xl font-bold" disabled={!isMaster} />
            </div>
          </div>
          {/* Bloco de MP */}
          <div className="flex flex-col items-center p-2 bg-bgElement rounded-md">
            <label className="text-lg font-medium text-textSecondary mb-1 uppercase">MP</label>
            <div className="flex items-center gap-2">
              <input type="number" name="current" value={character.mainAttributes?.mp?.current || ''} onChange={(e) => handleMainAttributeChange(e, 'mp')} className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!isMaster} />
              <span className="text-textSecondary">/</span>
              <input type="number" name="max" value={character.mainAttributes?.mp?.max || ''} onChange={(e) => handleMainAttributeChange(e, 'mp')} className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!isMaster} />
            </div>
          </div>
          {/* Outros blocos */}
          {['Iniciativa', 'fa', 'fm', 'fd'].map(key => {
            const isInitiative = key === 'Iniciativa';
            const baseValue = isInitiative ? dexterityValue : (character.mainAttributes?.[key] || 0);
            const total = isInitiative ? initiativeTotal : calculateTotal(character.mainAttributes?.[key] || 0, key.toUpperCase());
            return (
              <div key={key} className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                <label htmlFor={key} className="capitalize text-lg font-medium text-textSecondary mb-1">{key.toUpperCase()}:</label>
                <div className="flex items-center gap-2">
                  <input type="number" id={key} name={key} value={baseValue || ''} onChange={handleSingleAttributeChange} className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!canEditGeneral || isInitiative} />
                  <span className="text-textSecondary">=</span>
                  <span className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold">{total}</span>
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
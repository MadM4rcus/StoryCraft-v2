// src/components/CorePanels.jsx

import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import SheetSkin from './SheetSkin';

// --- Sub-componente: CharacterInfo ---
const CharacterInfo = ({ character, onUpdate, isMaster, isCollapsed, toggleSection }) => {
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumeric = ['age', 'level', 'xp'].includes(name);
    onUpdate(name, isNumeric ? parseInt(value, 10) || 0 : value);
  };

  const handlePhotoClick = () => {
    const newUrl = prompt("Insira a URL da imagem do personagem:", character.photoUrl || "");
    if (newUrl !== null) {
      onUpdate('photoUrl', newUrl);
    }
  };

  const fieldOrder = ['name', 'age', 'height', 'gender', 'race', 'class', 'alignment', 'level', 'xp'];

  return (
    <SheetSkin title="Informações do Personagem" isCollapsed={isCollapsed} toggleSection={toggleSection}>
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="flex-shrink-0">
          {character.photoUrl ? (
            <img src={character.photoUrl} alt="Foto" className="w-48 h-48 object-cover rounded-full border-2 border-btnHighlightBg cursor-pointer" onClick={handlePhotoClick} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/192x192/1f2937/FFFFFF?text=Erro'; }} />
          ) : (
            <div className="w-48 h-48 bg-bgElement rounded-full border-2 border-btnHighlightBg flex items-center justify-center text-6xl text-textSecondary cursor-pointer" onClick={handlePhotoClick}>+</div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow w-full">
          {fieldOrder.map(field => (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-textSecondary mb-1 capitalize">{field}:</label>
              <input
                type={['age', 'level', 'xp'].includes(field) ? 'number' : 'text'}
                id={field} name={field} value={character[field] || ''} onChange={handleChange}
                className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary focus:ring-btnHighlightBg focus:border-btnHighlightBg"
                disabled={!user || (user.uid !== character.ownerUid && !isMaster)}
              />
            </div>
          ))}
        </div>
      </div>
    </SheetSkin>
  );
};


// --- Sub-componente: MainAttributes ---
const MainAttributes = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, buffModifiers }) => {
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
      <SheetSkin title="Atributos Principais" isCollapsed={isCollapsed} toggleSection={toggleSection}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="flex flex-col items-center p-2 bg-bgElement rounded-md">
            <label className="text-lg font-medium text-textSecondary mb-1 uppercase">MP</label>
            <div className="flex items-center gap-2">
              <input type="number" name="current" value={character.mainAttributes?.mp?.current || ''} onChange={(e) => handleMainAttributeChange(e, 'mp')} className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!isMaster} />
              <span className="text-textSecondary">/</span>
              <input type="number" name="max" value={character.mainAttributes?.mp?.max || ''} onChange={(e) => handleMainAttributeChange(e, 'mp')} className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!isMaster} />
            </div>
          </div>
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
      </SheetSkin>
    );
};


// --- Sub-componente: Wallet ---
const Wallet = ({ character, isMaster, onUpdate, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const [zeniAmount, setZeniAmount] = useState(0);
  
    const currentZeni = character.wallet?.zeni || 0;
    const currentInspiration = character.wallet?.inspiration || 0;
    const canEdit = user.uid === character.ownerUid || isMaster;
  
    const handleUpdateWallet = (field, newValue) => {
      const newWallet = { ...character.wallet, [field]: Math.max(0, newValue) };
      onUpdate('wallet', newWallet);
    };
  
    const handleAddZeni = () => { handleUpdateWallet('zeni', currentZeni + zeniAmount); setZeniAmount(0); };
    const handleRemoveZeni = () => { handleUpdateWallet('zeni', currentZeni - zeniAmount); setZeniAmount(0); };
    const handleAddInspiration = () => handleUpdateWallet('inspiration', currentInspiration + 1);
    const handleRemoveInspiration = () => handleUpdateWallet('inspiration', currentInspiration - 1);

    const walletTitle = (
        <div className="flex justify-between items-center w-full">
             <span>Zeni: {currentZeni}</span>
             <span className="text-textPrimary text-base mr-2">Inspiração: {currentInspiration}</span>
        </div>
    );
  
    return (
      <SheetSkin title={walletTitle} isCollapsed={isCollapsed} toggleSection={toggleSection}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline font-semibold text-textSecondary">Zeni:</span>
            <input type="number" value={zeniAmount === 0 ? '' : zeniAmount} onChange={(e) => setZeniAmount(parseInt(e.target.value, 10) || 0)} className="w-20 p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-lg" placeholder="Valor" disabled={!canEdit} />
            <button onClick={handleAddZeni} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>Adicionar</button>
            <button onClick={handleRemoveZeni} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>Remover</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline font-semibold text-textSecondary">Inspiração:</span>
            <button onClick={handleAddInspiration} className="px-3 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg text-sm" disabled={!canEdit}>+1</button>
            <button onClick={handleRemoveInspiration} className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>-1</button>
          </div>
        </div>
      </SheetSkin>
    );
};


// --- Sub-componente: DiscordIntegration ---
const DiscordIntegration = ({ character, onUpdate, isMaster, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleChange = (e) => {
        onUpdate('discordWebhookUrl', e.target.value);
    };

    return (
        <SheetSkin title="Integração com Discord" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div>
                <label htmlFor="discordWebhookUrl" className="block text-sm font-medium text-textSecondary mb-1">URL do Webhook do Canal:</label>
                <input
                    type="text"
                    id="discordWebhookUrl"
                    name="discordWebhookUrl"
                    value={character.discordWebhookUrl || ''}
                    onChange={handleChange}
                    className="w-full p-2 bg-bgInput border border-bgElement rounded-md focus:ring-btnHighlightBg focus:border-btnHighlightBg text-textPrimary"
                    placeholder="Cole a URL do Webhook do seu canal do Discord aqui"
                    disabled={!canEdit}
                />
                <p className="text-xs text-textSecondary mt-2">
                    Com a URL do Webhook configurada, os comandos de rolagem serão enviados diretamente para o seu canal do Discord.
                </p>
            </div>
        </SheetSkin>
    );
};


// Exporta cada componente individualmente para que o CharacterSheet possa controlá-los
export { CharacterInfo, MainAttributes, Wallet, DiscordIntegration };
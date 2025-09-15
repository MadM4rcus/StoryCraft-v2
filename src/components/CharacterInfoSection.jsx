// src/components/CharacterInfoSection.jsx

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import SheetSkin from './SheetSkin';

const CharacterInfoSection = ({ character, onUpdate, isMaster, isCollapsed, toggleSection }) => {
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

export default CharacterInfoSection;
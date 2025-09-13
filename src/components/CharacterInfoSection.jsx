import React from 'react';
import { useAuth } from '../hooks/useAuth';

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

  // Ordem dos campos como no seu V1
  const fieldOrder = ['name', 'age', 'height', 'gender', 'race', 'class', 'alignment', 'level', 'xp'];

  return (
    <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
      <h2 className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
        Informações do Personagem
        <span>{isCollapsed ? '▼' : '▲'}</span>
      </h2>
      
      {!isCollapsed && (
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-shrink-0">
            {character.photoUrl ? (
              <img src={character.photoUrl} alt="Foto" className="w-48 h-48 object-cover rounded-full border-2 border-purple-500 cursor-pointer" onClick={handlePhotoClick} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/192x192/1f2937/FFFFFF?text=Erro'; }} />
            ) : (
              <div className="w-48 h-48 bg-gray-600 rounded-full border-2 border-purple-500 flex items-center justify-center text-6xl text-gray-400 cursor-pointer" onClick={handlePhotoClick}>+</div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow w-full">
            {fieldOrder.map(field => (
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium text-gray-300 mb-1 capitalize">{field}:</label>
                <input
                  type={['age', 'level', 'xp'].includes(field) ? 'number' : 'text'}
                  id={field} name={field} value={character[field] || ''} onChange={handleChange}
                  className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
                  // Desativa o campo se o utilizador não for o dono NEM um mestre
                  disabled={user.uid !== character.ownerUid && !isMaster}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default CharacterInfoSection;
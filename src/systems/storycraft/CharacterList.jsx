// src/components/CharacterList.jsx

import React, { useState } from 'react';

const FlagManager = ({ char, onToggleFlag, isSpoilerMode, allCustomFlags }) => {
  const [newFlag, setNewFlag] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAddFlag = (flagToAdd) => {
    const flag = (flagToAdd || newFlag).trim();
    if (flag && !char.flags?.[flag]) {
      onToggleFlag(char, flag, true);
    }
    setNewFlag('');
    setIsDropdownOpen(false);
  };

  const charFlags = char.flags ? Object.keys(char.flags).filter(f => f !== 'spoiler') : [];

  return (
    <div className="mt-3 pt-3 border-t border-bgInput">
      <div className="flex flex-wrap items-center gap-2">
        {/* Botão da flag Spoiler */}
        <button
          // CORREÇÃO: O terceiro parâmetro (isAdding) deve ser `true` se a flag não existir, e `false` se ela existir.
          onClick={() => onToggleFlag(char, 'spoiler', !char.flags?.spoiler)}
          className={`px-2 py-1 text-xs font-bold rounded-full transition-colors ${char.flags?.spoiler ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
          title={char.flags?.spoiler ? 'Remover flag de Spoiler' : 'Adicionar flag de Spoiler'}
        >
          {isSpoilerMode ? '🙈 Spoiler' : '🐵 Spoiler'}
        </button>

        {/* Flags customizadas existentes */}
        {charFlags.map(flag => (
          <div key={flag} className="flex items-center bg-blue-900/50 text-blue-200 text-xs font-semibold px-2 py-1 rounded-full">
            <span>{flag}</span>
            <button onClick={() => onToggleFlag(char, flag, false)} className="ml-1.5 text-blue-300 hover:text-white font-bold">
              &times;
            </button>
          </div>
        ))}

        {/* Dropdown/Input para nova flag */}
        <div className="relative">
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full">
            +
          </button>
          {isDropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 bg-bgSurface border border-bgElement rounded-lg shadow-lg p-2 w-48 z-10">
              <div className="flex items-center gap-1 mb-2">
                <input
                  type="text"
                  value={newFlag}
                  onChange={(e) => setNewFlag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFlag()}
                  className="p-1 text-xs bg-bgInput border border-bgElement rounded-md text-textPrimary w-full"
                  placeholder="Nova flag..."
                  autoFocus
                />
                <button onClick={() => handleAddFlag()} className="px-2 py-1 text-xs bg-green-600 text-white rounded-md">Add</button>
              </div>
              <ul className="max-h-32 overflow-y-auto">
                {allCustomFlags.filter(f => !charFlags.includes(f)).map(flag => (
                  <li key={flag}>
                    <button
                      onClick={() => handleAddFlag(flag)}
                      className="w-full text-left px-2 py-1 text-xs text-textSecondary hover:bg-bgElement rounded"
                    >
                      {flag}
                    </button>
                  </li>
                ))}
                {allCustomFlags.filter(f => !charFlags.includes(f)).length === 0 && !newFlag && (
                  <li className="px-2 py-1 text-xs text-textSecondary italic">Nenhuma outra flag criada.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const CharacterList = ({ user, onSelectCharacter, handleCreateClick, handleImportClick, handleDeleteClick, characters, isMaster, viewingAll, onToggleView, onExportClick, onToggleFlag, isSpoilerMode, allCustomFlags }) => {
  return (
    <div className="bg-bgSurface/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-bgElement w-full">
      <h2 className="text-2xl font-bold text-textAccent mb-4 border-b-2 border-borderAccent pb-2">
        {viewingAll ? 'Todas as Fichas' : 'Meus Personagens'}
      </h2>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <button onClick={handleCreateClick} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">
          Criar Novo Personagem
        </button>
        <button onClick={handleImportClick} className="px-6 py-3 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg shadow-md">
          Importar Ficha (JSON)
        </button>
        {isMaster && (
          <button onClick={() => onToggleView(!viewingAll)} className="px-6 py-3 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg shadow-md">
            {viewingAll ? 'Ver Apenas Minhas Fichas' : 'Ver Todas as Fichas'}
          </button>
        )}
      </div>

      {characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => (
            <div key={char.id} className={`bg-bgElement p-4 rounded-lg shadow-md flex flex-col justify-between transition-all duration-300 ${isMaster && !isSpoilerMode && char.flags?.spoiler ? 'border-2 border-purple-600' : ''}`}>
              <div>
                <h3 className={`text-xl font-bold text-textPrimary mb-1 ${isMaster && !isSpoilerMode && char.flags?.spoiler ? 'blur-sm' : ''}`}>{char.name}</h3>
                <p className="text-sm text-textSecondary">Nível: {char.level || '1'}</p>
                {isMaster && viewingAll && (
                    <p className="text-xs text-textSecondary mt-2 break-all">Dono: {char.ownerUid}</p>
                )}

                {/* Gerenciador de Flags (só para o Mestre) */}
                {isMaster && (
                  <FlagManager char={char} onToggleFlag={onToggleFlag} isSpoilerMode={isSpoilerMode} allCustomFlags={allCustomFlags} />
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => onSelectCharacter(char)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">
                  Ver/Editar
                </button>
                <button onClick={() => onExportClick(char)} className="px-4 py-2 bg-bgElement hover:bg-opacity-80 text-textPrimary text-sm font-bold rounded-lg">
                  Exportar JSON
                </button>
                {(user && (user.uid === char.ownerUid || isMaster)) && (
                    <button onClick={() => handleDeleteClick(char)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg">
                      Excluir
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-textSecondary italic">Nenhum personagem encontrado.</p>
      )}
    </div>
  );
};

export default CharacterList;
import React from 'react';

const CharacterList = ({ user, onSelectCharacter, handleCreateClick, handleImportClick, handleDeleteClick, characters, isMaster, viewingAll, onToggleView }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 w-full">
      <h2 className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2">
        {viewingAll ? 'Todas as Fichas' : 'Meus Personagens'}
      </h2>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <button onClick={handleCreateClick} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">
          Criar Novo Personagem
        </button>
        <button onClick={handleImportClick} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md">
          Importar Ficha (JSON)
        </button>
        {isMaster && (
          <button onClick={() => onToggleView(!viewingAll)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md">
            {viewingAll ? 'Ver Apenas Minhas Fichas' : 'Ver Todas as Fichas'}
          </button>
        )}
      </div>

      {characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => (
            <div key={char.id} className="bg-gray-600 p-4 rounded-lg shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{char.name}</h3>
                <p className="text-sm text-gray-300">Nível: {char.level || '1'}</p>
                {isMaster && viewingAll && (
                    <p className="text-xs text-gray-400 mt-2 break-all">Dono: {char.ownerUid}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => onSelectCharacter(char)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg">
                  Ver/Editar
                </button>
                {/* Lógica de permissão corrigida */}
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
        <p className="text-gray-400 italic">Nenhum personagem encontrado.</p>
      )}
    </div>
  );
};

export default CharacterList;
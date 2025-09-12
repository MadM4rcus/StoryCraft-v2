import React from 'react';

const CharacterInfoSection = ({ character, onUpdate }) => {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Converte para número se for um campo numérico
    const isNumeric = ['age', 'level', 'xp'].includes(name);
    onUpdate(name, isNumeric ? parseInt(value, 10) || 0 : value);
  };

  return (
    <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
      <h2 className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2">
        Informações do Personagem
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Mapeia os campos para criar os inputs */}
        {['name', 'race', 'class', 'level', 'xp', 'age', 'height', 'gender', 'alignment'].map(field => (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium text-gray-300 mb-1 capitalize">
              {field}:
            </label>
            <input
              type={['age', 'level', 'xp'].includes(field) ? 'number' : 'text'}
              id={field}
              name={field}
              value={character[field] || ''}
              onChange={handleChange}
              className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default CharacterInfoSection;
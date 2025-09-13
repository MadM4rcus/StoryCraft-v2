import React from 'react';
import { useAuth } from '../hooks/useAuth';

const SpecializationsSection = ({ character, isMaster, onUpdate, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;

    const handleAddSpecialization = () => {
        const newSpec = { id: crypto.randomUUID(), name: '', modifier: 0, bonus: 0 };
        onUpdate('specializations', [...(character.specializations || []), newSpec]);
    };

    const handleRemoveSpecialization = (id) => {
        onUpdate('specializations', (character.specializations || []).filter(s => s.id !== id));
    };

    const handleSpecializationChange = (id, field, value) => {
        onUpdate('specializations', (character.specializations || []).map(s => (s.id === id ? { ...s, [field]: field === 'name' ? value : parseInt(value, 10) || 0 } : s)));
    };

    return (
        <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
            <h2 
                className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center"
                onClick={toggleSection}
            >
                Perícias
                <span>{isCollapsed ? '▼' : '▲'}</span>
            </h2>
            {!isCollapsed && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(character.specializations || []).map(spec => (
                            <div key={spec.id} className="p-3 bg-gray-600 rounded-md shadow-sm">
                                <div className="flex justify-between items-center">
                                    <input 
                                        type="text" 
                                        value={spec.name} 
                                        onChange={(e) => handleSpecializationChange(spec.id, 'name', e.target.value)} 
                                        className="font-semibold text-lg flex-grow p-1 bg-gray-700 border border-gray-500 rounded-md text-white" 
                                        placeholder="Nome da Perícia" 
                                        disabled={!canEdit} 
                                    />
                                    {canEdit && (
                                        <button 
                                            onClick={() => handleRemoveSpecialization(spec.id)} 
                                            className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md"
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-4 text-sm mt-2 text-white">
                                    <label className="flex items-center gap-1">
                                        Mod: 
                                        <input 
                                            type="number" 
                                            value={spec.modifier === 0 ? '' : spec.modifier} 
                                            onChange={(e) => handleSpecializationChange(spec.id, 'modifier', e.target.value)} 
                                            className="w-12 p-1 bg-gray-700 border border-gray-500 rounded-md text-white text-center" 
                                            disabled={!canEdit} 
                                        />
                                    </label>
                                    <label className="flex items-center gap-1">
                                        Bônus: 
                                        <input 
                                            type="number" 
                                            value={spec.bonus === 0 ? '' : spec.bonus} 
                                            onChange={(e) => handleSpecializationChange(spec.id, 'bonus', e.target.value)} 
                                            className="w-12 p-1 bg-gray-700 border border-gray-500 rounded-md text-white text-center" 
                                            disabled={!canEdit} 
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                    {canEdit && (
                        <div className="flex justify-end mt-4">
                            <button 
                                onClick={handleAddSpecialization} 
                                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-full shadow-lg"
                            >
                                +
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default SpecializationsSection;
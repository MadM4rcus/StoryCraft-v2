// src/components/RollAttributeModal.jsx

import React, { useState } from 'react';

const RollAttributeModal = ({ attributeName, onConfirm, onClose }) => {
    const [dice, setDice] = useState('1d20');
    const [bonus, setBonus] = useState('');

    const handleConfirm = () => onConfirm(dice, parseInt(bonus, 10) || 0);
    const handleKeyDown = (e) => { if (e.key === 'Enter') handleConfirm(); };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-bgSurface rounded-lg shadow-xl p-6 w-full max-w-sm border border-bgElement">
                <h3 className="text-xl text-textAccent font-bold mb-4 text-center">Rolar {attributeName}</h3>
                <div className="mb-4">
                    <label htmlFor="dice-input" className="block text-sm font-medium text-textSecondary mb-1">Dado:</label>
                    <input
                        id="dice-input"
                        type="text"
                        value={dice}
                        onChange={(e) => setDice(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-lg focus:ring-btnHighlightBg focus:border-btnHighlightBg"
                        placeholder="Ex: 1d20, 2d6"
                        autoFocus
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="bonus-input" className="block text-sm font-medium text-textSecondary mb-1">Bónus Adicional:</label>
                    <input
                        id="bonus-input"
                        type="number"
                        value={bonus}
                        onChange={(e) => setBonus(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-lg focus:ring-btnHighlightBg focus:border-btnHighlightBg"
                        placeholder="0"
                    />
                </div>
                <div className="flex justify-around gap-4">
                    <button onClick={handleConfirm} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">Confirmar</button>
                    <button onClick={onClose} className="px-5 py-2 bg-bgElement hover:opacity-80 text-textPrimary font-bold rounded-lg shadow-md">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default RollAttributeModal;
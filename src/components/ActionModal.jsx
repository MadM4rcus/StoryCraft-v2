// src/components/ActionModal.jsx

import React, { useState } from 'react';

const ActionModal = ({ title, onConfirm, onClose, type }) => {
    const [amount, setAmount] = useState('');
    const [target, setTarget] = useState('HP');

    const handleConfirm = () => {
        const numericAmount = parseInt(amount, 10);
        if (!isNaN(numericAmount) && numericAmount > 0) {
            onConfirm(numericAmount, target);
            onClose();
        } else {
            console.error('Valor inválido inserido.');
        }
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleConfirm();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-bgSurface rounded-lg shadow-xl p-6 w-full max-w-sm border border-bgElement">
                <h3 className="text-xl text-textAccent font-bold mb-4 text-center">{title}</h3>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 mb-4 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-lg focus:ring-btnHighlightBg focus:border-btnHighlightBg"
                    placeholder="Valor"
                    autoFocus
                />
                <div className="flex justify-center gap-4 mb-6">
                    <label className="flex items-center gap-2 text-textPrimary cursor-pointer">
                        <input type="radio" name="target" value="HP" checked={target === 'HP'} onChange={(e) => setTarget(e.target.value)} className="form-radio text-btnHighlightBg" />
                        HP
                    </label>
                    
                    {type === 'heal' && (
                        <label className="flex items-center gap-2 text-textPrimary cursor-pointer">
                            <input type="radio" name="target" value="HP Bonus" checked={target === 'HP Bonus'} onChange={(e) => setTarget(e.target.value)} className="form-radio text-btnHighlightBg" />
                            HP Bonus
                        </label>
                    )}

                    <label className="flex items-center gap-2 text-textPrimary cursor-pointer">
                        <input type="radio" name="target" value="MP" checked={target === 'MP'} onChange={(e) => setTarget(e.target.value)} className="form-radio text-btnHighlightBg" />
                        MP
                    </label>
                </div>
                <div className="flex justify-around gap-4">
                    <button onClick={handleConfirm} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">Confirmar</button>
                    <button onClick={onClose} className="px-5 py-2 bg-bgElement hover:opacity-80 text-textPrimary font-bold rounded-lg shadow-md">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default ActionModal;
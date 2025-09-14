import React, { useState } from 'react';

// Modal para Curar/Causar Dano
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
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm border border-gray-700">
                <h3 className="text-xl text-yellow-300 font-bold mb-4 text-center">{title}</h3>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 mb-4 bg-gray-700 border border-gray-600 rounded-md text-white text-center text-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Valor"
                    autoFocus
                />
                <div className="flex justify-center gap-4 mb-6">
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                        <input type="radio" name="target" value="HP" checked={target === 'HP'} onChange={(e) => setTarget(e.target.value)} className="form-radio text-purple-500" />
                        HP
                    </label>
                    
                    {/* A opção de HP Bonus só aparece para CURAR */}
                    {type === 'heal' && (
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input type="radio" name="target" value="HP Bonus" checked={target === 'HP Bonus'} onChange={(e) => setTarget(e.target.value)} className="form-radio text-purple-500" />
                            HP Bonus
                        </label>
                    )}

                    <label className="flex items-center gap-2 text-white cursor-pointer">
                        <input type="radio" name="target" value="MP" checked={target === 'MP'} onChange={(e) => setTarget(e.target.value)} className="form-radio text-purple-500" />
                        MP
                    </label>
                </div>
                <div className="flex justify-around gap-4">
                    <button onClick={handleConfirm} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">Confirmar</button>
                    <button onClick={onClose} className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-md">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default ActionModal;
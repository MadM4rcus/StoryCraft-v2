// src/components/ModalManager.jsx

import React, { useState } from 'react';

const InfoConfirmModalContent = ({ message, onConfirm, onCancel, type, showCopyButton, copyText }) => {
    const [copySuccess, setCopySuccess] = useState('');
    const handleCopy = () => {
        navigator.clipboard.writeText(copyText).then(() => {
            setCopySuccess('Copiado!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Falhou em copiar.');
        });
    }

    const confirmButtonText = type === 'confirm' ? 'Confirmar' : 'OK';
    const confirmButtonClass = type === 'confirm' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

    return (
        <>
            <div className="text-lg text-textPrimary mb-4 text-center whitespace-pre-wrap">{message}</div>
            {showCopyButton && (
                <div className="my-4 p-2 bg-bgElement rounded-md text-center">
                    <p className="text-textSecondary text-sm mb-1">Comando para Discord/Roll20:</p>
                    <code className="text-textAccent break-words">{copyText}</code>
                    <button onClick={handleCopy} className="ml-4 px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-xs font-bold rounded-md">{copySuccess || 'Copiar'}</button>
                </div>
            )}
            <div className="flex justify-around gap-4 mt-4">
                <button onClick={onConfirm} className={`px-5 py-2 rounded-lg font-bold shadow-md text-white ${confirmButtonClass}`}>{confirmButtonText}</button>
                {type !== 'info' && <button onClick={onCancel} className="px-5 py-2 bg-bgElement hover:opacity-80 text-textPrimary font-bold rounded-lg shadow-md">Cancelar</button>}
            </div>
        </>
    );
};

const ActionModalContent = ({ title, onConfirm, onClose, type }) => {
    const [amount, setAmount] = useState('');
    const [target, setTarget] = useState('HP');

    const handleConfirm = () => { const numericAmount = parseInt(amount, 10); if (!isNaN(numericAmount) && numericAmount > 0) { onConfirm(numericAmount, target); } else { console.error('Valor inválido.'); } };
    const handleKeyDown = (e) => { if (e.key === 'Enter') handleConfirm(); };

    return (
        <>
            <h3 className="text-xl text-textAccent font-bold mb-4 text-center">{title}</h3>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={handleKeyDown} className="w-full p-2 mb-4 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-lg focus:ring-btnHighlightBg focus:border-btnHighlightBg" placeholder="Valor" autoFocus />
            <div className="flex justify-center gap-4 mb-6">
                <label className="flex items-center gap-2 text-textPrimary cursor-pointer"><input type="radio" name="target" value="HP" checked={target === 'HP'} onChange={() => setTarget('HP')} className="form-radio text-btnHighlightBg" /> HP</label>
                {type === 'heal' && <label className="flex items-center gap-2 text-textPrimary cursor-pointer"><input type="radio" name="target" value="HP Bonus" checked={target === 'HP Bonus'} onChange={() => setTarget('HP Bonus')} className="form-radio text-btnHighlightBg" /> HP Bonus</label>}
                <label className="flex items-center gap-2 text-textPrimary cursor-pointer"><input type="radio" name="target" value="MP" checked={target === 'MP'} onChange={() => setTarget('MP')} className="form-radio text-btnHighlightBg" /> MP</label>
            </div>
            <div className="flex justify-around gap-4"><button onClick={handleConfirm} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">Confirmar</button><button onClick={onClose} className="px-5 py-2 bg-bgElement hover:opacity-80 text-textPrimary font-bold rounded-lg shadow-md">Cancelar</button></div>
        </>
    );
};

const RollAttributeModalContent = ({ attributeName, onConfirm, onClose }) => {
    const [dice, setDice] = useState('1d20');
    const [bonus, setBonus] = useState('');

    const handleConfirm = () => onConfirm(dice, parseInt(bonus, 10) || 0);
    const handleKeyDown = (e) => { if (e.key === 'Enter') handleConfirm(); };

    return (
        <>
            <h3 className="text-xl text-textAccent font-bold mb-4 text-center">Rolar {attributeName}</h3>
            <div className="mb-4"><label htmlFor="dice-input" className="block text-sm font-medium text-textSecondary mb-1">Dado:</label><input id="dice-input" type="text" value={dice} onChange={(e) => setDice(e.target.value)} onKeyDown={handleKeyDown} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-lg" placeholder="Ex: 1d20, 2d6" autoFocus /></div>
            <div className="mb-6"><label htmlFor="bonus-input" className="block text-sm font-medium text-textSecondary mb-1">Bónus Adicional:</label><input id="bonus-input" type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} onKeyDown={handleKeyDown} className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-lg" placeholder="0" /></div>
            <div className="flex justify-around gap-4"><button onClick={handleConfirm} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md">Confirmar</button><button onClick={onClose} className="px-5 py-2 bg-bgElement hover:opacity-80 text-textPrimary font-bold rounded-lg shadow-md">Cancelar</button></div>
        </>
    );
};

const DamageHealModalContent = ({ attributeName, onConfirm, onClose }) => {
    const [amount, setAmount] = useState('');
    const [actionType, setActionType] = useState('damage'); // 'damage' or 'heal'
    const [isDirectDamage, setIsDirectDamage] = useState(false);

    const handleConfirm = () => {
        const numericAmount = parseInt(amount, 10);
        if (!isNaN(numericAmount) && numericAmount > 0) {
            onConfirm(numericAmount, attributeName, actionType, isDirectDamage);
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    const title = actionType === 'heal' ? `Curar ${attributeName}` : `Causar Dano em ${attributeName}`;

    return (
        <>
            <h3 className="text-xl font-bold text-textPrimary mb-4 text-center">{title}</h3>
            
            <div className="flex justify-center gap-4 mb-4">
                <button 
                    onClick={() => setActionType('damage')}
                    className={`px-4 py-2 rounded-lg font-semibold ${actionType === 'damage' ? 'bg-red-600 text-white' : 'bg-bgElement text-textSecondary'}`}
                >
                    💥 Dano
                </button>
                <button 
                    onClick={() => setActionType('heal')}
                    className={`px-4 py-2 rounded-lg font-semibold ${actionType === 'heal' ? 'bg-green-600 text-white' : 'bg-bgElement text-textSecondary'}`}
                >
                    ❤️ Cura
                </button>
            </div>

            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-2xl mb-4"
                placeholder="Valor"
                autoFocus
            />

            {actionType === 'damage' && attributeName === 'HP' && (
                <div className="flex items-center justify-center mb-4">
                    <input type="checkbox" id="directDamage" checked={isDirectDamage} onChange={(e) => setIsDirectDamage(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="directDamage" className="ml-2 block text-sm text-textSecondary">Dano Direto (ignora HP Bônus)</label>
                </div>
            )}

            <div className="flex justify-end gap-4 mt-6">
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg">Cancelar</button>
                <button onClick={handleConfirm} className="px-4 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg" disabled={!amount}>Confirmar</button>
            </div>
        </>
    );
};

const ModalManager = ({ modalState, closeModal }) => {
    if (!modalState.type) {
        return null; // Não renderiza nada se não houver modal para mostrar
    }

    const renderContent = () => {
        const { type, props } = modalState;
        switch (type) {
            case 'info':
            case 'confirm':
                return <InfoConfirmModalContent {...props} />;
            case 'action':
                return <ActionModalContent {...props} />;
            case 'rollAttribute':
                return <RollAttributeModalContent {...props} />;
            case 'damageHeal':
                return <DamageHealModalContent {...props} />;
            default:
                return null;
        }
    };
    
    // Este é o nosso "ModalSkin"
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" onClick={closeModal}>
            <div className="bg-bgSurface rounded-lg shadow-xl p-6 w-full max-w-sm border border-bgElement" onClick={(e) => e.stopPropagation()}>
                {renderContent()}
            </div>
        </div>
    );
};

export default ModalManager;
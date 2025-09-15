// src/components/Modal.jsx

import React, { useState, useEffect } from 'react';

const Modal = ({ message, onConfirm, onCancel, type = 'info', showCopyButton, copyText }) => {
  const [inputValue, setInputValue] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    if (type === 'prompt') {
      const inputElement = document.getElementById('prompt-input');
      if (inputElement) inputElement.focus();
    }
  }, [type]);

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };
  
  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = copyText;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        setCopySuccess('Copiado!');
        setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
        setCopySuccess('Falhou em copiar.');
    }
    document.body.removeChild(textArea);
  };

  const confirmButtonText = type === 'confirm' ? 'Confirmar' : 'OK';
  const confirmButtonClass = type === 'confirm' 
    ? 'bg-red-600 hover:bg-red-700' 
    : 'bg-green-600 hover:bg-green-700';

  return (
    // AQUI ESTÁ A CORREÇÃO: z-50 foi alterado para z-[60]
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-bgSurface rounded-lg shadow-xl p-6 w-full max-w-md border border-bgElement">
        <div className="text-lg text-textPrimary mb-4 text-center whitespace-pre-wrap">{message}</div>
        
        {showCopyButton && (
            <div className="my-4 p-2 bg-bgElement rounded-md text-center">
                <p className="text-textSecondary text-sm mb-1">Comando para Discord/Roll20:</p>
                <code className="text-textAccent break-words">{copyText}</code>
                <button onClick={handleCopy} className="ml-4 px-3 py-1 bg-btnHighlightBg hover:bg-opacity-80 text-btnHighlightText text-xs font-bold rounded-md">{copySuccess || 'Copiar'}</button>
            </div>
        )}

        {type === 'prompt' && (
          <input
            id="prompt-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary"
            placeholder="Digite aqui..."
          />
        )}

        <div className="flex justify-around gap-4">
          <button onClick={handleConfirm} className={`px-5 py-2 rounded-lg font-bold shadow-md text-white ${confirmButtonClass}`}>
            {confirmButtonText}
          </button>
          {type !== 'info' && (
            <button onClick={onCancel} className="px-5 py-2 bg-bgElement hover:opacity-80 text-textPrimary font-bold rounded-lg shadow-md">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
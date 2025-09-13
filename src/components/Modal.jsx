import React, { useState, useEffect } from 'react';

const Modal = ({ message, onConfirm, onCancel, type = 'info' }) => {
  const [inputValue, setInputValue] = useState('');

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

  const confirmButtonText = type === 'confirm' ? 'Confirmar' : 'OK';
  const confirmButtonClass = type === 'confirm' 
    ? 'bg-red-600 hover:bg-red-700' 
    : 'bg-green-600 hover:bg-green-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
        <div className="text-lg text-gray-100 mb-4 text-center whitespace-pre-wrap">{message}</div>
        
        {type === 'prompt' && (
          <input
            id="prompt-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-700 border border-gray-600 rounded-md text-white"
            placeholder="Digite aqui..."
          />
        )}

        <div className="flex justify-around gap-4">
          <button onClick={handleConfirm} className={`px-5 py-2 rounded-lg font-bold shadow-md text-white ${confirmButtonClass}`}>
            {confirmButtonText}
          </button>
          {type !== 'info' && (
            <button onClick={onCancel} className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-md">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
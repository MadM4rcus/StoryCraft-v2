// src/components/ActionButtons.jsx

import React from 'react';

const ActionButtons = ({ character, onExport, onReset }) => {
    return (
        <div className="flex flex-wrap justify-center gap-4 mt-8 p-4 bg-bgSurface/80 backdrop-blur-sm rounded-xl border border-bgElement">
            <button 
                onClick={onExport} 
                className="px-6 py-3 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!character}
            >
                Exportar Ficha (JSON)
            </button>
            <button 
                onClick={onReset} 
                className="px-8 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!character}
            >
                Resetar Ficha
            </button>
        </div>
    );
};

export default ActionButtons;
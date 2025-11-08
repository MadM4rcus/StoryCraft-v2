// src/components/SystemRouter.jsx

import React, { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import StoryCraftV1Dashboard from '@/systems/storycraft/Dashboard'; // Dashboard do V1
import StoryCraftV2Dashboard from '@/systems/storycraft_v2/Dashboard'; // Dashboard do V2 com o caminho corrigido

const SystemRouter = (props) => {
  const { currentSystem, setCurrentSystem } = useSystem();
  
  // Se nenhum sistema foi selecionado, mostra a tela de seleção em tela cheia.
  if (!currentSystem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bgPage p-4">
        <h1 className="text-4xl font-bold text-textPrimary mb-10">Selecione o Sistema</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Card de Seleção para StoryCraft V1 */}
          <div
            onClick={() => setCurrentSystem('v1')}
            className="bg-bgSurface border-2 border-borderAccent rounded-lg p-8 w-80 h-60 flex flex-col justify-center items-center text-center cursor-pointer transform hover:scale-105 transition-transform duration-300 shadow-lg"
          >
            <h2 className="text-3xl font-bold text-textAccent mb-2">StoryCraft V1</h2>
            <p className="text-textSecondary">A experiência clássica com temas personalizáveis.</p>
          </div>
          
          {/* Card de Seleção para StoryCraft V2 */}
          <div
            onClick={() => setCurrentSystem('v2')}
            className="bg-bgSurface border-2 border-borderAccent rounded-lg p-8 w-80 h-60 flex flex-col justify-center items-center text-center cursor-pointer transform hover:scale-105 transition-transform duration-300 shadow-lg"
          >
            <h2 className="text-3xl font-bold text-textAccent mb-2">StoryCraft V2</h2>
            <p className="text-textSecondary">O novo sistema com regras de Escala de Poder.</p>
          </div>
        </div>
      </div>
    );
  }

  // Se um sistema foi selecionado, renderiza o dashboard correspondente.
  return (
    <>
      {currentSystem === 'v1' && <StoryCraftV1Dashboard {...props} />}
      {currentSystem === 'v2' && <StoryCraftV2Dashboard {...props} />}
    </>
  );  
};

export default SystemRouter;
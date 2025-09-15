// src/components/WalletSection.jsx

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import SheetSkin from './SheetSkin'; // 1. Importamos o nosso novo componente

const WalletSection = ({ character, isMaster, onUpdate, isCollapsed, toggleSection }) => {
  const { user } = useAuth();
  const [zeniAmount, setZeniAmount] = useState(0);

  const currentZeni = character.wallet?.zeni || 0;
  const currentInspiration = character.wallet?.inspiration || 0;
  const canEdit = user.uid === character.ownerUid || isMaster;

  const handleUpdateWallet = (field, newValue) => {
    const newWallet = { ...character.wallet, [field]: Math.max(0, newValue) };
    onUpdate('wallet', newWallet);
  };

  const handleAddZeni = () => { handleUpdateWallet('zeni', currentZeni + zeniAmount); setZeniAmount(0); };
  const handleRemoveZeni = () => { handleUpdateWallet('zeni', currentZeni - zeniAmount); setZeniAmount(0); };
  const handleAddInspiration = () => handleUpdateWallet('inspiration', currentInspiration + 1);
  const handleRemoveInspiration = () => handleUpdateWallet('inspiration', currentInspiration - 1);
  
  // 2. Criamos o JSX para os botões de Inspiração que irão para o cabeçalho
  const walletActions = (
    <div className="flex items-center gap-4 text-base">
        <span className="text-textPrimary">Inspiração: {currentInspiration}</span>
    </div>
  );

  return (
    // 3. Usamos o SheetSkin como a "casca"
    <SheetSkin
      title={`Zeni: ${currentZeni}`}
      isCollapsed={isCollapsed}
      toggleSection={toggleSection}
      actions={walletActions} // Passamos os botões de Inspiração para o cabeçalho
    >
      {/* 4. Este é o "miolo": apenas a lógica e a estrutura interna da carteira */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline font-semibold text-textSecondary">Zeni:</span>
          <input type="number" value={zeniAmount === 0 ? '' : zeniAmount} onChange={(e) => setZeniAmount(parseInt(e.target.value, 10) || 0)} className="w-20 p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-lg" placeholder="Valor" disabled={!canEdit} />
          <button onClick={handleAddZeni} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>Adicionar</button>
          <button onClick={handleRemoveZeni} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>Remover</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline font-semibold text-textSecondary">Inspiração:</span>
          <button onClick={handleAddInspiration} className="px-3 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg text-sm" disabled={!canEdit}>+1</button>
          <button onClick={handleRemoveInspiration} className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>-1</button>
        </div>
      </div>
    </SheetSkin>
  );
};

export default WalletSection;
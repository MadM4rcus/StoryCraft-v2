import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const WalletSection = ({ character, isMaster, onUpdate, isCollapsed, toggleSection }) => {
  const { user } = useAuth();
  const [zeniAmount, setZeniAmount] = useState(0);

  const currentZeni = character.wallet?.zeni || 0;
  const currentInspiration = character.wallet?.inspiration || 0;

  // O dono da ficha OU o mestre podem editar
  const canEdit = user.uid === character.ownerUid || isMaster;

  const handleUpdateWallet = (field, newValue) => {
    const newWallet = { ...character.wallet, [field]: Math.max(0, newValue) };
    onUpdate('wallet', newWallet);
  };

  const handleAddZeni = () => {
    handleUpdateWallet('zeni', currentZeni + zeniAmount);
    setZeniAmount(0);
  };

  const handleRemoveZeni = () => {
    handleUpdateWallet('zeni', currentZeni - zeniAmount);
    setZeniAmount(0);
  };

  const handleAddInspiration = () => handleUpdateWallet('inspiration', currentInspiration + 1);
  const handleRemoveInspiration = () => handleUpdateWallet('inspiration', currentInspiration - 1);

  return (
    <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
      <h2 
        className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center"
        onClick={toggleSection}
      >
        <span>Zeni: {currentZeni}</span>
        <div className="flex items-center gap-4">
          <span>Inspiração: {currentInspiration}</span>
          <span>{isCollapsed ? '▼' : '▲'}</span>
        </div>
      </h2>
      {!isCollapsed && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline font-semibold text-gray-300">Zeni:</span>
            <input 
              type="number" 
              value={zeniAmount === 0 ? '' : zeniAmount} 
              onChange={(e) => setZeniAmount(parseInt(e.target.value, 10) || 0)} 
              className="w-20 p-2 bg-gray-600 border border-gray-500 rounded-md text-white text-lg" 
              placeholder="Valor" 
              disabled={!canEdit}
            />
            <button onClick={handleAddZeni} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>Adicionar</button>
            <button onClick={handleRemoveZeni} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>Remover</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline font-semibold text-gray-300">Inspiração:</span>
            <button onClick={handleAddInspiration} className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>+1</button>
            <button onClick={handleRemoveInspiration} className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>-1</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default WalletSection;
// src/systems/storycraft_v3/ListSections_v3.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import SheetSkin from './SheetSkin_v3';
import { PREDEFINED_SKILLS } from './Specializations_v3';

// Helper de Textarea (usado por vários sub-componentes)
const AutoResizingTextarea = ({ value, onChange, onBlur, placeholder, className, disabled, name }) => {
    const textareaRef = useRef(null);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);
    return <textarea ref={textareaRef} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} className={`${className} resize-none overflow-hidden`} rows="1" disabled={disabled} name={name} />;
};

// --- NOVO: Componente da Carteira Compacta (Display) ---
const CompactWallet = ({ wallet, totalWeight, onToggleManage, canEdit }) => {
    // 1. Filtra as moedas que o usuário REALMENTE tem (valor > 0)
    const ownedTiers = CURRENCY_TIERS.filter(tier => (wallet?.[tier.name] || 0) > 0);

    // 2. Determina o que mostrar:
    // Se o usuário tem moedas, mostre-as.
    // Se não tiver NENHUMA, mostre apenas o Bronze (o primeiro tier da lista).
    const tiersToDisplay = ownedTiers.length > 0 ? ownedTiers : [CURRENCY_TIERS[0]];

    return (
        <div className="p-4 bg-bgInput rounded-lg border border-bgElement">
            <div className="flex flex-wrap justify-between items-center gap-4">
                {/* O display das moedas */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 items-center">
                    <h4 className="text-xl font-semibold text-textAccent mr-2">Carteira</h4>
                    
                    {/* 3. Mapeia APENAS a lista que decidimos exibir */}
                    {tiersToDisplay.map(tier => (
                        <div key={tier.name} className="flex items-baseline" title={`Florim de ${tier.name}`}>
                            {/* Busca o valor (que será 0 no caso padrão "0 FB") */}
                            <span className={`font-bold text-lg ${tier.color}`}>{wallet?.[tier.name] || 0}</span>
                            <span className="text-sm text-textSecondary ml-1">{tier.symbol}</span>
                        </div>
                    ))}
                </div>

                {/* Controles e Peso */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 ml-auto">
                    <span className="text-sm text-textSecondary whitespace-nowrap text-right">
                        Peso Moedas: {Number(totalWeight).toFixed(3)} Espaços
                    </span>
                    {canEdit && (<button
                        onClick={onToggleManage} // O botão de gerenciar só aparece se puder editar.
                        className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap"
                    >
                        Gerenciar Carteira
                    </button>)}
                </div>
            </div>
        </div>
    );
};

// --- NOVO: Componente de Resumo da Carteira (VERSÃO "LOJA STORYCRAFT") ---
const WalletSummaryCard = ({ totalGoldValue, totalCoinWeight }) => {
    
    // --- Helper para pegar uma piada aleatória ---
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // --- 1. PROVOCAÇÕES DE RIQUEZA (baseado no total em Ouro) ---
    const getValueFact = (goldValue) => {
        if (goldValue <= 0) {
            return pickRandom([
                "0 FO. Literalmente. Chora pro mestre te dar uma esmolinha.",
                "Sua carteira tem teias de aranha. Que pobrinho!",
                "Sua carteira ecoa com o som do... nada.",
            ]);
        }
        if (goldValue < 1) { // Menos de 1 Ouro (ex: 10 Bronze = 0.1 FO)
            return pickRandom([
                `Você tem apenas ${Math.floor(goldValue * 100)} Bronze? Isso não paga nem uma Refeição Simples (0.5 FO)!`,
                "Isso mal paga uma cerveja aguada na pior taverna da cidade.",
                `Sério? ${Math.floor(goldValue * 100)} Bronze? O rato do porão tem mais.`
            ]);
        }
        if (goldValue < 20) {
            return pickRandom([
                "Dinheiro de bolso. Suficiente para o básico.",
                "Já dá pra comprar uma Espada Longa (15 FO) e ainda sobra troco!",
                "Quase um Kit de Ladrão (25 FO). Quase...",
            ]);
        }
        if (goldValue < 100) {
            return pickRandom([
                "Uma bolsa respeitável. Você não é um zé-ninguém.",
                "Opa! Dá pra comprar uma Roupa Nobre (50 FO) e impressionar o Duque.",
                "Tá sonhando com aquele Arco Longo (100 FO)? Falta pouco!",
            ]);
        }
        if (goldValue < 500) {
            return pickRandom([
                "Nossa, o ferreiro vai ficar feliz quando te ver!",
                "Isso é mais do que um guarda da cidade ganha em um ano.",
                "Dá pra comprar um cavalo decente (75 FO)... ou 150 Refeições Simples (0.5 FO).",
            ]);
        }
        if (goldValue < 2000) {
            return pickRandom([
                "Isso é dinheiro de Mosquete (500 F$)! Vai começar uma guerra?",
                "Você podia comprar um Grifo (1.500 F$) e sair voando por aí!",
                "Cheiro de equipamento novo no ar. Que tal uma Couraça (500 F$)?",
            ]);
        }
        if (goldValue < 10000) {
            return pickRandom([
                "Você podia comprar um DRAGÃO JOVEM (5.000 F$)?! Que nível é essa campanha?!",
                "Tá na hora de comprar um Encantamento Lendário (5.000 F$), hein?",
                "Com essa grana, você podia ajudar uns camponeses. Ou comprar uma Poção Rúnica de Cura (3.000 F$).",
            ]);
        }
        // Mais de 10000 Ouro
        return pickRandom([
            "Você tem dinheiro pra um Encantamento Titânico (20.000 F$)?!",
            "Você é o 1% da cidade. Parabéns, seu capitalista.",
            "Já pensou em comprar um Navio Voador (30.000 FO)? Só digo isso.",
        ]);
    };

    // --- 2. PROVOCAÇÕES DE PESO (baseado no peso em gramas) ---
    const getWeightFact = (spaces) => {
        if (spaces <= 0) {
            return pickRandom([
                "Leve como uma pena.",
                "Sua bolsa flutua de tão vazia.",
            ]);
        }
        if (spaces < 1) {
            return pickRandom([
                "Peso de bolso. Tranquilo.",
                "Nem sente no cinto.",
            ]);
        }
        if (spaces < 5) {
            return pickRandom([
                "Começando a pesar...",
                "Sua bolsa faz 'clink clink' alto demais.",
            ]);
        }
        return pickRandom([
            "Você é um banco ambulante!",
            "Cuidado com a coluna, rico!",
        ]);
    };

    return (
        // Este card vai ocupar 2 colunas no grid, ao lado do Etherium
        <div className="flex flex-col p-3 bg-bgElement rounded-md md:col-span-2 lg:col-span-2 gap-3">
            
            {/* --- SEÇÃO DO VALOR TOTAL --- */}
            <div className="border-b border-bgInput pb-2">
                <h5 className="text-sm font-bold text-textSecondary uppercase">Valor Total Consolidado</h5>
                <span className="font-bold text-2xl text-yellow-400">{totalGoldValue.toFixed(2)}</span>
                <span className="text-lg text-yellow-500 ml-1">F$ (em Florins)</span>
            </div>

            {/* --- SEÇÃO DAS FUN FACTS --- */}
            <div>
                <h5 className="text-sm font-bold text-textSecondary uppercase">Oráculo da Riqueza</h5>
                <p className="text-textPrimary italic">"{getValueFact(totalGoldValue)}"</p>
            </div>
            <div>
                <h5 className="text-sm font-bold text-textSecondary uppercase">Balança da Verdade ({Number(totalCoinWeight).toFixed(3)} Espaços)</h5>
                <p className="text-textPrimary italic">"{getWeightFact(totalCoinWeight)}"</p>
            </div>
        </div>
    );
};

// --- Constante das Moedas ---
export const CURRENCY_TIERS = [
    { name: 'Florel', symbol: 'Fl', color: 'text-yellow-600', value: 1 },
    { name: 'Florão', symbol: 'Fã', color: 'text-gray-400', value: 10 },
    { name: 'Florin', symbol: 'F$', color: 'text-yellow-400', value: 100 },
    { name: 'Flor Platina', symbol: 'FP', color: 'text-blue-300', value: 100000 },
    { name: 'Flor Esmeralda', symbol: 'FE', color: 'text-green-400', value: 1000000 },
    { name: 'Flor Rubi', symbol: 'FR', color: 'text-red-500', value: 10000000 },
    { name: 'Flor Diamante', symbol: 'FD', color: 'text-cyan-400', value: 100000000 },
];

// --- Componente da Carteira de Florins (Gerenciamento) ---
const FlorinWallet = ({ wallet, onUpdate, canEdit, onClose, totalCoinWeight }) => {
    const [amounts, setAmounts] = useState({});

    // Calcula o valor total de todas as moedas, convertido para Florin (Ouro)
    const totalGoldValue = useMemo(() => {
        const goldTierValue = CURRENCY_TIERS.find(t => t.name === 'Florin')?.value || 100;
        
        // Soma o valor total em "Bronze"
        const totalBronzeValue = CURRENCY_TIERS.reduce((total, tier) => {
            const amount = wallet?.[tier.name] || 0;
            return total + (amount * tier.value); // tier.value é o valor em bronze
        }, 0);

        // Converte o valor total de Bronze para Ouro
        return totalBronzeValue / goldTierValue;
    }, [wallet]);

    // Nova função para adicionar/remover 1
    const handleUpdateCurrencyOne = (tierName, operation) => {
        const currentWallet = wallet || {};
        const currentAmount = currentWallet[tierName] || 0;
        const newAmount = operation === 'add' ? currentAmount + 1 : Math.max(0, currentAmount - 1);
        onUpdate('wallet', { ...currentWallet, [tierName]: newAmount });
    };

    const handleUpdateCurrency = (tierName, operation) => {
        const amount = parseInt(amounts[tierName], 10) || 0;
        if (amount === 0) return;

        const currentWallet = wallet || {};
        const currentAmount = currentWallet[tierName] || 0;
        const newAmount = operation === 'add' ? currentAmount + amount : Math.max(0, currentAmount - amount);

        onUpdate('wallet', { ...currentWallet, [tierName]: newAmount });
        setAmounts(prev => ({ ...prev, [tierName]: '' }));
    };

    const handleConvert = (fromTierIndex, toTierIndex) => {
        const fromTier = CURRENCY_TIERS[fromTierIndex];
        const toTier = CURRENCY_TIERS[toTierIndex];
        const currentWallet = wallet || {};

        // Convertendo para cima (ex: 10 Florel -> 1 Florão)
        if (fromTier.value < toTier.value) {
            const rate = toTier.value / fromTier.value;
            const fromAmount = currentWallet[fromTier.name] || 0;
            if (fromAmount >= rate) {
                const newFromAmount = fromAmount - rate;
                const toAmount = (currentWallet[toTier.name] || 0) + 1;
                onUpdate('wallet', { ...currentWallet, [fromTier.name]: newFromAmount, [toTier.name]: toAmount });
            }
        }
        // Convertendo para baixo (ex: 1 Florão -> 10 Florel)
        else {
            const rate = fromTier.value / toTier.value;
            const fromAmount = currentWallet[fromTier.name] || 0;
            if (fromAmount >= 1) {
                const newFromAmount = fromAmount - 1;
                const toAmount = (currentWallet[toTier.name] || 0) + rate;
                onUpdate('wallet', { ...currentWallet, [fromTier.name]: newFromAmount, [toTier.name]: toAmount });
            }
        }
    };

    return (
        <div className="mt-6 p-4 bg-bgInput rounded-lg border border-bgElement">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-xl font-semibold text-textAccent">Gerenciar Carteira de Florins</h4>
                <button
                    onClick={onClose}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-bold rounded-md"
                >
                    Fechar
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CURRENCY_TIERS.map((tier, index) => {
                    const prevTier = index > 0 ? CURRENCY_TIERS[index - 1] : null;
                    const nextTier = index < CURRENCY_TIERS.length - 1 ? CURRENCY_TIERS[index + 1] : null;
                    const rateDown = prevTier ? tier.value / prevTier.value : 0;
                    const rateUp = nextTier ? nextTier.value / tier.value : 0;

                    return (
                        <div key={tier.name} className={`flex flex-col p-2 bg-bgElement rounded-md`}>
                            <span className={`font-bold text-lg ${tier.color}`}>{tier.name}: {wallet?.[tier.name] || 0}</span>
                            
                            {/* Input e botões "Adicionar/Remover" */}
                            <div className="flex items-center gap-1 mt-2">
                                <input
                                    type="number"
                                    value={amounts[tier.name] || ''}
                                    onChange={(e) => setAmounts(prev => ({ ...prev, [tier.name]: e.target.value }))}
                                    className="w-16 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center"
                                    placeholder="Valor"
                                    disabled={!canEdit}
                                />
                                <button onClick={() => handleUpdateCurrency(tier.name, 'add')} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md text-sm" disabled={!canEdit}>Adicionar</button>
                                <button onClick={() => handleUpdateCurrency(tier.name, 'remove')} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md text-sm" disabled={!canEdit}>Remover</button>
                            </div>

                            {/* Botões +1 / -1 */}
                            <div className="flex items-center gap-1 mt-1 justify-end">
                                <button onClick={() => handleUpdateCurrencyOne(tier.name, 'add')} className="w-8 h-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-md text-xs" disabled={!canEdit}>+1</button>
                                <button onClick={() => handleUpdateCurrencyOne(tier.name, 'remove')} className="w-8 h-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-md text-xs" disabled={!canEdit}>-1</button>
                            </div>

                            {/* Botões de Conversão */}
                            <div className="flex justify-between mt-2 text-xs border-t border-bgInput pt-2">
                                {prevTier && (
                                <button 
                                    onClick={() => handleConvert(index, index - 1)}
                                    className="text-gray-400 hover:text-white disabled:opacity-50 font-mono"
                                    title={`Converter 1 ${tier.name} para ${rateDown} ${prevTier.name}`}
                                    disabled={!canEdit}
                                >
                                    1 🡒 {rateDown}
                                </button>
                                )}
                                {nextTier && (
                                <button 
                                    onClick={() => handleConvert(index, index + 1)}
                                    className="text-gray-400 hover:text-white ml-auto disabled:opacity-50 font-mono"
                                    title={`Converter ${rateUp} ${tier.name} para 1 ${nextTier.name}`}
                                    disabled={!canEdit}
                                >
                                    {rateUp} 🡒 1
                                </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* --- PAINEL DE CURIOSIDADES --- */}
                <WalletSummaryCard 
                    totalGoldValue={totalGoldValue} 
                    totalCoinWeight={totalCoinWeight} 
                />

            </div>
        </div>
    );
};

// --- Sub-componente para Inventário ---
const InventoryList = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, onShowDiscord, isEditMode, isEncumbered, isOverloaded, totalWeight, capacity }) => {
    const { user } = useAuth();
    // A permissão de edição geral (dono da ficha ou mestre)
    const canEdit = user.uid === character.ownerUid || isMaster;

    // Estado local para os itens do inventário
    const [localInventory, setLocalInventory] = useState(character.inventory || []);
    // --- NOVO ESTADO PARA CONTROLAR A CARTEIRA ---
    const [isWalletOpen, setIsWalletOpen] = useState(false);

    const totalCoinWeight = useMemo(() => {
        return CURRENCY_TIERS.reduce((total, tier) => {
            const amount = character.wallet?.[tier.name] || 0;
            // Flores Maiores pesam 0.5 espaço cada
            if (['Flor Platina', 'Flor Esmeralda', 'Flor Rubi', 'Flor Diamante'].includes(tier.name)) {
                return total + (amount * 0.5);
            }
            // Moedas comuns pesam 1 espaço a cada 1000 (0.001 cada)
            return total + (amount * 0.001);
        }, 0);
    }, [character.wallet]);

    // Sincroniza o estado local com o estado da ficha pai
    useEffect(() => {
        setLocalInventory(character.inventory || []);
    }, [character.inventory]);

    const handleAddItem = () => onUpdate('inventory', [...(character.inventory || []), { id: crypto.randomUUID(), name: '', description: '', quantity: 1, stackSize: 1, spaces: 1, isCollapsed: false }]);
    const handleRemoveItem = (id) => onUpdate('inventory', (character.inventory || []).filter(item => item.id !== id));

    const handleLocalChange = (id, field, value) => {
        setLocalInventory(prevInventory => prevInventory.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSave = useCallback((id, field) => {
        const localItem = localInventory.find(item => item.id === id);
        const originalItem = (character.inventory || []).find(item => item.id === id);

        if (localItem && originalItem && localItem[field] !== originalItem[field]) {
            const valueToSave = ['quantity', 'spaces', 'stackSize'].includes(field) ? (Number(localItem[field]) || 0) : localItem[field];
            onUpdate('inventory', (character.inventory || []).map(item => item.id === id ? { ...item, [field]: valueToSave } : item));
        }
    }, [localInventory, character.inventory, onUpdate]);

    const toggleItemCollapsed = (id) => {
        const itemToToggle = localInventory.find(item => item.id === id);
        if (itemToToggle) {
            onUpdate('inventory', (character.inventory || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));
        }
    };

    return (
        // --- TÍTULO LIMPO ---
        <SheetSkin title="Inventário" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            
            {/* --- RESUMO DE CARGA E DEBUFFS --- */}
            <div className={`mb-6 p-4 rounded-lg border ${isOverloaded ? 'bg-red-900/10 border-red-500/50' : 'bg-bgElement border-bgInput'}`}>
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-textSecondary uppercase">Capacidade de Carga</span>
                    <div className="text-right">
                        <span className={`text-2xl font-bold ${isOverloaded ? 'text-red-500' : 'text-green-400'}`}>
                            {totalWeight} <span className="text-sm text-textSecondary">/ {capacity}</span>
                        </span>
                        <span className="text-xs text-textSecondary block">Espaços</span>
                    </div>
                </div>
                
                {/* Barra de Progresso */}
                <div className="w-full bg-bgInput rounded-full h-3 mb-3 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${isEncumbered ? 'bg-red-600' : isOverloaded ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${Math.min(100, (totalWeight / (capacity * 2)) * 100)}%` }}
                    ></div>
                </div>

                {/* Avisos de Sobrecarga */}
                {isOverloaded && (
                    <div className="mt-3 pt-3 border-t border-red-500/30">
                        <p className="font-bold text-red-400 text-sm mb-1">⚠️ PERSONAGEM SOBRECARREGADO</p>
                        <ul className="text-xs text-red-300 space-y-1 list-disc list-inside">
                            <li>-5 em testes de <strong>Furtividade</strong> e <strong>Acrobacia</strong>.</li>
                            <li>Deslocamento reduzido em <strong>3 metros</strong>.</li>
                            {isEncumbered && <li className="font-bold text-red-500">LIMITE MÁXIMO EXCEDIDO (2x Capacidade)! Não é possível carregar mais itens.</li>}
                        </ul>
                    </div>
                )}
            </div>
            
            {/* --- LÓGICA DE TROCA DA CARTEIRA --- */}
            {!isWalletOpen ? (
                <CompactWallet
                    wallet={character.wallet}
                    totalWeight={totalCoinWeight}
                    onToggleManage={() => setIsWalletOpen(true)}
                    canEdit={canEdit}
                />
            ) : (
                <FlorinWallet
                    wallet={character.wallet}
                    onUpdate={onUpdate}
                    canEdit={canEdit}
                    onClose={() => setIsWalletOpen(false)}
                    totalCoinWeight={totalCoinWeight} // Passando o peso para o painel
                />
            )}
            {/* --- FIM DA LÓGICA DA CARTEIRA --- */}
            
            <h4 className="text-xl font-semibold text-textAccent mt-6 mb-3">Itens</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                {(localInventory || []).map(item => {
                    const isItemCollapsed = item.isCollapsed !== false;
                    return isItemCollapsed ? (
                        <div key={item.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>
                                {item.name || 'Item Sem Nome'} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                            </span>
                            <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-2">Mostrar no Feed</button>
                        </div>
                    ) : (
                        <div key={item.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm border border-bgInput">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-4">Mostrar no Feed</button>
                            </div>
                            <span className="text-textSecondary text-xs whitespace-nowrap cursor-pointer self-end" onClick={() => toggleItemCollapsed(item.id)}>Recolher ▲</span>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handleLocalChange(item.id, 'name', e.target.value)}
                                    onBlur={() => handleSave(item.id, 'name')}
                                    className="font-semibold text-lg flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                                    placeholder="Nome do Item"
                                    disabled={!canEdit}
                                />
                                <div className="flex items-center gap-1">
                                    <label className="text-sm text-textSecondary">Qtd:</label>
                                    <input type="number" value={item.quantity} onChange={(e) => handleLocalChange(item.id, 'quantity', e.target.value)} onBlur={() => handleSave(item.id, 'quantity')} className="w-16 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center" disabled={!canEdit} />
                                </div>
                                <div className="flex items-center gap-1" title="Tamanho do Pack (Quantos itens cabem em 1 espaço)">
                                    <label className="text-sm text-textSecondary">Pack:</label>
                                    <input type="number" value={item.stackSize || 1} onChange={(e) => handleLocalChange(item.id, 'stackSize', e.target.value)} onBlur={() => handleSave(item.id, 'stackSize')} className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center" placeholder="1" disabled={!canEdit} />
                                </div>
                                <div className="flex items-center gap-1" title="Peso por Pack (ou por unidade se Pack for 1)">
                                    <label className="text-sm text-textSecondary">Peso:</label>
                                    <input type="number" value={item.spaces} onChange={(e) => handleLocalChange(item.id, 'spaces', e.target.value)} onBlur={() => handleSave(item.id, 'spaces')} className="w-16 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center" disabled={!canEdit} />
                                </div>
                            </div>
                            <AutoResizingTextarea
                                name="description"
                                value={item.description}
                                onChange={(e) => handleLocalChange(item.id, 'description', e.target.value)}
                                onBlur={() => handleSave(item.id, 'description')}
                                placeholder="Descrição do item"
                                className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md"
                                disabled={!canEdit}
                            />
                            {canEdit && (
                                <div className="flex justify-end mt-2 pt-2 border-t border-bgInput/50">
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                                        title="Remover Item"
                                    ><span role="img" aria-label="Remover" className="text-xl">🗑️</span></button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {(localInventory || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhum item no inventário.</p>}
            {canEdit && isEditMode && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={handleAddItem}
                        className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
                        disabled={isEncumbered}
                        title={isEncumbered ? "Você atingiu o limite máximo de carga!" : "Adicionar Item"}
                    >+</button>
                </div>
            )}
        </SheetSkin>
    );
};

// --- Sub-componente para Itens Equipados ---
const EquippedItemsList = ({ character, isMaster, onUpdate, onShowDiscord, isCollapsed, toggleSection, allAttributes }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const [localEquippedItems, setLocalEquippedItems] = useState(character.equippedItems || []);

    useEffect(() => {
        setLocalEquippedItems(character.equippedItems || []);
    }, [character.equippedItems]);

    const handleAddItem = (type) => {
        const newItem = {
            id: crypto.randomUUID(),
            name: type === 'ammo' ? 'Nova Munição' : 'Novo Equipamento',
            description: '',
            isActive: true,
            isAmmo: type === 'ammo',
            quantity: type === 'ammo' ? 20 : 1,
            stackSize: type === 'ammo' ? 20 : 1, // Novo campo: Quantas unidades cabem em 1 espaço
            spaces: 1, // Peso padrão do pack/item
            ignoreMD: 0,
            effects: [],
            isCollapsed: false
        };
        onUpdate('equippedItems', [...(character.equippedItems || []), newItem]);
    };
    const handleRemoveItem = (id) => onUpdate('equippedItems', (character.equippedItems || []).filter(i => i.id !== id));

    const handleLocalChange = (id, field, value) => {
        setLocalEquippedItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const handleSave = useCallback((id, field) => {
        const localItem = localEquippedItems.find(item => item.id === id);
        const originalItem = (character.equippedItems || []).find(item => item.id === id);
        if (localItem && originalItem && localItem[field] !== originalItem[field]) {
            const valueToSave = ['quantity', 'ignoreMD', 'spaces', 'stackSize'].includes(field) ? (parseFloat(localItem[field]) || 0) : localItem[field];
            onUpdate('equippedItems', (character.equippedItems || []).map(i => (i.id === id ? { ...i, [field]: valueToSave } : i)));
        }
    }, [localEquippedItems, character.equippedItems, onUpdate]);

    const handleToggleActive = (id) => {
        onUpdate('equippedItems', (character.equippedItems || []).map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
    };

    // --- Lógica de Efeitos ---
    const handleAddEffect = (itemId) => {
        const newEffect = { id: crypto.randomUUID(), type: 'attribute', target: '', value: 0 };
        onUpdate('equippedItems', (character.equippedItems || []).map(item => 
            item.id === itemId ? { ...item, effects: [...(item.effects || []), newEffect] } : item
        ));
    };

    const handleRemoveEffect = (itemId, effectId) => {
        onUpdate('equippedItems', (character.equippedItems || []).map(item => 
            item.id === itemId ? { ...item, effects: (item.effects || []).filter(e => e.id !== effectId) } : item
        ));
    };

    const handleEffectChange = (itemId, effectId, field, value) => {
        onUpdate('equippedItems', (character.equippedItems || []).map(item => 
            item.id === itemId ? {
                ...item,
                effects: (item.effects || []).map(effect => {
                    if (effect.id === effectId) {
                        const updatedEffect = { ...effect, [field]: value };
                        if (field === 'type') updatedEffect.target = ''; // Reset target on type change
                        return updatedEffect;
                    }
                    return effect;
                })
            } : item
        ));
    };

    const toggleItemCollapsed = (id) => onUpdate('equippedItems', (character.equippedItems || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

    return (
        <SheetSkin title="Itens Equipados" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(localEquippedItems || []).map(item => {
                    const isItemCollapsed = item.isCollapsed !== false;
                    return isItemCollapsed ? (
                        <div key={item.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>
                                {item.name || 'Item Sem Nome'} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                            </span>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center cursor-pointer" title={item.isActive ? "Equipado" : "Desequipado"}>
                                    <input type="checkbox" checked={item.isActive !== false} onChange={() => handleToggleActive(item.id)} className="sr-only" disabled={!canEdit} />
                                    <div className={`w-3 h-3 rounded-full ${item.isActive !== false ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                </label>
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap">Feed</button>
                            </div>
                        </div>
                    ) : (
                        <div key={item.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm border border-bgInput">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                                <div className="flex items-center gap-3 ml-4">
                                    <label className="flex items-center cursor-pointer gap-2">
                                        <span className="text-xs text-textSecondary uppercase font-bold">{item.isActive !== false ? 'Equipado' : 'Guardado'}</span>
                                        <div className="relative" title="Itens guardados não aplicam seus bônus passivos.">
                                            <input type="checkbox" checked={item.isActive !== false} onChange={() => handleToggleActive(item.id)} className="sr-only" disabled={!canEdit} />
                                            <div className={`block w-10 h-6 rounded-full ${item.isActive !== false ? 'bg-green-600' : 'bg-bgInput'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${item.isActive !== false ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                    </label>
                                    <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap">Feed</button>
                                </div>
                            </div>
                            <span className="text-textSecondary text-xs whitespace-nowrap cursor-pointer self-end" onClick={() => toggleItemCollapsed(item.id)}>Recolher ▲</span>
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleLocalChange(item.id, 'name', e.target.value)}
                                onBlur={() => handleSave(item.id, 'name')}
                                className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2"
                                placeholder="Nome"
                                disabled={!canEdit}
                            />
                            
                            {/* --- LINHA DE DETALHES (Peso, Qtd, Tipo) --- */}
                            <div className={`flex flex-wrap items-center gap-4 mb-2 p-2 rounded-md border ${item.isAmmo ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-bgInput/20 border-bgElement/50'}`}>
                                
                                {/* Badge de Munição (Apenas se for munição) */}
                                {item.isAmmo && (
                                    <div className="flex items-center gap-2" title="Item do tipo Munição">
                                        <span className="text-xs font-bold uppercase text-yellow-500 bg-yellow-900/40 px-2 py-1 rounded">Munição</span>
                                    </div>
                                )}

                                {/* Campos de Quantidade e Espaço */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-textSecondary">Qtd:</span>
                                    <input type="number" value={item.quantity} onChange={(e) => handleLocalChange(item.id, 'quantity', e.target.value)} onBlur={() => handleSave(item.id, 'quantity')} className="w-14 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-sm" placeholder="1" disabled={!canEdit} />
                                </div>
                                
                                {item.isAmmo && (
                                    <div className="flex items-center gap-2" title="Quantas unidades cabem em 1 espaço (ex: 20 flechas por aljava)">
                                        <span className="text-xs text-textSecondary">Pack:</span>
                                        <input type="number" value={item.stackSize} onChange={(e) => handleLocalChange(item.id, 'stackSize', e.target.value)} onBlur={() => handleSave(item.id, 'stackSize')} className="w-14 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-sm" placeholder="20" disabled={!canEdit} />
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-textSecondary">{item.isAmmo ? 'Peso/Pack:' : 'Espaços:'}</span>
                                    <input type="number" value={item.spaces} onChange={(e) => handleLocalChange(item.id, 'spaces', e.target.value)} onBlur={() => handleSave(item.id, 'spaces')} className="w-14 p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center text-sm" placeholder="1" disabled={!canEdit} />
                                </div>

                                {/* Campo Específico de Munição */}
                                {item.isAmmo && (
                                    <div className="flex items-center gap-2 ml-auto border-l border-yellow-700/30 pl-4">
                                        <span className="text-xs text-yellow-500 font-bold">Ignora MD:</span>
                                        <input type="number" value={item.ignoreMD} onChange={(e) => handleLocalChange(item.id, 'ignoreMD', e.target.value)} onBlur={() => handleSave(item.id, 'ignoreMD')} className="w-14 p-1 bg-bgInput border border-yellow-700/50 rounded-md text-textPrimary text-center text-sm" placeholder="0" disabled={!canEdit} />
                                    </div>
                                )}
                            </div>

                            <AutoResizingTextarea
                                value={item.description}
                                onChange={(e) => handleLocalChange(item.id, 'description', e.target.value)}
                                onBlur={() => handleSave(item.id, 'description')}
                                placeholder="Descrição"
                                className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md mb-2"
                                disabled={!canEdit}
                            />
                            
                            {/* --- SEÇÃO DE EFEITOS --- */}
                            <div className="bg-bgInput/30 p-2 rounded-md mb-2 border border-bgElement">
                                <label className="text-xs font-bold text-textSecondary uppercase block mb-2">Efeitos & Bônus</label>
                                <div className="space-y-2">
                                    {(item.effects || []).map(effect => (
                                        <div key={effect.id} className="flex flex-wrap gap-2 items-center">
                                            <select 
                                                value={effect.type} 
                                                onChange={(e) => handleEffectChange(item.id, effect.id, 'type', e.target.value)}
                                                className="p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-xs"
                                                disabled={!canEdit}
                                            >
                                                <option value="attribute">Atributo</option>
                                                <option value="skill">Perícia</option>
                                                <option value="dice">Dados/Dano Extra</option>
                                            </select>

                                            {effect.type === 'dice' ? (
                                                <span className="flex-grow text-xs text-textSecondary italic text-center">Adiciona ao resultado</span>
                                            ) : (
                                                <select 
                                                    value={effect.target} 
                                                    onChange={(e) => handleEffectChange(item.id, effect.id, 'target', e.target.value)}
                                                    className="flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-xs min-w-[100px]"
                                                    disabled={!canEdit}
                                                >
                                                <option value="">Selecione...</option>
                                                {effect.type === 'attribute' 
                                                    ? (allAttributes || []).map(attr => <option key={attr} value={attr}>{attr}</option>)
                                                    : PREDEFINED_SKILLS.map(skill => <option key={skill.name} value={skill.name}>{skill.name}</option>)
                                                }
                                            </select>

                                            )}
                                            <div className="flex items-center">
                                                <input 
                                                    type={effect.type === 'dice' ? "text" : "number"}
                                                    value={effect.value} 
                                                    onChange={(e) => handleEffectChange(item.id, effect.id, 'value', e.target.value)}
                                                    className={`p-1 bg-bgInput border border-bgElement rounded-l-md text-textPrimary text-xs text-center appearance-none ${effect.type === 'dice' ? 'w-20' : 'w-12'}`}
                                                    placeholder="0"
                                                    disabled={!canEdit}
                                                />
                                                <div className="flex flex-col">
                                                    <button 
                                                        onClick={() => handleEffectChange(item.id, effect.id, 'value', (parseInt(effect.value) || 0) + 1)}
                                                        className="w-5 h-3.5 flex items-center justify-center bg-bgElement hover:bg-btnHighlightBg text-textPrimary text-[8px] rounded-tr-md border-t border-r border-bgInput"
                                                        disabled={!canEdit}
                                                        tabIndex="-1"
                                                    >▲</button>
                                                    <button 
                                                        onClick={() => handleEffectChange(item.id, effect.id, 'value', (parseInt(effect.value) || 0) - 1)}
                                                        className="w-5 h-3.5 flex items-center justify-center bg-bgElement hover:bg-btnHighlightBg text-textPrimary text-[8px] rounded-br-md border-b border-r border-bgInput"
                                                        disabled={!canEdit}
                                                        tabIndex="-1"
                                                    >▼</button>
                                                </div>
                                            </div>

                                            {canEdit && (
                                                <button onClick={() => handleRemoveEffect(item.id, effect.id)} className="text-red-500 hover:text-red-400 font-bold px-1">
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {canEdit && (
                                    <button onClick={() => handleAddEffect(item.id)} className="mt-2 text-xs text-btnHighlightBg hover:text-white font-bold">
                                        + Adicionar Efeito
                                    </button>
                                )}
                            </div>

                            <AutoResizingTextarea
                                value={item.attributes}
                                onChange={(e) => handleLocalChange(item.id, 'attributes', e.target.value)}
                                onBlur={() => handleSave(item.id, 'attributes')}
                                placeholder="Outras notas ou detalhes..."
                                className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-sm text-textPrimary"
                                disabled={!canEdit}
                            />
                            {canEdit && (
                                <div className="flex justify-end mt-2 pt-2 border-t border-bgInput/50">
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                                        title="Remover Item"
                                    ><span role="img" aria-label="Remover" className="text-xl">🗑️</span></button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {(localEquippedItems || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhum equipamento.</p>}
            {canEdit && (
                <div className="flex justify-center gap-4 mt-4">
                    <button onClick={() => handleAddItem('equipment')} className="px-4 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg shadow-lg flex items-center gap-2">+ Equipamento</button>
                    <button onClick={() => handleAddItem('ammo')} className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">+ Munição</button>
                </div>
            )}
        </SheetSkin>
    );
};

// --- Sub-componente para Habilidades ---
const SkillsList = ({ character, isMaster, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const [localAbilities, setLocalAbilities] = useState(character.abilities || []);

    useEffect(() => {
        setLocalAbilities(character.abilities || []);
    }, [character.abilities]);

    const handleAddAbility = () => onUpdate('abilities', [...(character.abilities || []), { id: crypto.randomUUID(), title: '', description: '', isCollapsed: false }]);
    const handleRemoveAbility = (id) => onUpdate('abilities', (character.abilities || []).filter(a => a.id !== id));

    const handleLocalChange = (id, field, value) => {
        setLocalAbilities(prevAbilities => prevAbilities.map(ability => (ability.id === id ? { ...ability, [field]: value } : ability)));
    };

    const handleSave = useCallback((id, field) => {
        const localAbility = localAbilities.find(a => a.id === id);
        const originalAbility = (character.abilities || []).find(a => a.id === id);
        if (localAbility && originalAbility && localAbility[field] !== originalAbility[field]) {
            onUpdate('abilities', (character.abilities || []).map(a => (a.id === id ? { ...a, [field]: localAbility[field] } : a)));
        }
    }, [localAbilities, character.abilities, onUpdate]);

    const toggleItemCollapsed = (id) => onUpdate('abilities', (character.abilities || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

    return (
        <SheetSkin title="Habilidades" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(localAbilities || []).map(ability => {
                    const isAbilityCollapsed = ability.isCollapsed !== false;
                    return isAbilityCollapsed ? (
                        <div key={ability.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(ability.id)}>{ability.title || 'Habilidade Sem Título'}</span>                            
                            <button onClick={() => onShowDiscord(ability.title, ability.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-2">Mostrar no Feed</button>
                        </div>
                    ) : (
                        <div key={ability.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(ability.id)}>{ability.title || 'Habilidade Sem Título'}</span>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                    <button onClick={() => onShowDiscord(ability.title, ability.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap">Mostrar no Feed</button>
                                    <span className="text-textSecondary text-xs whitespace-nowrap cursor-pointer" onClick={() => toggleItemCollapsed(ability.id)}>Recolher ▲</span>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={ability.title}
                                onChange={(e) => handleLocalChange(ability.id, 'title', e.target.value)}
                                onBlur={() => handleSave(ability.id, 'title')}
                                className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2"
                                placeholder="Título"
                                disabled={!canEdit}
                            />
                            <AutoResizingTextarea
                                value={ability.description}
                                onChange={(e) => handleLocalChange(ability.id, 'description', e.target.value)}
                                onBlur={() => handleSave(ability.id, 'description')}
                                placeholder="Descrição"
                                className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md"
                                disabled={!canEdit}
                            />
                            {canEdit && (
                                <div className="flex justify-end mt-2 pt-2 border-t border-bgInput/50">
                                    <button 
                                        onClick={() => handleRemoveAbility(ability.id)}
                                        className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                                        title="Remover Habilidade"
                                    ><span role="img" aria-label="Remover" className="text-xl">🗑️</span></button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {(localAbilities || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhuma habilidade adicionada.</p>}
            {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddAbility} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
        </SheetSkin>
    );
};

// --- Sub-componente para Vantagens/Desvantagens ---
const PerksList = ({ character, onUpdate, isCollapsed, toggleSection, onShowDiscord }) => {
    const canEdit = true;
    const handleAddPerk = (type) => onUpdate(type, [...(character[type] || []), { id: crypto.randomUUID(), name: '', description: '', origin: { class: false, race: false, manual: true }, value: 0, isCollapsed: false }]);
    const handleRemovePerk = (type, id) => onUpdate(type, (character[type] || []).filter(p => p.id !== id));
    const handlePerkOriginChange = (type, id, originType) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, origin: { ...p.origin, [originType]: !p.origin[originType] } } : p));
    const handlePerkUpdate = (type, id, field, value) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, [field]: value } : p));
    const toggleItemCollapsed = (type, id) => onUpdate(type, (character[type] || []).map(p => p.id === id ? { ...p, isCollapsed: !p.isCollapsed } : p));

    return (
        <SheetSkin title="Vantagens e Desvantagens" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xl font-semibold text-textAccent/80 mb-3 border-b border-borderAccent/50 pb-1">Vantagens</h3>
                    <div className="space-y-2">
                        {(character.advantages || []).map(perk => <PerkItem key={perk.id} perk={perk} type="advantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkUpdate} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={onShowDiscord} />)}
                        {canEdit && <div className="flex justify-end mt-4"><button onClick={() => handleAddPerk('advantages')} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-textAccent/80 mb-3 border-b border-borderAccent/50 pb-1">Desvantagens</h3>
                    <div className="space-y-2">
                        {(character.disadvantages || []).map(perk => <PerkItem key={perk.id} perk={perk} type="disadvantages" canEdit={canEdit} onRemove={handleRemovePerk} onChange={handlePerkUpdate} onOriginChange={handlePerkOriginChange} onToggleCollapse={toggleItemCollapsed} onShowDiscord={onShowDiscord} />)}
                        {canEdit && <div className="flex justify-end mt-4"><button onClick={() => handleAddPerk('disadvantages')} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
                    </div>
                </div>
            </div>
        </SheetSkin>
    );
};

const PerkItem = ({ perk, type, canEdit, onRemove, onChange, onOriginChange, onToggleCollapse, onShowDiscord }) => {
    const [localPerk, setLocalPerk] = useState(perk);

    useEffect(() => {
        setLocalPerk(perk);
    }, [perk.id]);

    const handleLocalChange = (e) => {
        const { name, value, type: inputType } = e.target;
        const parsedValue = inputType === 'number' ? parseInt(value, 10) || 0 : value;
        setLocalPerk(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSave = useCallback((field) => {
        if (localPerk[field] !== perk[field]) {
            onChange(type, localPerk.id, field, localPerk[field]);
        }
    }, [localPerk, perk, type, onChange]);

    return (
        <div className="flex flex-col p-3 bg-bgElement rounded-md shadow-sm">
            <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => onToggleCollapse(type, perk.id)}>{localPerk.name || 'Sem Nome'} {perk.isCollapsed ? '...' : ''}</span>
                <button onClick={() => onShowDiscord(localPerk.name, localPerk.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-2">Mostrar no Feed</button>
            </div>
            {!perk.isCollapsed && (<>
                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="text"
                        name="name" // O nome do campo corresponde ao estado
                        value={localPerk.name}
                        onChange={handleLocalChange}
                        onBlur={() => handleSave('name')}
                        className="font-semibold text-lg flex-grow p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                        placeholder="Nome"
                        disabled={!canEdit}
                    />
                    <input
                        type="number"
                        name="value" // O nome do campo corresponde ao estado
                        value={localPerk.value === 0 ? '' : localPerk.value}
                        onChange={handleLocalChange}
                        onBlur={() => handleSave('value')}
                        className="w-12 p-1 bg-bgInput border border-bgElement rounded-md text-center text-textPrimary"
                        placeholder="Valor"
                        disabled={!canEdit}
                    />
                </div>
                <AutoResizingTextarea
                    name="description" // O nome do campo corresponde ao estado
                    value={localPerk.description}
                    onChange={handleLocalChange}
                    onBlur={() => handleSave('description')}
                    placeholder="Descrição"
                    className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md"
                    disabled={!canEdit}
                />
                <div className="flex gap-3 text-sm text-textSecondary mt-2">
                    {['class', 'race', 'manual'].map(originType => (
                        <label key={originType} className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={perk.origin?.[originType] || false}
                                onChange={() => onOriginChange(type, perk.id, originType)}
                                className="form-checkbox text-btnHighlightBg rounded"
                                disabled={!canEdit}
                            />
                            {originType.charAt(0).toUpperCase() + originType.slice(1)}
                        </label>
                    ))}
                </div>
                {canEdit && (
                    <div className="flex justify-end mt-2 pt-2 border-t border-bgInput/50">
                        <button 
                            onClick={() => onRemove(type, perk.id)}
                            className="p-2 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white"
                            title={`Remover ${type === 'advantages' ? 'Vantagem' : 'Desvantagem'}`}
                        ><span role="img" aria-label="Remover" className="text-xl">🗑️</span></button>
                    </div>
                )}
            </>)}
        </div>
    );
};

// Exporta cada componente individualmente para que o CharacterSheet possa controlá-los
export { InventoryList, EquippedItemsList, SkillsList, PerksList };

// eu acho ridiculo que a porra do inventario tem o maior código do aplicativo inteiro
//
//
//
// tive que adicionar mais linhas para completar 1000
// src/systems/storycraft/ListSections.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import SheetSkin from './SheetSkin';

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
        <div className="mt-6 p-4 bg-bgInput rounded-lg border border-bgElement">
            <div className="flex flex-wrap justify-between items-center gap-4">
                {/* O display das moedas */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 items-center">
                    <h4 className="text-xl font-semibold text-textAccent mr-2">Carteira</h4>
                    
                    {/* 3. Mapeia APENAS a lista que decidimos exibir */}
                    {tiersToDisplay.map(tier => (
                        <div key={tier.name} className="flex items-baseline" title={`Florim de ${tier.name}`}>
                            {/* Busca o valor (que será 0 no caso padrão "0 FB") */}
                            <span className={`font-bold text-lg ${tier.color}`}>{wallet?.[tier.name] || 0}</span>
                            <span className="text-sm text-textSecondary ml-1">F{tier.name[0]}</span>
                        </div>
                    ))}
                </div>

                {/* Controles e Peso */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 ml-auto">
                    <span className="text-sm text-textSecondary whitespace-nowrap text-right">
                        Peso Moedas: {
                            totalWeight >= 1000
                                ? `${(totalWeight / 1000).toFixed(2)}kg`
                                : `${totalWeight}g`
                        }
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
                "Isso é dinheiro de Mosquete (500 FO)! Vai começar uma guerra?",
                "Você podia comprar um Grifo (1.500 FO) e sair voando por aí!",
                "Cheiro de equipamento novo no ar. Que tal uma Couraça (500 FO)?",
            ]);
        }
        if (goldValue < 10000) {
            return pickRandom([
                "Você podia comprar um DRAGÃO JOVEM (5.000 FO)?! Que nível é essa campanha?!",
                "Tá na hora de comprar um Encantamento Lendário (5.000 FO), hein?",
                "Com essa grana, você podia ajudar uns camponeses. Ou comprar uma Poção Rúnica de Cura (3.000 FO).",
            ]);
        }
        // Mais de 10000 Ouro
        return pickRandom([
            "Você tem dinheiro pra um Encantamento Titânico (20.000 FO)?!",
            "Você é o 1% da cidade. Parabéns, seu capitalista.",
            "Já pensou em comprar um Navio Voador (30.000 FO)? Só digo isso.",
        ]);
    };

    // --- 2. PROVOCAÇÕES DE PESO (baseado no peso em gramas) ---
    const getWeightFact = (grams) => {
        const weightInGrams = grams;
        if (weightInGrams <= 0) {
            return pickRandom([
                "Leve como uma pena. Sua bolsa de moedas está vazia.",
                "Sua bolsa está tão leve que podia flutuar.",
                "Peso 0g. Você está usando... crédito por acaso?"
            ]);
        }
        if (weightInGrams < 100) {
            return pickRandom([
                "Alguns trocados no bolso. Você nem sente o peso.",
                "Trocadinhos. Nem faz volume.",
            ]);
        }
        if (weightInGrams < 500) { // Menos de 0.5kg
            return pickRandom([
                "Já dá pra fazer 'jingle jingle'. Começando a ficar divertido.",
                "Isso é o peso de uma Adaga (0,5 kg).",
            ]);
        }
        if (weightInGrams < 1000) { // Menos de 1kg
            return pickRandom([
                "Quase 1kg de metal. Sua bolsa está começando a pesar no cinto.",
                "Isso é o peso de uma Espada Curta (1 kg).",
                "Peso de uma garrafa de vinho. Prioridades, eu entendo.",
            ]);
        }
        if (weightInGrams < 2500) { // 1kg - 2.5kg
            return pickRandom([
                "Isso é o peso de um abacaxi! 🍍",
                "Você está carregando uma Espada Longa (1,5 kg) só em moedas.",
                "Sua bolsa de moedas virou uma arma de arremesso."
            ]);
        }
        if (weightInGrams < 5000) { // 2.5kg - 5kg
            return pickRandom([
                "Você está carregando o peso de um gato doméstico gordo em moedas! 🐈",
                "Você é um cofrinho humano.",
                "Isso é mais pesado que uma Besta Pesada (4,5 kg)!",
            ]);
        }
        if (weightInGrams < 10000) { // 5kg - 10kg
            return pickRandom([
                "Isso é o peso de uma bola de boliche! 🎳 Você está maluco?",
                "Qualquer um pode te ouvir chegando a um quilômetro de distância.",
                "Isso é o peso de uma Armadura de Couro (5 kg) inteira!",
            ]);
        }
         // Mais de 10kg
        return pickRandom([
            "Mais de 10kg! Você está carregando o peso de um cachorro pequeno! 🐶",
            "Você não é um aventureiro, é uma mula de carga. Vá a um banco!",
            "Você está carregando o peso de uma Tenda Grande (10 kg) em moedas.",
        ]);
    };

    const weightInGrams = totalCoinWeight;
    // Pega emprestada a lógica de g/kg do CompactWallet
    const weightDisplay = weightInGrams >= 1000
        ? `${(weightInGrams / 1000).toFixed(2)}kg`
        : `${weightInGrams}g`;

    return (
        // Este card vai ocupar 2 colunas no grid, ao lado do Etherium
        <div className="flex flex-col p-3 bg-bgElement rounded-md md:col-span-2 lg:col-span-2 gap-3">
            
            {/* --- SEÇÃO DO VALOR TOTAL --- */}
            <div className="border-b border-bgInput pb-2">
                <h5 className="text-sm font-bold text-textSecondary uppercase">Valor Total Consolidado</h5>
                <span className="font-bold text-2xl text-yellow-400">{totalGoldValue.toFixed(2)}</span>
                <span className="text-lg text-yellow-500 ml-1">FO (em Ouro)</span>
            </div>

            {/* --- SEÇÃO DAS FUN FACTS --- */}
            <div>
                <h5 className="text-sm font-bold text-textSecondary uppercase">Oráculo da Riqueza</h5>
                <p className="text-textPrimary italic">"{getValueFact(totalGoldValue)}"</p>
            </div>
            <div>
                <h5 className="text-sm font-bold text-textSecondary uppercase">Balança da Verdade ({weightDisplay})</h5>
                <p className="text-textPrimary italic">"{getWeightFact(weightInGrams)}"</p>
            </div>
        </div>
    );
};

// --- Constante das Moedas ---
const CURRENCY_TIERS = [
    { name: 'Bronze', color: 'text-yellow-600', value: 1 },
    { name: 'Prata', color: 'text-gray-400', value: 10 },
    { name: 'Ouro', color: 'text-yellow-400', value: 100 },
    { name: 'Platina', color: 'text-blue-300', value: 1000 },
    { name: 'Rubi', color: 'text-red-500', value: 10000 },
    { name: 'Diamante', color: 'text-cyan-400', value: 100000 },
    { name: 'Etherium', color: 'text-purple-400', value: 1000000 },
];

// --- Componente da Carteira de Florins (Gerenciamento) ---
const FlorinWallet = ({ wallet, onUpdate, canEdit, onClose, totalCoinWeight }) => {
    const [amounts, setAmounts] = useState({});

    // Calcula o valor total de todas as moedas, convertido para Ouro
    const totalGoldValue = useMemo(() => {
        // Encontra o valor base do Ouro (que é 100)
        const goldTierValue = CURRENCY_TIERS.find(t => t.name === 'Ouro')?.value || 100;
        
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

        // Convertendo para cima (ex: 10 Bronze -> 1 Prata)
        if (fromTier.value < toTier.value) {
            const fromAmount = currentWallet[fromTier.name] || 0;
            if (fromAmount >= 10) {
                const newFromAmount = fromAmount - 10;
                const toAmount = (currentWallet[toTier.name] || 0) + 1;
                onUpdate('wallet', { ...currentWallet, [fromTier.name]: newFromAmount, [toTier.name]: toAmount });
            }
        }
        // Convertendo para baixo (ex: 1 Prata -> 10 Bronze)
        else {
            const fromAmount = currentWallet[fromTier.name] || 0;
            if (fromAmount >= 1) {
                const newFromAmount = fromAmount - 1;
                const toAmount = (currentWallet[toTier.name] || 0) + 10;
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
                {CURRENCY_TIERS.map((tier, index) => (
                    // Card da moeda (sem o col-span no último item)
                    <div key={tier.name} className={`flex flex-col p-2 bg-bgElement rounded-md`}>
                        <span className={`font-bold text-lg ${tier.color}`}>Florim de {tier.name}: {wallet?.[tier.name] || 0}</span>
                        
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
                            {index > 0 && (
                                <button 
                                    onClick={() => handleConvert(index, index - 1)}
                                    className="text-gray-400 hover:text-white disabled:opacity-50 font-mono"
                                    title={`Converter 1 ${tier.name} para 10 ${CURRENCY_TIERS[index - 1].name}`}
                                    disabled={!canEdit}
                                >
                                    1 🡒 10
                                </button>
                            )}
                            {index < CURRENCY_TIERS.length - 1 && (
                                <button 
                                    onClick={() => handleConvert(index, index + 1)}
                                    className="text-gray-400 hover:text-white ml-auto disabled:opacity-50 font-mono"
                                    title={`Converter 10 ${tier.name} para 1 ${CURRENCY_TIERS[index + 1].name}`}
                                    disabled={!canEdit}
                                >
                                    10 🡒 1
                                </button>
                            )}
                        </div>
                    </div>
                ))}

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
const InventoryList = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, onShowDiscord, isEditMode }) => {
    const { user } = useAuth();
    // A permissão de edição geral (dono da ficha ou mestre)
    const canEdit = user.uid === character.ownerUid || isMaster;

    // Estado local para os itens do inventário
    const [localInventory, setLocalInventory] = useState(character.inventory || []);
    // --- NOVO ESTADO PARA CONTROLAR A CARTEIRA ---
    const [isWalletOpen, setIsWalletOpen] = useState(false);

    const totalCoinWeight = useMemo(() => {
        const totalCoins = CURRENCY_TIERS.reduce((sum, tier) => sum + (character.wallet?.[tier.name] || 0), 0);
        return totalCoins * 5; // 5 gramas por moeda
    }, [character.wallet]);

    // Sincroniza o estado local com o estado da ficha pai
    useEffect(() => {
        setLocalInventory(character.inventory || []);
    }, [character.inventory]);

    const handleAddItem = () => onUpdate('inventory', [...(character.inventory || []), { id: crypto.randomUUID(), name: '', description: '', isCollapsed: false }]);
    const handleRemoveItem = (id) => onUpdate('inventory', (character.inventory || []).filter(item => item.id !== id));

    const handleLocalChange = (id, field, value) => {
        setLocalInventory(prevInventory => prevInventory.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSave = useCallback((id, field) => {
        const localItem = localInventory.find(item => item.id === id);
        const originalItem = (character.inventory || []).find(item => item.id === id);

        if (localItem && originalItem && localItem[field] !== originalItem[field]) {
            onUpdate('inventory', (character.inventory || []).map(item => item.id === id ? { ...item, [field]: localItem[field] } : item));
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
            
            {/* Grid de Itens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                {(localInventory || []).map(item => {
                    const isItemCollapsed = item.isCollapsed !== false;
                    return isItemCollapsed ? (
                        <div key={item.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                            <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-2">Mostrar no Feed</button>
                        </div>
                    ) : (
                        <div key={item.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm border border-bgInput">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>                                
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-4">Mostrar no Feed</button>
                            </div>
                            <span className="text-textSecondary text-xs whitespace-nowrap cursor-pointer self-end" onClick={() => toggleItemCollapsed(item.id)}>Recolher ▲</span>
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleLocalChange(item.id, 'name', e.target.value)}
                                onBlur={() => handleSave(item.id, 'name')}
                                className="font-semibold text-lg w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary mb-2"
                                placeholder="Nome do Item"
                                disabled={!canEdit}
                            />
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
            {/* O botão de adicionar item só aparece se puder editar E estiver em modo de edição */}
            {canEdit && isEditMode && <div className="flex justify-center mt-4"><button onClick={handleAddItem} className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-full shadow-lg flex items-center justify-center">+</button></div>}
        </SheetSkin>
    );
};

// --- Sub-componente para Itens Equipados ---
const EquippedItemsList = ({ character, isMaster, onUpdate, onShowDiscord, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    const [localEquippedItems, setLocalEquippedItems] = useState(character.equippedItems || []);

    useEffect(() => {
        setLocalEquippedItems(character.equippedItems || []);
    }, [character.equippedItems]);

    const handleAddItem = () => onUpdate('equippedItems', [...(character.equippedItems || []), { id: crypto.randomUUID(), name: '', description: '', attributes: '', isCollapsed: false }]);
    const handleRemoveItem = (id) => onUpdate('equippedItems', (character.equippedItems || []).filter(i => i.id !== id));

    const handleLocalChange = (id, field, value) => {
        setLocalEquippedItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const handleSave = useCallback((id, field) => {
        const localItem = localEquippedItems.find(item => item.id === id);
        const originalItem = (character.equippedItems || []).find(item => item.id === id);
        if (localItem && originalItem && localItem[field] !== originalItem[field]) {
            onUpdate('equippedItems', (character.equippedItems || []).map(i => (i.id === id ? { ...i, [field]: localItem[field] } : i)));
        }
    }, [localEquippedItems, character.equippedItems, onUpdate]);

    const toggleItemCollapsed = (id) => onUpdate('equippedItems', (character.equippedItems || []).map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));

    return (
        <SheetSkin title="Itens Equipados" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(localEquippedItems || []).map(item => {
                    const isItemCollapsed = item.isCollapsed !== false;
                    return isItemCollapsed ? (
                        <div key={item.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex justify-between items-center">
                            <span className="font-semibold text-lg cursor-pointer text-textPrimary flex-grow truncate" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                            <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-2">Mostrar no Feed</button>
                        </div>
                    ) : (
                        <div key={item.id} className="col-span-1 sm:grid-cols-2 lg:col-span-3 flex flex-col p-3 bg-bgElement rounded-md shadow-sm border border-bgInput">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-lg w-full cursor-pointer text-textPrimary" onClick={() => toggleItemCollapsed(item.id)}>{item.name || 'Item Sem Nome'}</span>
                                <button onClick={() => onShowDiscord(item.name, item.description)} title="Mostrar no Feed" className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-sm font-bold rounded-md whitespace-nowrap ml-4">Mostrar no Feed</button>
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
                            <AutoResizingTextarea
                                value={item.description}
                                onChange={(e) => handleLocalChange(item.id, 'description', e.target.value)}
                                onBlur={() => handleSave(item.id, 'description')}
                                placeholder="Descrição"
                                className="text-sm text-textSecondary italic w-full p-1 bg-bgInput border border-bgElement rounded-md mb-2"
                                disabled={!canEdit}
                            />
                            <AutoResizingTextarea
                                value={item.attributes}
                                onChange={(e) => handleLocalChange(item.id, 'attributes', e.target.value)}
                                onBlur={() => handleSave(item.id, 'attributes')}
                                placeholder="Atributos/Efeitos"
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
            {(localEquippedItems || []).length === 0 && <p className="text-textSecondary italic mt-4">Nenhum item equipado.</p>}
            {canEdit && <div className="flex justify-center mt-4"><button onClick={handleAddItem} className="w-10 h-10 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText text-2xl font-bold rounded-full shadow-lg">+</button></div>}
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
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks';
import SheetSkin from './SheetSkin';

// --- Novo Sub-componente: ImageUrlModal ---
const ImageUrlModal = ({ initialValue, onConfirm, onCancel }) => {
    const [url, setUrl] = useState(initialValue);

    const handleConfirm = () => {
        onConfirm(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-bgSurface p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold text-textPrimary mb-4">URL da Imagem do Personagem</h3>
                <p className="text-textSecondary mb-4">Cole a nova URL da imagem abaixo:</p>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary focus:ring-btnHighlightBg focus:border-btnHighlightBg"
                    placeholder="https://exemplo.com/imagem.png"
                    autoFocus
                />
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- O restante do seu código começa aqui ---


// --- Sub-componente: CharacterInfo ---
const CharacterInfo = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, isEditMode }) => {
    const { user } = useAuth();
    const canEdit = user && (user.uid === character.ownerUid || isMaster);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [localFields, setLocalFields] = useState({
        name: character.name || '',
        age: character.age || '',
        height: character.height || '',
        gender: character.gender || '',
        race: character.race || '',
        class: character.class || '',
        alignment: character.alignment || '',
        level: character.level || '',
        xp: character.xp || '',
    });

    useEffect(() => {
        setLocalFields({
            name: character.name || '',
            age: character.age || '',
            height: character.height || '',
            gender: character.gender || '',
            race: character.race || '',
            class: character.class || '',
            alignment: character.alignment || '',
            level: character.level || '',
            xp: character.xp || '',
        });
    }, [character]);

    // Helper function to determine Power Scale based on character level
    const getPowerScale = (level) => {
        level = parseInt(level, 10);
        if (isNaN(level) || level < 1) {
            return { scale: 'N/A', category: 'Desconhecida' };
        }

        if (level >= 1 && level <= 10) return { scale: 0, category: 'Comum' };
        if (level >= 11 && level <= 20) return { scale: 1, category: 'Lendário 1' };
        if (level >= 21 && level <= 30) return { scale: 2, category: 'Lendário 2' };
        if (level >= 31 && level <= 40) return { scale: 3, category: 'Lendário 3' };
        if (level >= 41 && level <= 45) return { scale: 4, category: 'Colossal 1' };
        if (level >= 46 && level <= 50) return { scale: 5, category: 'Colossal 2' };
        if (level >= 51 && level <= 55) return { scale: 6, category: 'Colossal 3' };
        if (level >= 56 && level <= 59) return { scale: 7, category: 'Titânico 1' };
        if (level === 60) return { scale: 8, category: 'Divino' };

        return { scale: 'N/A', category: 'Além do Divino' }; // For levels beyond 60 or other edge cases
    };

    const { scale, category } = useMemo(() => getPowerScale(character.level), [character.level]);

    const handleLocalChange = (e) => {
        const { name, value } = e.target;
        setLocalFields(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = useCallback((fieldName) => {
        const localValue = localFields[fieldName];
        const originalValue = character[fieldName];
        const isNumeric = ['age', 'level', 'xp'].includes(fieldName);
        const finalValue = isNumeric ? parseInt(localValue, 10) || 0 : localValue;

        if (finalValue !== originalValue) {
            onUpdate(fieldName, finalValue);
        }
    }, [localFields, character, onUpdate]);

    const handlePhotoClick = () => {
        if (canEdit && isEditMode) {
            setIsModalOpen(true);
        }
    };

    const handleConfirmModal = (newUrl) => {
        if (newUrl !== null && newUrl !== character.photoUrl) {
            onUpdate('photoUrl', newUrl);
        }
        setIsModalOpen(false);
    };

    const fieldOrder = ['name', 'age', 'height', 'gender', 'race', 'class', 'alignment', 'level', 'xp'];
    
    return (
        <SheetSkin title="Informações do Personagem" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            {isModalOpen && (
                <ImageUrlModal
                    initialValue={character.photoUrl || ""}
                    onConfirm={handleConfirmModal}
                    onCancel={() => setIsModalOpen(false)}
                />
            )}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex-shrink-0 flex flex-col items-center">
                    <div className={`rounded-full border-2 border-btnHighlightBg ${canEdit && isEditMode ? 'cursor-pointer' : ''}`} onClick={handlePhotoClick}>
                        {character.photoUrl ? (
                            <img src={character.photoUrl} alt="Foto" className="w-48 h-48 object-cover rounded-full" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/192x192/1f2937/FFFFFF?text=Erro'; }} />
                        ) : (
                            <div className="w-48 h-48 bg-bgElement rounded-full flex items-center justify-center text-6xl text-textSecondary">+</div>
                        )}
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-sm font-medium text-textSecondary">Escala de Poder:</p>
                        <p className="text-lg font-bold text-textPrimary">{category}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow w-full">
                    {fieldOrder.map(field => (
                        <div key={field}>
                            <label htmlFor={field} className="block text-sm font-medium text-textSecondary mb-1 capitalize">{field}:</label>
                            <input
                                type={['age', 'level', 'xp'].includes(field) ? 'number' : 'text'}
                                id={field} name={field}
                                value={localFields[field]}
                                onChange={handleLocalChange}
                                onBlur={() => handleSave(field)}
                                className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary focus:ring-btnHighlightBg focus:border-btnHighlightBg"
                                disabled={!canEdit || (!isEditMode && ['race', 'class', 'alignment'].includes(field))}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </SheetSkin>
    );
};

// --- Sub-componente: MainAttributes ---
const MainAttributes = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, buffModifiers, isEditMode, onAttributeRoll }) => {
    const { user } = useAuth();
    const canEdit = user && (user.uid === character.ownerUid || isMaster);
    const canEditGeneral = user && (user.uid === character.ownerUid || isMaster);
    
    const [localMainAttributes, setLocalMainAttributes] = useState(character.mainAttributes || { hp: {}, mp: {} });

    useEffect(() => {
        setLocalMainAttributes(character.mainAttributes || { hp: {}, mp: {} });
    }, [character.mainAttributes]);

    const calculateTotal = (base, key) => (parseInt(base, 10) || 0) + ((buffModifiers && buffModifiers[key]) || 0);

    const dexterityValue = useMemo(() => {
        return calculateTotal(localMainAttributes?.destreza, 'Destreza');
    }, [localMainAttributes?.destreza, buffModifiers]);

    const constitutionValue = useMemo(() => {
        return calculateTotal(localMainAttributes?.constituicao, 'Constituição');
    }, [localMainAttributes?.constituicao, buffModifiers]);

    const mdBaseValue = (parseInt(localMainAttributes?.fd, 10) || 0);

    const handleLocalChange = (e, attributeKey) => {
        const { name, value } = e.target;
        const parsedValue = value === '' ? '' : parseInt(value, 10);
 
        setLocalMainAttributes(prev => {
            // Se attributeKey for 'fd', estamos editando o campo MD, que salva em 'fd'
            if (attributeKey === 'fd') {
                return { ...prev, fd: parsedValue };
            } else if (attributeKey) { // Para 'hp', 'mp'
                return { ...prev, [attributeKey]: { ...(prev[attributeKey] || {}), [name]: parsedValue } };
            }
            return { ...prev, [name]: parsedValue };
        });
    };

    const handleSave = useCallback((name, attributeKey) => {
        if (!character) return; 

        const currentMainAttributes = character.mainAttributes || {};
        
        if (attributeKey) { // Para 'hp', 'mp'
            const localValue = localMainAttributes?.[attributeKey]?.[name];
            const originalAttribute = currentMainAttributes[attributeKey] || {};
            const originalValue = originalAttribute[name];
            const finalValue = parseInt(localValue, 10) || 0;

            if (finalValue !== (originalValue || 0)) {
                const updatedAttribute = { ...originalAttribute, [name]: finalValue };
                const newMainAttributes = { ...currentMainAttributes, [attributeKey]: updatedAttribute };
                onUpdate('mainAttributes', newMainAttributes);
            }
        } else { // Para 'fa', 'fm', 'fd'
            const localDirectValue = localMainAttributes?.[name];
            const originalDirectValue = currentMainAttributes[name];
            const finalDirectValue = parseInt(localDirectValue, 10) || 0;

            if (finalDirectValue !== (originalDirectValue || 0)) {
                const updatedMainAttributes = { 
                    ...currentMainAttributes, 
                    [name]: finalDirectValue };
                onUpdate('mainAttributes', updatedMainAttributes);
            }
        }
    }, [localMainAttributes, character, onUpdate]); 

    return (
        <SheetSkin title="Atributos" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="space-y-6">
                
                {/* --- LAYOUT HP/MP CORRIGIDO --- */}
                {/* Corrigido de lg:grid-cols-3 para sm:grid-cols-2 para evitar coluna vazia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Bloco de HP */}
                    <div className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                        <label className="text-lg font-medium text-textSecondary mb-1 uppercase">HP</label>
                        <div className="flex items-center gap-1">
                            <input type="number" name="current" value={localMainAttributes.hp?.current ?? ''} onChange={(e) => handleLocalChange(e, 'hp')} onBlur={() => handleSave('current', 'hp')} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold cursor-not-allowed" disabled={true} />
                            <span className="text-textSecondary">/</span>
                            <input type="number" name="max" value={localMainAttributes.hp?.max ?? ''} onChange={(e) => handleLocalChange(e, 'hp')} onBlur={() => handleSave('max', 'hp')} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!isMaster} />
                            <span className="text-blue-400 font-bold text-xl ml-1">+</span>
                            <input type="number" title="HP Temporário" name="temp" value={localMainAttributes.hp?.temp ?? ''} onChange={(e) => handleLocalChange(e, 'hp')} onBlur={() => handleSave('temp', 'hp')} className="w-16 p-2 text-center bg-bgInput border border-blue-400 rounded-md text-blue-300 text-xl font-bold cursor-not-allowed" disabled={true} />
                        </div>
                    </div>
                    {/* Bloco de MP */}
                    <div className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                        <label className="text-lg font-medium text-textSecondary mb-1 uppercase">MP</label>
                        <div className="flex items-center gap-2">
                            <input type="number" name="current" value={localMainAttributes.mp?.current ?? ''} onChange={(e) => handleLocalChange(e, 'mp')} onBlur={() => handleSave('current', 'mp')} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold cursor-not-allowed" disabled={true} />
                            <span className="text-textSecondary">/</span>
                            <input type="number" name="max" value={localMainAttributes.mp?.max ?? ''} onChange={(e) => handleLocalChange(e, 'mp')} onBlur={() => handleSave('max', 'mp')} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!isMaster} />
                        </div>
                    </div>
                </div>

                {/* --- NOVO LAYOUT "EMPILHADO" PARA ATRIBUTOS --- */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {['Força', 'Destreza', 'Constituição', 'Inteligencia', 'Sabedoria', 'Carisma'].map(key => {
                            const lowerKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // forca, constituicao, etc.
                            const baseValue = localMainAttributes?.[lowerKey] ?? '';
                            const total = calculateTotal(baseValue, key);

                            return (
                                <div key={key} className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                                    {/* O 'total' vem primeiro e é o destaque */}
                                    <span 
                                        className="text-4xl font-bold text-textPrimary cursor-pointer hover:text-btnHighlightBg"
                                        onClick={() => onAttributeRoll(key, total)}
                                        title={`Clique para rolar ${key} (Valor: ${total})`}
                                    >
                                        {total}
                                    </span>
                                    
                                    {/* O 'input base' vem abaixo e é menor */}
                                    <input
                                        type="number"
                                        id={key}
                                        name={lowerKey}
                                        value={baseValue}
                                        onChange={handleLocalChange}
D                                     onBlur={() => handleSave(lowerKey)}
                                        className="w-16 p-1 text-center bg-bgInput border border-bgElement rounded-md text-textSecondary text-lg"
                                        disabled={!canEditGeneral}
                                        aria-label={`${key} Base`}
                                    />

                                    {/* O 'label' vem por último */}
                                    <label 
                                        htmlFor={key} 
                                        className="uppercase font-bold text-sm text-textSecondary mt-1"
                                    >
                                        {key}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                
                {/* --- NOVO LAYOUT "EMPILHADO" APLICADO AQUI TAMBÉM --- */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {['Iniciativa', 'FA', 'FM', 'MD', 'Acerto', 'ME'].map(key => {
                            const lowerKey = key.toLowerCase(); // iniciativa, fa, fm...
                            const isCalculated = false; 
                            let baseValue, total;

                            if (key === 'Iniciativa') {
                                baseValue = localMainAttributes?.[lowerKey] ?? '';
                                const initiativeBonus = parseInt(baseValue, 10) || 0;
                                total = initiativeBonus + dexterityValue + (buffModifiers['Iniciativa'] || 0);
                            } else if (key === 'MD') {
                                baseValue = localMainAttributes?.fd ?? '';
                                total = (parseInt(baseValue, 10) || 0) + constitutionValue + (buffModifiers['MD'] || 0);
                            } else {
                                baseValue = localMainAttributes?.[lowerKey] ?? '';
                                total = calculateTotal(localMainAttributes?.[lowerKey] || 0, key.toUpperCase());
                            }
                            
                            return (
                                <div key={key} className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                                    {/* Total (o número grande) */}
                                    <span 
                                        className="text-4xl font-bold text-textPrimary cursor-pointer hover:text-btnHighlightBg"
                                        onClick={() => onAttributeRoll(key, total)}
                                        title={`Clique para rolar ${key} (Valor: ${total})`}
                                  _ >
                                        {total}
                                    </span>

                                    {/* Input Base (o número pequeno) ou Span se for calculado */}
                                    {isCalculated ? (
                                        <span 
                                            className="w-16 p-1 text-center bg-bgInput border border-bgElement rounded-md text-textSecondary text-lg"
a                                         ria-label={`${key} Base`}
                                        >
                                            {baseValue}
                                        </span>
                                    ) : (
                                        <input
                                            type="number"
                                            id={key}
                                            name={lowerKey}
                                            value={baseValue}
                                            onChange={e => handleLocalChange(e, key === 'MD' ? 'fd' : undefined)}
              _                             onBlur={() => handleSave(key === 'MD' ? 'fd' : lowerKey)}
                                            className="w-16 p-1 text-center bg-bgInput border border-bgElement rounded-md text-textSecondary text-lg"
                                         disabled={!canEditGeneral}
                                            aria-label={`${key} Base`}
                                        />
                                    )}

                                    {/* Label (o título) */}
                                    <label 
                    _                     htmlFor={key} 
                                        className="uppercase font-bold text-sm text-textSecondary mt-1"
                                    >
                                        {key}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
            </div>
        </SheetSkin>
    );
};


// --- Sub-componente: Wallet ---
const Wallet = ({ character, isMaster, onUpdate, isCollapsed, toggleSection, isEditMode }) => {
    const { user } = useAuth();
    const [zeniAmount, setZeniAmount] = useState(0);

    const currentZeni = character.wallet?.zeni || 0;
    const currentInspiration = character.wallet?.inspiration || 0;
    const canEdit = user && (user.uid === character.ownerUid || isMaster);

    const handleUpdateWallet = (field, newValue) => {
        const newWallet = { ...character.wallet, [field]: Math.max(0, newValue) };
        onUpdate('wallet', newWallet);
    };

    const handleAddZeni = () => { handleUpdateWallet('zeni', currentZeni + zeniAmount); setZeniAmount(0); };
    const handleRemoveZeni = () => { handleUpdateWallet('zeni', currentZeni - zeniAmount); setZeniAmount(0); };
    const handleAddInspiration = () => handleUpdateWallet('inspiration', currentInspiration + 1);
    const handleRemoveInspiration = () => handleUpdateWallet('inspiration', currentInspiration - 1);

    const walletTitle = (
        <div className="flex justify-between items-center w-full">
            <span>Zeni: {currentZeni}</span>
            <span className="text-textPrimary text-base">Inspiração: {currentInspiration}</span>
        </div>
    );

    return (
        <SheetSkin title={walletTitle} isCollapsed={isCollapsed} toggleSection={toggleSection} isComplexTitle={true}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline font-semibold text-textSecondary">Zeni:</span>
                    <input type="number" value={zeniAmount === 0 ? '' : zeniAmount} onChange={(e) => setZeniAmount(parseInt(e.target.value, 10) || 0)} className="w-24 p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary text-lg" placeholder="Valor" disabled={!canEdit} />
                    <button onClick={handleAddZeni} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>+</button>
                    <button onClick={handleRemoveZeni} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm" disabled={!canEdit}>-</button>
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

// --- Sub-componente: DiscordIntegration ---
const DiscordIntegration = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, isEditMode }) => {
    const { user } = useAuth();
    const canEdit = user && (user.uid === character.ownerUid || isMaster);

    const [localWebhookUrl, setLocalWebhookUrl] = useState(character.discordWebhookUrl || '');

    useEffect(() => {
        setLocalWebhookUrl(character.discordWebhookUrl || '');
    }, [character.discordWebhookUrl]);

    const handleLocalChange = (e) => {
        setLocalWebhookUrl(e.target.value);
    };

    const handleSave = useCallback(() => {
        if (localWebhookUrl !== character.discordWebhookUrl) {
            onUpdate('discordWebhookUrl', localWebhookUrl);
        }
    }, [localWebhookUrl, character.discordWebhookUrl, onUpdate]);

    return (
        <SheetSkin title="Integração com Discord" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div>
                <label htmlFor="discordWebhookUrl" className="block text-sm font-medium text-textSecondary mb-1">URL do Webhook do Canal:</label>
                <input
                    type="text"
                    id="discordWebhookUrl"
                    name="discordWebhookUrl"
                    value={localWebhookUrl}
                    onChange={handleLocalChange}
                    onBlur={handleSave}
                    className="w-full p-2 bg-bgInput border border-bgElement rounded-md focus:ring-btnHighlightBg focus:border-btnHighlightBg text-textPrimary"
                    placeholder="Cole a URL do Webhook do seu canal do Discord aqui"
                    disabled={!canEdit || !isEditMode}
                />
                <p className="text-xs text-textSecondary mt-2">
                    Com a URL do Webhook configurada, os comandos de rolagem serão enviados diretamente para o seu canal do Discord.
                </p>
            </div>
        </SheetSkin>
    );
};


// Exporta cada componente individualmente para que o CharacterSheet possa controlá-los
export { CharacterInfo, MainAttributes, Wallet, DiscordIntegration };
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
const CharacterInfo = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, isEditMode, onPowerScaleUpdate }) => {
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
            return { scale: 'N/A', category: 'Desconhecida', powerBonus: 0 };
        }

        if (level >= 1 && level <= 10) return { scale: 0, category: 'Comum', powerBonus: 1 };
        if (level >= 11 && level <= 20) return { scale: 1, category: 'Lendário I', powerBonus: 2 };
        if (level >= 21 && level <= 30) return { scale: 2, category: 'Lendário II', powerBonus: 2 };
        if (level >= 31 && level <= 40) return { scale: 3, category: 'Lendário III', powerBonus: 2 };
        if (level >= 41 && level <= 45) return { scale: 4, category: 'Colossal I', powerBonus: 3 };
        if (level >= 46 && level <= 50) return { scale: 5, category: 'Colossal II', powerBonus: 3 };
        if (level >= 51 && level <= 55) return { scale: 6, category: 'Colossal III', powerBonus: 3 };
        if (level >= 56 && level <= 59) return { scale: 7, category: 'Titânico', powerBonus: 4 };
        if (level === 60) return { scale: 8, category: 'Divino', powerBonus: 5 };

        return { scale: 'N/A', category: 'Além do Divino', powerBonus: 6 }; // For levels beyond 60
    };

    const { scale, category, powerBonus } = useMemo(() => getPowerScale(character.level), [character.level]);

    // NOVO: Efeito para comunicar a mudança do bônus de poder para o componente pai
    useEffect(() => {
        if (onPowerScaleUpdate) {
            onPowerScaleUpdate(powerBonus);
        }
    }, [powerBonus, onPowerScaleUpdate]);

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
export const MainAttributes = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, buffModifiers, isEditMode, onAttributeRoll, onMapUpdate, powerScaleBonus }) => {
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

    const wisdomValue = useMemo(() => {
        return calculateTotal(localMainAttributes?.sabedoria, 'Sabedoria');
    }, [localMainAttributes?.sabedoria, buffModifiers]);

    // Mapeamento de abreviações para os valores totais dos atributos
    const attrValueMap = useMemo(() => ({
        FOR: calculateTotal(localMainAttributes?.forca, 'Força'),
        DES: dexterityValue,
        CON: constitutionValue,
        INT: calculateTotal(localMainAttributes?.inteligencia, 'Inteligencia'),
        SAB: wisdomValue,
        CAR: calculateTotal(localMainAttributes?.carisma, 'Carisma'),
    }), [localMainAttributes, dexterityValue, constitutionValue, wisdomValue, buffModifiers]);

    // Chama o callback para atualizar o mapa no componente pai sempre que ele mudar.
    useEffect(() => {
        if (onMapUpdate) {
            onMapUpdate(attrValueMap);
        }
    }, [attrValueMap, onMapUpdate]);

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
            const finalValue = localValue === '' ? 0 : (parseInt(localValue, 10) || 0);

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
                            <input type="number" readOnly name="current" value={localMainAttributes.hp?.current ?? ''} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold cursor-pointer hover:bg-bgElement/50" onClick={() => onAttributeRoll('HP', localMainAttributes.hp?.current)} title="Aplicar Dano/Cura no HP" />
                            <span className="text-textSecondary">/</span>
                            <input type="number" name="max" value={localMainAttributes.hp?.max ?? ''} onChange={(e) => handleLocalChange(e, 'hp')} onBlur={() => handleSave('max', 'hp')} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!isMaster} />
                            <span className="text-blue-400 font-bold text-xl ml-1">+</span>
                            <input type="number" readOnly title="HP Temporário" name="temp" value={localMainAttributes.hp?.temp ?? ''} className="w-16 p-2 text-center bg-bgInput border border-blue-400 rounded-md text-blue-300 text-xl font-bold cursor-pointer hover:bg-bgElement/50" onClick={() => onAttributeRoll('HP Bonus', localMainAttributes.hp?.temp)} />
                        </div>
                    </div>
                    {/* Bloco de MP */}
                    <div className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                        <label className="text-lg font-medium text-textSecondary mb-1 uppercase">MP</label>
                        <div className="flex items-center gap-2">
                            <input type="number" readOnly name="current" value={localMainAttributes.mp?.current ?? ''} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold cursor-pointer hover:bg-bgElement/50" onClick={() => onAttributeRoll('MP', localMainAttributes.mp?.current)} title="Aplicar Dano/Cura no MP" />
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
                                        onBlur={() => handleSave(lowerKey)}
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
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 auto-rows-fr">
                    {/* --- ATRIBUTOS DE COMBATE --- */}
                    {['Iniciativa', 'FA', 'FM', 'MD', 'Acerto', 'ME'].map(key => {
                            const lowerKey = key.toLowerCase();
                            const isCalculated = false; 
                            let baseValue, total;

                            if (key === 'Iniciativa') {
                                baseValue = localMainAttributes?.[lowerKey] ?? '';
                                const initiativeBonus = parseInt(baseValue, 10) || 0;
                                total = calculateTotal(baseValue, 'Iniciativa') + dexterityValue;
                            } else if (key === 'MD') {
                                baseValue = localMainAttributes?.fd ?? '';
                                total = calculateTotal(baseValue, 'MD') + constitutionValue; 
                            } else {
                                baseValue = localMainAttributes?.[lowerKey] ?? '';
                                // Para FA, FM, Acerto, ME, o cálculo é direto.
                                total = calculateTotal(baseValue, key);
                            }
                            
                            return (
                                <div key={key} className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                                    {/* Total (o número grande) */}
                                    <span 
                                        className="text-4xl font-bold text-textPrimary cursor-pointer hover:text-btnHighlightBg"
                                        onClick={() => onAttributeRoll(key, total)}
                                        title={`Clique para rolar ${key} (Valor: ${total})`}>
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
                                            onBlur={() => handleSave(key === 'MD' ? 'fd' : lowerKey)}
                                            className="w-16 p-1 text-center bg-bgInput border border-bgElement rounded-md text-textSecondary text-lg"
                                         disabled={!canEditGeneral}
                                            aria-label={`${key} Base`}
                                        />
                                    )}

                                    {/* Label (o título) */}
                                    <label 
                                         htmlFor={key} 
                                        className="uppercase font-bold text-sm text-textSecondary mt-1"
>
                                        {key}
                                    </label>
                                </div>
                            );
                        })}

                    {/* --- TESTES DE RESISTÊNCIA --- */}
                    {[{key: 'Fortitude', defaultAttr: 'CON'}, {key: 'Reflexo', defaultAttr: 'DES'}, {key: 'Vontade', defaultAttr: 'SAB'}].map(({key, defaultAttr}) => {
                        const lowerKey = key.toLowerCase();
                        const attrField = `${lowerKey}Attr`; // ex: 'fortitudeAttr'
                        
                        // Pega o atributo selecionado do personagem, ou usa o padrão
                        const selectedAttr = character[attrField] || defaultAttr;
                        
                        // Pega o valor do atributo selecionado do mapa
                        const attrValue = attrValueMap[selectedAttr] || 0;

                        const baseValue = localMainAttributes?.[lowerKey] ?? '';
                        const total = (parseInt(baseValue, 10) || 0) + attrValue + (buffModifiers[key] || 0) + (powerScaleBonus || 0);

                        const handleAttrChange = (newAttr) => {
                            onUpdate(attrField, newAttr);
                        };

                        return (
                            <div key={key} className="flex flex-col items-center p-2 bg-bgElement rounded-md col-span-2 justify-between">
                                <span 
                                    className="text-4xl font-bold text-textPrimary cursor-pointer hover:text-btnHighlightBg"
                                    onClick={() => onAttributeRoll(key, total)}
                                    title={`Clique para rolar ${key} (Valor: ${total})`}>
                                    {total}
                                </span>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        id={key}
                                        name={lowerKey}
                                        value={baseValue}
                                        onChange={handleLocalChange}
                                        onBlur={() => handleSave(lowerKey)}
                                        className="w-16 p-1 text-center bg-bgInput border border-bgElement rounded-md text-textSecondary text-lg"
                                        disabled={!canEditGeneral || !isEditMode}
                                        aria-label={`${key} Base`}
                                    />
                                    {isEditMode ? (
                                        <select 
                                            value={selectedAttr}
                                            onChange={(e) => handleAttrChange(e.target.value)}
                                            className="bg-bgInput text-textPrimary text-sm font-bold rounded-md p-1 border-none focus:ring-2 focus:ring-btnHighlightBg"
                                            disabled={!canEditGeneral}
                                        >
                                            {Object.keys(attrValueMap).map(attr => (
                                                <option key={attr} value={attr}>{attr}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="font-semibold text-textSecondary text-sm ml-1">({selectedAttr})</span>
                                    )}
                                </div>

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
export { CharacterInfo, DiscordIntegration };
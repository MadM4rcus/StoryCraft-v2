// src/components/CorePanels.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks';
import SheetSkin from './SheetSkin';


// --- O restante do seu código começa aqui ---


// --- Sub-componente: CharacterInfo ---
const CharacterInfo = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, isEditMode }) => {
    const { user } = useAuth();
    const canEdit = user && (user.uid === character.ownerUid || isMaster);
    
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
            const newUrl = prompt("Insira a URL da imagem do personagem:", character.photoUrl || "");
            if (newUrl !== null) {
                onUpdate('photoUrl', newUrl);
            }
        }
    };

    const fieldOrder = ['name', 'age', 'height', 'gender', 'race', 'class', 'alignment', 'level', 'xp'];
    
    return (
        <SheetSkin title="Informações do Personagem" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex-shrink-0">
                    {character.photoUrl ? (
                        <img src={character.photoUrl} alt="Foto" className={`w-48 h-48 object-cover rounded-full border-2 border-btnHighlightBg ${canEdit && isEditMode ? 'cursor-pointer' : ''}`} onClick={handlePhotoClick} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/192x192/1f2937/FFFFFF?text=Erro'; }} />
                    ) : (
                        <div className={`w-48 h-48 bg-bgElement rounded-full border-2 border-btnHighlightBg flex items-center justify-center text-6xl text-textSecondary ${canEdit && isEditMode ? 'cursor-pointer' : ''}`} onClick={handlePhotoClick}>+</div>
                    )}
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
const MainAttributes = ({ character, onUpdate, isMaster, isCollapsed, toggleSection, buffModifiers, isEditMode }) => {
    const { user } = useAuth();
    const canEdit = user && (user.uid === character.ownerUid || isMaster);
    const canEditGeneral = user && (user.uid === character.ownerUid || isMaster);
    
    const [localMainAttributes, setLocalMainAttributes] = useState(character.mainAttributes || { hp: {}, mp: {} });

    useEffect(() => {
        setLocalMainAttributes(character.mainAttributes || { hp: {}, mp: {} });
    }, [character.mainAttributes]);

    // CORREÇÃO: Adicionada verificação para o caso de 'buffModifiers' ser undefined.
    const dexterityValue = useMemo(() => {
        const searchTerms = ['dex', 'des', 'agi'];
        const dexterityAttr = (character.attributes || []).find(attr => {
            if (!attr.name) return false;
            return searchTerms.some(term => attr.name.toLowerCase().includes(term));
        });
        if (!dexterityAttr) return 0;
        const tempValue = (buffModifiers && buffModifiers[dexterityAttr.name]) || 0;
        return (dexterityAttr.base || 0) + (dexterityAttr.perm || 0) + tempValue + (dexterityAttr.arma || 0);
    }, [character.attributes, buffModifiers]);
    const initiativeTotal = dexterityValue + ((buffModifiers && buffModifiers['Iniciativa']) || 0);

    const handleLocalChange = (e, attributeKey) => {
        const { name, value } = e.target;
        const parsedValue = value === '' ? '' : parseInt(value, 10);

        setLocalMainAttributes(prev => {
            if (attributeKey) {
                return { ...prev, [attributeKey]: { ...(prev[attributeKey] || {}), [name]: parsedValue } };
            }
            return { ...prev, [name]: parsedValue };
        });
    };

    // CORREÇÃO: Lógica de 'handleSave' reescrita para ser mais robusta e evitar erros com dados inexistentes.
    const handleSave = useCallback((name, attributeKey) => {
        if (!character) return; // Garante que o personagem existe

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
                // CORREÇÃO DEFINITIVA: Mescla a alteração com os dados originais do personagem
                // para garantir que os sub-objetos 'hp' e 'mp' nunca sejam perdidos,
                // mesmo que o estado local 'localMainAttributes' esteja dessincronizado.
                const updatedMainAttributes = { 
                    ...currentMainAttributes, 
                    [name]: finalDirectValue };
                onUpdate('mainAttributes', updatedMainAttributes);
            }
        }
    }, [localMainAttributes, character, onUpdate]); // Adicionado 'character' como dependência

    // CORREÇÃO: Adicionada verificação para o caso de 'buffModifiers' ser undefined.
    const calculateTotal = (base, key) => (parseInt(base, 10) || 0) + ((buffModifiers && buffModifiers[key]) || 0);

    return (
        <SheetSkin title="Atributos Principais" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Bloco de HP */}
                <div className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                    <label className="text-lg font-medium text-textSecondary mb-1 uppercase">HP</label>
                    <div className="flex items-center gap-1">
                        <input type="number" name="current" value={localMainAttributes.hp?.current ?? ''} onChange={(e) => handleLocalChange(e, 'hp')} onBlur={() => handleSave('current', 'hp')} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!canEdit} />
                        <span className="text-textSecondary">/</span>
                        <input type="number" name="max" value={localMainAttributes.hp?.max ?? ''} onChange={(e) => handleLocalChange(e, 'hp')} onBlur={() => handleSave('max', 'hp')} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!canEdit || !isEditMode} />
                        <span className="text-blue-400 font-bold text-xl ml-1">+</span>
                        <input type="number" title="HP Temporário" name="temp" value={localMainAttributes.hp?.temp ?? ''} onChange={(e) => handleLocalChange(e, 'hp')} onBlur={() => handleSave('temp', 'hp')} className="w-16 p-2 text-center bg-bgInput border border-blue-400 rounded-md text-blue-300 text-xl font-bold" disabled={!canEdit} />
                    </div>
                </div>
                {/* Bloco de MP */}
                 <div className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                    <label className="text-lg font-medium text-textSecondary mb-1 uppercase">MP</label>
                    <div className="flex items-center gap-2">
                        <input type="number" name="current" value={localMainAttributes.mp?.current ?? ''} onChange={(e) => handleLocalChange(e, 'mp')} onBlur={() => handleSave('current', 'mp')} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!canEdit} />
                        <span className="text-textSecondary">/</span>
                        <input type="number" name="max" value={localMainAttributes.mp?.max ?? ''} onChange={(e) => handleLocalChange(e, 'mp')} onBlur={() => handleSave('max', 'mp')} className="w-16 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold" disabled={!canEdit || !isEditMode} />
                    </div>
                </div>
                {/* Outros Atributos */}
                {['Iniciativa', 'fa', 'fm', 'fd'].map(key => {
                    const isInitiative = key === 'Iniciativa';
                    const baseValue = isInitiative ? dexterityValue : (localMainAttributes?.[key.toLowerCase()] ?? '');
                    const total = isInitiative ? initiativeTotal : calculateTotal(localMainAttributes?.[key.toLowerCase()] || 0, key.toUpperCase());
                    
                    return (
                        <div key={key} className="flex flex-col items-center p-2 bg-bgElement rounded-md">
                            <label htmlFor={key} className="capitalize text-lg font-medium text-textSecondary mb-1">{key.toUpperCase()}:</label>
                             <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    id={key}
                                    name={key.toLowerCase()}
                                    value={baseValue}
                                    onChange={handleLocalChange}
                                    onBlur={() => handleSave(key.toLowerCase())}
                                    className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold"
                                    disabled={!canEditGeneral || isInitiative || !isEditMode}
                                />
                                <span className="text-textSecondary">=</span>
                                <span className="w-14 p-2 text-center bg-bgInput border border-bgElement rounded-md text-textPrimary text-xl font-bold">{total}</span>
                            </div>
                        </div>
                    );
                })}
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

// src/components/ContentSections.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks';
import SheetSkin from './SheetSkin';

// Helper de Textarea (reutilizado)
const AutoResizingTextarea = ({ value, onChange, placeholder, className, disabled, onBlur }) => {
    const textareaRef = useRef(null);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);
    return <textarea ref={textareaRef} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} className={`${className} resize-none overflow-hidden`} rows="1" disabled={disabled} />;
};

// --- Sub-componente para a História ---
const Story = ({ character, isMaster, onUpdate, isCollapsed, toggleSection, isEditMode }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    
    const addHistoryBlock = (type) => {
        const newBlock = type === 'text'
            ? { id: crypto.randomUUID(), type: 'text', value: '', isCollapsed: false }
            : { id: crypto.randomUUID(), type: 'image', value: '', width: '', height: '', fitWidth: true, isCollapsed: false };
        
        if (type === 'image') {
            const url = prompt("Cole a URL da imagem:");
            if (url) onUpdate('history', [...(character.history || []), { ...newBlock, value: url }]);
        } else {
            onUpdate('history', [...(character.history || []), newBlock]);
        }
    };
    const updateHistoryBlock = (id, field, value) => onUpdate('history', (character.history || []).map(b => (b.id === id ? { ...b, [field]: value } : b)));
    const removeHistoryBlock = (id) => onUpdate('history', (character.history || []).filter(b => b.id !== id));

    return (
        <SheetSkin title="História do Personagem" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="space-y-4 mb-4">
                {(character.history || []).length === 0 ? <p className="text-textSecondary italic">Nenhum bloco de história adicionado.</p> : character.history.map((block) => renderBlock(block, canEdit, updateHistoryBlock, removeHistoryBlock))}
            </div>
            {canEdit && isEditMode && (
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                    <button onClick={() => addHistoryBlock('text')} className="px-6 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg">Adicionar Texto</button>
                    <button onClick={() => addHistoryBlock('image')} className="px-6 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg">Adicionar Imagem</button>
                </div>
            )}
        </SheetSkin>
    );
};

// --- Sub-componente para as Anotações ---
const Notes = ({ character, isMaster, onUpdate, isCollapsed, toggleSection, isEditMode }) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    
    const addNoteBlock = (type) => {
        const newBlock = type === 'text'
            ? { id: crypto.randomUUID(), type: 'text', value: '', isCollapsed: false }
            : { id: crypto.randomUUID(), type: 'image', value: '', width: '', height: '', fitWidth: true, isCollapsed: false };
        
        if (type === 'image') {
            const url = prompt("Cole a URL da imagem para a anotação:");
            if (url) onUpdate('notes', [...(character.notes || []), { ...newBlock, value: url }]);
        } else {
            onUpdate('notes', [...(character.notes || []), newBlock]);
        }
    };
    const updateNoteBlock = (id, field, value) => onUpdate('notes', (character.notes || []).map(b => (b.id === id ? { ...b, [field]: value } : b)));
    const removeNoteBlock = (id) => onUpdate('notes', (character.notes || []).filter(b => b.id !== id));

    return (
        <SheetSkin title="Anotações" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="space-y-4 mb-4">
                {(character.notes || []).length === 0 ? <p className="text-textSecondary italic">Nenhum bloco de anotação adicionado.</p> : character.notes.map((block) => renderBlock(block, canEdit, updateNoteBlock, removeNoteBlock))}
            </div>
            {canEdit && isEditMode && (
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                    <button onClick={() => addNoteBlock('text')} className="px-6 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg">Adicionar Texto</button>
                    <button onClick={() => addNoteBlock('image')} className="px-6 py-2 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg">Adicionar Imagem</button>
                </div>
            )}
        </SheetSkin>
    );
};

// Helper de Renderização (para não repetir o JSX dos blocos)
const renderBlock = (block, canEdit, updateBlock, removeBlock) => (
    <div key={block.id} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput relative">
        {canEdit && (
            <button 
                onClick={() => removeBlock(block.id)} 
                className="absolute top-2 right-2 p-1 rounded-md text-textSecondary hover:bg-red-600/50 hover:text-white z-10"
                title="Remover Bloco"
            >
                <span role="img" aria-label="Remover" className="text-lg">🗑️</span>
            </button>
        )}
        {block.type === 'text' ? (
            <TextBlock block={block} canEdit={canEdit} updateBlock={updateBlock} />
        ) : ( 
            <ImageBlock block={block} canEdit={canEdit} updateBlock={updateBlock} />
        )}
    </div>
);

// Componente para blocos de texto, agora com o estado local para evitar o bug do cursor
const TextBlock = ({ block, canEdit, updateBlock }) => {
    const [localValue, setLocalValue] = useState(block.value || '');

    useEffect(() => {
        setLocalValue(block.value || '');
    }, [block.value]);

    const handleSave = useCallback(() => {
        if (localValue !== block.value) {
            updateBlock(block.id, 'value', localValue);
        }
    }, [localValue, block.value, block.id, updateBlock]);

    return block.isCollapsed ? (
        <div className="cursor-pointer" onClick={() => updateBlock(block.id, 'isCollapsed', false)}>
            <p className="text-lg font-semibold mb-1 text-textPrimary">Bloco de Texto</p>
            <p className="text-sm italic text-textSecondary truncate">{block.value || 'Vazio...'}</p>
        </div>
    ) : (
        <>
            <AutoResizingTextarea
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleSave}
                placeholder="Digite aqui..."
                className="w-full p-2 bg-bgInput border border-bgElement rounded-md text-textPrimary"
                disabled={!canEdit}
            />
            <div onClick={() => updateBlock(block.id, 'isCollapsed', true)} className="mt-2 text-center p-1 bg-bgInput hover:opacity-80 text-xs font-bold rounded-md cursor-pointer text-textSecondary">Ocultar ▲</div>
        </>
    );
};

// Componente para blocos de imagem, agora com o estado local para evitar o bug do cursor
const ImageBlock = ({ block, canEdit, updateBlock }) => {
    const [localWidth, setLocalWidth] = useState(block.width === 0 ? '' : block.width);
    const [localHeight, setLocalHeight] = useState(block.height === 0 ? '' : block.height);
    const [localFitWidth, setLocalFitWidth] = useState(block.fitWidth);

    useEffect(() => {
        setLocalWidth(block.width === 0 ? '' : block.width);
        setLocalHeight(block.height === 0 ? '' : block.height);
        setLocalFitWidth(block.fitWidth);
    }, [block.width, block.height, block.fitWidth]);

    const handleWidthSave = useCallback(() => updateBlock(block.id, 'width', parseInt(localWidth) || 0), [block.id, updateBlock, localWidth]);
    const handleHeightSave = useCallback(() => updateBlock(block.id, 'height', parseInt(localHeight) || 0), [block.id, updateBlock, localHeight]);
    const handleFitWidthSave = useCallback((e) => updateBlock(block.id, 'fitWidth', e.target.checked), [block.id, updateBlock]);

    return block.isCollapsed ? (
        <div className="cursor-pointer text-center py-2" onClick={() => updateBlock(block.id, 'isCollapsed', false)}>
            <p className="text-lg font-semibold text-textPrimary">Mostrar Imagem</p>
        </div>
    ) : (
        <div className="flex flex-col items-center">
            <img src={block.value} alt="Imagem" className="max-w-full h-auto rounded-md shadow-md" style={{ width: localFitWidth ? '100%' : (localWidth ? `${localWidth}px` : 'auto'), height: localFitWidth ? 'auto' : (localHeight ? `${localHeight}px` : 'auto'), objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x200/1f2937/FFFFFF?text=Erro'; }} />
            {canEdit && (
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-sm text-textSecondary">
                    <label>Ajustar à Largura: <input type="checkbox" checked={localFitWidth} onChange={(e) => { setLocalFitWidth(e.target.checked); handleFitWidthSave(e); }} className="form-checkbox text-btnHighlightBg rounded" /></label>
                    {!localFitWidth && (
                        <>
                            <label>Largura (px): <input type="number" value={localWidth} onChange={(e) => setLocalWidth(e.target.value)} onBlur={handleWidthSave} className="w-20 p-1 bg-bgInput border border-bgElement rounded-md text-center text-textPrimary" /></label>
                            <label>Altura (px): <input type="number" value={localHeight} onChange={(e) => setLocalHeight(e.target.value)} onBlur={handleHeightSave} className="w-20 p-1 bg-bgInput border border-bgElement rounded-md text-center text-textPrimary" /></label>
                        </>
                    )}
                </div>
            )}
            <div onClick={() => updateBlock(block.id, 'isCollapsed', true)} className="mt-2 w-full text-center p-1 bg-bgInput hover:opacity-80 text-xs font-bold rounded-md cursor-pointer text-textSecondary">Ocultar ▲</div>
        </div>
    );
};

// Exporta cada componente individualmente para que o CharacterSheet possa controlá-los
export { Story, Notes };
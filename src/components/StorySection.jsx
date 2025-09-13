import React from 'react';
import { useAuth } from '../hooks/useAuth';

// Componente para os campos de texto que se auto-ajustam
const AutoResizingTextarea = ({ value, onChange, placeholder, className, disabled }) => {
    const textareaRef = React.useRef(null);
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);
    return <textarea ref={textareaRef} value={value} onChange={onChange} placeholder={placeholder} className={`${className} resize-none overflow-hidden`} rows="1" disabled={disabled} />;
};

const StorySection = ({ character, isMaster, onUpdate, isCollapsed, toggleSection }) => {
    const { user } = useAuth();
    // Apenas o dono da ficha ou o mestre podem editar a história
    const canEditHistory = user.uid === character.ownerUid || isMaster;
    
    // --- Lógica para a História ---
    const addHistoryBlock = (type) => {
        const newBlock = type === 'text'
            ? { id: crypto.randomUUID(), type: 'text', value: '', isCollapsed: false }
            : { id: crypto.randomUUID(), type: 'image', value: '', width: '', height: '', fitWidth: true, isCollapsed: false };
        
        if (type === 'image') {
            const url = prompt("Cole a URL da imagem:");
            if (url) {
                onUpdate('history', [...(character.history || []), { ...newBlock, value: url }]);
            }
        } else {
            onUpdate('history', [...(character.history || []), newBlock]);
        }
    };
    const updateHistoryBlock = (id, field, value) => onUpdate('history', (character.history || []).map(b => (b.id === id ? { ...b, [field]: value } : b)));
    const removeHistoryBlock = (id) => onUpdate('history', (character.history || []).filter(b => b.id !== id));

    // Função para renderizar cada bloco (texto ou imagem)
    const renderBlock = (block) => (
        <div key={block.id} className="p-3 bg-gray-600 rounded-md shadow-sm border border-gray-500 relative">
            {canEditHistory && (
                <button onClick={() => removeHistoryBlock(block.id)} className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full flex items-center justify-center z-10">X</button>
            )}
            {block.type === 'text' ? (
                block.isCollapsed ? (
                    <div className="cursor-pointer" onClick={() => updateHistoryBlock(block.id, 'isCollapsed', false)}>
                        <p className="text-lg font-semibold mb-1 text-white">Bloco de Texto</p>
                        <p className="text-sm italic text-gray-300 truncate">{block.value || 'Vazio...'}</p>
                    </div>
                ) : (
                    <>
                        <AutoResizingTextarea value={block.value} onChange={(e) => updateHistoryBlock(block.id, 'value', e.target.value)} placeholder="Digite aqui..." className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white" disabled={!canEditHistory} />
                        {/* A barra inferior inteira agora é clicável para ocultar */}
                        <div onClick={() => updateHistoryBlock(block.id, 'isCollapsed', true)} className="mt-2 text-center p-1 bg-gray-700 hover:bg-gray-500 text-xs font-bold rounded-md cursor-pointer text-gray-300">
                            Ocultar ▲
                        </div>
                    </>
                )
            ) : ( 
                block.isCollapsed ? (
                    <div className="cursor-pointer text-center py-2" onClick={() => updateHistoryBlock(block.id, 'isCollapsed', false)}>
                        <p className="text-lg font-semibold text-white">Mostrar Imagem</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <img src={block.value} alt="Imagem da história" className="max-w-full h-auto rounded-md shadow-md" style={{ width: block.fitWidth ? '100%' : (block.width ? `${block.width}px` : 'auto'), height: block.fitWidth ? 'auto' : (block.height ? `${block.height}px` : 'auto'), objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x200/1f2937/FFFFFF?text=Erro'; }} />
                        {canEditHistory && (
                            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-sm text-gray-300">
                                <label><input type="checkbox" checked={block.fitWidth} onChange={(e) => updateHistoryBlock(block.id, 'fitWidth', e.target.checked)} className="form-checkbox text-purple-500 rounded" /> Ajustar à Largura</label>
                                {!block.fitWidth && (
                                    <>
                                        <label>Largura (px): <input type="number" value={block.width === 0 ? '' : block.width} onChange={(e) => updateHistoryBlock(block.id, 'width', parseInt(e.target.value) || 0)} className="w-20 p-1 bg-gray-700 border border-gray-500 rounded-md text-center text-white" /></label>
                                        <label>Altura (px): <input type="number" value={block.height === 0 ? '' : block.height} onChange={(e) => updateHistoryBlock(block.id, 'height', parseInt(e.target.value) || 0)} className="w-20 p-1 bg-gray-700 border border-gray-500 rounded-md text-center text-white" /></label>
                                    </>
                                )}
                            </div>
                        )}
                        {/* A barra inferior inteira agora é clicável para ocultar */}
                        <div onClick={() => updateHistoryBlock(block.id, 'isCollapsed', true)} className="mt-2 w-full text-center p-1 bg-gray-700 hover:bg-gray-500 text-xs font-bold rounded-md cursor-pointer text-gray-300">
                            Ocultar ▲
                        </div>
                    </div>
                )
            )}
        </div>
    );

    return (
        <section className="mb-8 p-6 bg-gray-700 rounded-xl shadow-inner border border-gray-600">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 border-b-2 border-yellow-500 pb-2 cursor-pointer flex justify-between items-center" onClick={toggleSection}>
                História do Personagem
                <span>{isCollapsed ? '▼' : '▲'}</span>
            </h2>
            {!isCollapsed && (
                <>
                    <div className="space-y-4 mb-4">
                        {(character.history || []).length === 0 ? <p className="text-gray-400 italic">Nenhum bloco de história adicionado.</p> : character.history.map((block) => renderBlock(block, 'history', removeHistoryBlock, updateHistoryBlock, canEditHistory))}
                    </div>
                    {canEditHistory && (
                        <div className="flex flex-wrap gap-4 mt-4 justify-center">
                            <button onClick={() => addHistoryBlock('text')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-white">Adicionar Texto</button>
                            <button onClick={() => addHistoryBlock('image')} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 font-bold rounded-lg text-white">Adicionar Imagem</button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default StorySection;
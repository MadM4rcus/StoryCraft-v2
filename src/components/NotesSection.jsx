import React from 'react';

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

const NotesSection = ({ character, onUpdate, isCollapsed, toggleSection }) => {
    // Nas anotações, todos podem editar.
    const canEditNotes = true; 
    
    const addNoteBlock = (type) => {
        const newBlock = type === 'text'
            ? { id: crypto.randomUUID(), type: 'text', value: '', isCollapsed: false }
            : { id: crypto.randomUUID(), type: 'image', value: '', width: '', height: '', fitWidth: true, isCollapsed: false };
        
        if (type === 'image') {
            const url = prompt("Cole a URL da imagem para a anotação:");
            if (url) {
                onUpdate('notes', [...(character.notes || []), { ...newBlock, value: url }]);
            }
        } else {
            onUpdate('notes', [...(character.notes || []), newBlock]);
        }
    };

    const updateNoteBlock = (id, field, value) => onUpdate('notes', (character.notes || []).map(b => (b.id === id ? { ...b, [field]: value } : b)));
    const removeNoteBlock = (id) => onUpdate('notes', (character.notes || []).filter(b => b.id !== id));

    const renderBlock = (block) => (
        <div key={block.id} className="p-3 bg-gray-600 rounded-md shadow-sm border border-gray-500 relative">
            {/* O botão de remover está sempre visível nas anotações */}
            <button onClick={() => removeNoteBlock(block.id)} className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full flex items-center justify-center z-10">X</button>
            
            {block.type === 'text' ? (
                block.isCollapsed ? (
                    <div className="cursor-pointer" onClick={() => updateNoteBlock(block.id, 'isCollapsed', false)}>
                        <p className="text-lg font-semibold mb-1 text-white">Anotação de Texto</p>
                        <p className="text-sm italic text-gray-300 truncate">{block.value || 'Vazio...'}</p>
                    </div>
                ) : (
                    <>
                        <AutoResizingTextarea value={block.value} onChange={(e) => updateNoteBlock(block.id, 'value', e.target.value)} placeholder="Digite sua anotação..." className="w-full p-2 bg-gray-700 border border-gray-500 rounded-md text-white" />
                        <div onClick={() => updateNoteBlock(block.id, 'isCollapsed', true)} className="mt-2 text-center p-1 bg-gray-700 hover:bg-gray-500 text-xs font-bold rounded-md cursor-pointer text-gray-300">
                            Ocultar ▲
                        </div>
                    </>
                )
            ) : ( 
                block.isCollapsed ? (
                    <div className="cursor-pointer text-center py-2" onClick={() => updateNoteBlock(block.id, 'isCollapsed', false)}>
                        <p className="text-lg font-semibold text-white">Mostrar Imagem</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <img src={block.value} alt="Imagem da anotação" className="max-w-full h-auto rounded-md shadow-md" style={{ width: block.fitWidth ? '100%' : (block.width ? `${block.width}px` : 'auto'), height: block.fitWidth ? 'auto' : (block.height ? `${block.height}px` : 'auto'), objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x200/1f2937/FFFFFF?text=Erro'; }} />
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-sm text-gray-300">
                            <label><input type="checkbox" checked={block.fitWidth} onChange={(e) => updateNoteBlock(block.id, 'fitWidth', e.target.checked)} className="form-checkbox text-purple-500 rounded" /> Ajustar à Largura</label>
                            {!block.fitWidth && (
                                <>
                                    <label>Largura (px): <input type="number" value={block.width === 0 ? '' : block.width} onChange={(e) => updateNoteBlock(block.id, 'width', parseInt(e.target.value) || 0)} className="w-20 p-1 bg-gray-700 border border-gray-500 rounded-md text-center text-white" /></label>
                                    <label>Altura (px): <input type="number" value={block.height === 0 ? '' : block.height} onChange={(e) => updateNoteBlock(block.id, 'height', parseInt(e.target.value) || 0)} className="w-20 p-1 bg-gray-700 border border-gray-500 rounded-md text-center text-white" /></label>
                                </>
                            )}
                        </div>
                        <div onClick={() => updateNoteBlock(block.id, 'isCollapsed', true)} className="mt-2 w-full text-center p-1 bg-gray-700 hover:bg-gray-500 text-xs font-bold rounded-md cursor-pointer text-gray-300">
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
                Anotações
                <span>{isCollapsed ? '▼' : '▲'}</span>
            </h2>
            {!isCollapsed && (
                <>
                    <div className="space-y-4 mb-4">
                        {(character.notes || []).length === 0 ? <p className="text-gray-400 italic">Nenhum bloco de anotação adicionado.</p> : character.notes.map((block) => renderBlock(block))}
                    </div>
                    {/* Botões de adicionar estão sempre visíveis para todos */}
                    <div className="flex flex-wrap gap-4 mt-4 justify-center">
                        <button onClick={() => addNoteBlock('text')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-white">Adicionar Texto</button>
                        <button onClick={() => addNoteBlock('image')} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 font-bold rounded-lg text-white">Adicionar Imagem</button>
                    </div>
                </>
            )}
        </section>
    );
};

export default NotesSection;
// src/systems/storycraft_v2/ClassicSheetAdjuster.jsx
import React, { useState, useRef, useMemo } from 'react';
import { Rnd } from 'react-rnd'; 

import bgImage from '../../package/storycraft-bg-classic.png'; 

// --- 1. MANIFEST DE TIPOS DE ELEMENTO ---
const ELEMENT_TYPES = {
  input: {
    name: 'Campo de Input (Texto)',
    color: 'rgba(3, 169, 244, 0.4)', // Azul
    borderColor: '#03a9f4',
  },
  textarea: {
    name: 'Área de Texto (Grande)',
    color: 'rgba(76, 175, 80, 0.4)', // Verde
    borderColor: '#4caf50',
  },
  rollable: {
    name: 'Área Clicável (Roll)',
    color: 'rgba(244, 67, 54, 0.4)', // Vermelho
    borderColor: '#f44336',
  },
  label: {
    name: 'Texto Calculado (Label)',
    color: 'rgba(255, 152, 0, 0.4)', // Laranja
    borderColor: '#ff9800',
  },
  // --- ADICIONADO DE VOLTA O TIPO 'image' ---
  image: {
    name: 'Zona de Imagem (Foto)',
    color: 'rgba(156, 39, 176, 0.4)', // Roxo
    borderColor: '#9c27b0',
  },
};

const STAGE_WIDTH = 827;
const STAGE_HEIGHT = 1170;

// --- COMPONENTE DE ELEMENTO AJUSTÁVEL (Sem alterações) ---
const AdjustableElement = ({
  id,
  data,
  onUpdate,
  onSelect,
  isSelected,
}) => {
  const { type, top, left, width, height } = data;
  const config = ELEMENT_TYPES[type] || ELEMENT_TYPES.input;

  const style = {
    border: `2px solid ${isSelected ? config.borderColor : 'transparent'}`,
    backgroundColor: config.color,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '12px',
    textShadow: '0 0 2px black',
  };

  return (
    <Rnd
      style={style}
      size={{ width: width, height: height }}
      position={{ x: left, y: top }}
      onDragStart={onSelect}
      onDragStop={(e, d) => {
        onUpdate(id, { top: d.y, left: d.x });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate(id, {
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
          ...position,
        });
      }}
      onClick={(e) => {
        e.stopPropagation(); 
        onSelect();
      }}
      className="z-10"
    >
      {id}
    </Rnd>
  );
};

// --- COMPONENTE PRINCIPAL DA FERRAMENTA ---
const ClassicSheetAdjuster = ({ onBack }) => {
  const [elements, setElements] = useState({}); 
  const [selectedElementId, setSelectedElementId] = useState(null);
  const fileInputRef = useRef(null);

  const selectedElementData = useMemo(() => {
    return selectedElementId ? elements[selectedElementId] : null;
  }, [selectedElementId, elements]);

  const handleAddElement = (type) => {
    if (!type) return;

    const id = prompt(`Digite o ID único para este elemento (ex: "name", "attr_for", "roll_des"):`);
    if (!id) return; 
    if (elements[id]) {
      alert("Erro: Este ID já está em uso.");
      return;
    }

    setElements((prev) => ({
      ...prev,
      [id]: {
        type: type,
        top: 10,
        left: 10,
        width: 150, 
        height: 30, 
      },
    }));
    setSelectedElementId(id);
  };

  const handleUpdateElement = (id, newProps) => {
    setElements((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...newProps },
    }));
  };

  const handlePropertyChange = (e) => {
    if (!selectedElementId) return;
    const { name, value } = e.target;
    handleUpdateElement(selectedElementId, { [name]: parseInt(value, 10) || 0 });
  };
  
  const handleIdChange = (e) => {
    const newId = e.target.value.trim();
    if (!newId || newId === selectedElementId) return;
    
    if (elements[newId]) {
      console.warn(`ID "${newId}" já existe.`);
      return; 
    }

    setElements((prev) => {
      const { [selectedElementId]: currentData, ...rest } = prev;
      return {
        ...rest,
        [newId]: currentData,
      };
    });
    setSelectedElementId(newId);
  };

  // --- (NOVA FUNÇÃO ADICIONADA PARA MUDAR O TIPO) ---
  const handleTypeChange = (e) => {
    if (!selectedElementId) return;
    const { value } = e.target;
    handleUpdateElement(selectedElementId, { type: value });
  };

  // --- (Função de Copiar que você já tinha) ---
  const handleCopyElement = () => {
    if (!selectedElementId || !elements[selectedElementId]) return;

    const originalElement = elements[selectedElementId];
    
    let newId = prompt(
      `Digite o NOVO ID único para a cópia:`, 
      `${selectedElementId}_copia`
    );

    if (!newId) return; 

    while (elements[newId]) {
      alert(`Erro: O ID "${newId}" já está em uso.`);
      newId = prompt(`Por favor, digite um ID DIFERENTE:`, `${newId}_2`);
      if (!newId) return; 
    }

    const newElementData = {
      ...originalElement,
      top: originalElement.top, 
      left: originalElement.left + 20, 
    };

    setElements((prev) => ({
      ...prev,
      [newId]: newElementData,
    }));
    setSelectedElementId(newId);
  };

  const handleExport = () => {
    const exportedElements = {};
    
    Object.entries(elements).forEach(([id, data]) => {
      exportedElements[id] = {
        type: data.type,
        top: (data.top / STAGE_HEIGHT) * 100,
        left: (data.left / STAGE_WIDTH) * 100,
        width: (data.width / STAGE_WIDTH) * 100,
        height: (data.height / STAGE_HEIGHT) * 100,
      };
    });

    const json = JSON.stringify(exportedElements, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sheet_layout.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const importedElements = {};
        
        Object.entries(importedData).forEach(([id, data]) => {
          if (!data.type || data.top == null) {
            throw new Error(`Elemento "${id}" é inválido.`);
          }
          importedElements[id] = {
            type: data.type,
            top: (data.top / 100) * STAGE_HEIGHT,
            left: (data.left / 100) * STAGE_WIDTH,
            width: (data.width / 100) * STAGE_WIDTH,
            height: (data.height / 100) * STAGE_HEIGHT,
          };
        });
        
        setElements(importedElements);
      } catch (err) {
        console.error("Erro ao importar JSON:", err);
        alert(`Arquivo JSON inválido: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportChange}
        accept=".json"
        className="hidden"
      />
      
      {/* --- BARRA DE FERRAMENTAS --- */}
      <header className="p-2 bg-gray-800 flex items-center gap-4 sticky top-0 z-50">
        <button
          onClick={onBack}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded"
        >
          ← Voltar
        </button>
        <select
          onChange={(e) => {
            handleAddElement(e.target.value);
            e.target.value = ""; 
          }}
          className="bg-gray-700 text-white px-3 py-1 rounded"
          value=""
        >
          <option value="" disabled>Adicionar Zona...</option>
          {/* Agora o 'image' vai aparecer aqui */}
          {Object.entries(ELEMENT_TYPES).map(([key, config]) => (
            <option key={key} value={key}>{config.name}</option>
          ))}
        </select>
        <button
          onClick={() => fileInputRef.current.click()}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Importar JSON
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded"
        >
          Exportar JSON (%)
        </button>

        {/* Botões de Ação (Copiar e Remover) */}
        {selectedElementId && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopyElement}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded"
              title={`Copiar ${selectedElementId}`}
            >
              Copiar
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Tem certeza que quer remover o elemento "${selectedElementId}"?`)) {
                  const { [selectedElementId]: _, ...rest } = elements;
                  setElements(rest);
                  setSelectedElementId(null);
                }
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
              title={`Remover ${selectedElementId}`}
            >
              Remover
            </button>
          </div>
        )}
      </header>

      {/* --- ÁREA DE TRABALHO --- */}
      <div className="flex" style={{ height: 'calc(100vh - 48px)' }}>
        
        {/* O Palco (Stage) */}
        <div className="flex-1 overflow-auto p-4 bg-gray-900">
          <div
            className="mx-auto"
            style={{
              position: 'relative',
              width: `${STAGE_WIDTH}px`,
              height: `${STAGE_HEIGHT}px`,
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={() => setSelectedElementId(null)} 
          >
            {Object.entries(elements).map(([id, data]) => (
              <AdjustableElement
                key={id}
                id={id}
                data={data}
                onUpdate={handleUpdateElement}
                onSelect={() => setSelectedElementId(id)}
                isSelected={id === selectedElementId}
              />
            ))}
          </div>
        </div>

        {/* Painel de Propriedades */}
        <aside className="w-64 bg-gray-800 p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Propriedades</h2>
          {selectedElementData ? (
            <div className="space-y-2">
              <fieldset className="border border-gray-600 p-2 rounded">
                <legend className="text-sm px-1">Elemento</legend>
                <PropertyInput 
                  label="ID" 
                  name="id" 
                  value={selectedElementId} 
                  onChange={handleIdChange} 
                  onBlur={handleIdChange} 
                  type="text" 
                />
                
                {/* --- (CAMPO "TIPO" MODIFICADO PARA DROPDOWN) --- */}
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="type" className="text-sm text-gray-300">Tipo:</label>
                  <select
                    id="type"
                    name="type"
                    value={selectedElementData.type}
                    onChange={handleTypeChange} // Usa a nova função
                    className="w-2/3 p-1 rounded bg-gray-700 text-white"
                  >
                    {/* Lista todos os tipos, incluindo 'image' */}
                    {Object.entries(ELEMENT_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* ---------------------------------- */}
                
              </fieldset>
              
              <fieldset className="border border-gray-600 p-2 rounded">
                  <legend className="text-sm px-1">Posição (em pixels)</legend>
                  <PropertyInput label="Top" name="top" value={selectedElementData.top} onChange={handlePropertyChange} />
                  <PropertyInput label="Left" name="left" value={selectedElementData.left} onChange={handlePropertyChange} />
                  <PropertyInput label="Width" name="width" value={selectedElementData.width} onChange={handlePropertyChange} />
                  <PropertyInput label="Height" name="height" value={selectedElementData.height} onChange={handlePropertyChange} />
              </fieldset>
              
            </div>
          ) : (
            <p className="text-gray-400">Selecione um elemento ou adicione uma nova zona.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

// Componente helper (Sem alterações)
const PropertyInput = ({ label, name, value, onChange, onBlur, readOnly = false, type = "number" }) => (
  <div className="flex justify-between items-center mb-1">
    <label htmlFor={name} className="text-sm text-gray-300">{label}:</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur} 
      readOnly={readOnly}
      className={`w-2/3 p-1 rounded ${readOnly ? 'bg-gray-600 text-gray-400' : 'bg-gray-700 text-white'}`}
    />
  </div>
);

export default ClassicSheetAdjuster;
// src/systems/storycraft_v2/ClassicSheetAdjuster.jsx
import React, { useState, useRef, useMemo } from 'react';
import { Rnd } from 'react-rnd'; // A mágica acontece aqui
import bgImage from '../../package/sheet/background castle paper.png';

// --- 1. IMPORTAR TODOS OS SEUS ASSETS ---
// (Eu listei todos os que você mencionou)
import imgAnotacoes from '../../package/sheet/anotacoes.png';
import imgBioEInfo from '../../package/sheet/bio e info.png';
import imgBonus from '../../package/sheet/bonus.png';
import imgBorder from '../../package/sheet/border.png';
import imgCar from '../../package/sheet/car.png';
import imgClasse from '../../package/sheet/classe.png';
import imgCons from '../../package/sheet/cons.png';
import imgD20 from '../../package/sheet/d20.png';
import imgDes from '../../package/sheet/des.png';
import imgDeslocamento from '../../package/sheet/deslocamento.png';
import imgEquipamentos from '../../package/sheet/equipamentos.png';
import imgEscala from '../../package/sheet/escala.png';
import imgExperiencia from '../../package/sheet/experiencia.png';
import imgFor from '../../package/sheet/for.png';
import imgFortitude from '../../package/sheet/fortitude.png';
import imgHabilidades from '../../package/sheet/habilidades.png';
import imgHpEMp from '../../package/sheet/hp e mp.png';
import imgIniciativa from '../../package/sheet/iniciativa.png';
import imgInspiracao from '../../package/sheet/inspiração.png';
import imgInt from '../../package/sheet/int.png';
import imgInvetario from '../../package/sheet/invetário.png';
import imgMargemEvasao from '../../package/sheet/margem de evasão.png';
import imgMitigacaoDano from '../../package/sheet/mitigação de dano.png';
import imgMod from '../../package/sheet/mod.png';
import imgNivel from '../../package/sheet/nivel.png';
import imgNomePersonagem from '../../package/sheet/nome do personagem.png';
import imgNvl from '../../package/sheet/nvl.png';
import imgQuadradoPequeno from '../../package/sheet/quadrado pequeno.png';
import imgRaca from '../../package/sheet/raca.png';
import imgReflexos from '../../package/sheet/reflexos.png';
import imgSab from '../../package/sheet/sab.png';
import imgSlotMedio from '../../package/sheet/slot medio.png';
import imgTamanho from '../../package/sheet/tamanho.png';
import imgTendencia from '../../package/sheet/tendencia.png';
import imgTotal from '../../package/sheet/total.png';
import imgVantagemDesvantagem from '../../package/sheet/vantagem e desvantagem.png';
import imgVontade from '../../package/sheet/vontade.png';

// --- 2. MAPEAMENTO DE ASSETS ---
// Isso facilita adicionar novos elementos na UI
const ASSET_MANIFEST = {
  nome_personagem: { src: imgNomePersonagem, type: 'input' },
  classe: { src: imgClasse, type: 'input' },
  raca: { src: imgRaca, type: 'input' },
  nivel: { src: imgNivel, type: 'input' },
  escala: { src: imgEscala, type: 'input' },
  deslocamento: { src: imgDeslocamento, type: 'input' },
  tamanho: { src: imgTamanho, type: 'input' },
  tendencia: { src: imgTendencia, type: 'input' },
  anotacoes: { src: imgAnotacoes, type: 'textarea' },
  bio_e_info: { src: imgBioEInfo, type: 'textarea' },
  equipamentos: { src: imgEquipamentos, type: 'textarea' },
  vantagem_desvantagem: { src: imgVantagemDesvantagem, type: 'textarea' },
  invetario: { src: imgInvetario, type: 'textarea' },
  experiencia: { src: imgExperiencia, type: 'input' },
  inspiracao: { src: imgInspiracao, type: 'input' },
  hp_e_mp: { src: imgHpEMp, type: 'static' }, // 'static' para imagens puras
  habilidades: { src: imgHabilidades, type: 'static' },
  d20: { src: imgD20, type: 'static' },
  border: { src: imgBorder, type: 'static' },
  // Atributos
  for: { src: imgFor, type: 'input' },
  des: { src: imgDes, type: 'input' },
  cons: { src: imgCons, type: 'input' },
  sab: { src: imgSab, type: 'input' },
  int: { src: imgInt, type: 'input' },
  car: { src: imgCar, type: 'input' },
  // Saves
  fortitude: { src: imgFortitude, type: 'static' },
  reflexos: { src: imgReflexos, type: 'static' },
  vontade: { src: imgVontade, type: 'static' },
  // Outros
  iniciativa: { src: imgIniciativa, type: 'static' },
  margem_evasao: { src: imgMargemEvasao, type: 'static' },
  mitigacao_dano: { src: imgMitigacaoDano, type: 'static' },
  // Componentes de tabela (saves, etc)
  bonus: { src: imgBonus, type: 'static' },
  mod: { src: imgMod, type: 'static' },
  nvl: { src: imgNvl, type: 'static' },
  total: { src: imgTotal, type: 'static' },
  quadrado_pequeno: { src: imgQuadradoPequeno, type: 'input' },
  slot_medio: { src: imgSlotMedio, type: 'input' },
};

// Proporção da imagem de fundo
const STAGE_RATIO = 827 / 1170;

// --- 3. O COMPONENTE DE ELEMENTO AJUSTÁVEL ---
// Cada item na tela será um desses
const AdjustableElement = ({
  id,
  data,
  asset,
  onUpdate,
  onSelect,
  isSelected,
}) => {
  const { top, left, width, height, inputTop, inputLeft, inputWidth, inputHeight } = data;

  // Atualiza a POSIÇÃO do container (asset)
  const handleDragStop = (e, d) => {
    onUpdate(id, { top: d.y, left: d.x });
  };

  // Atualiza o TAMANHO do container (asset)
  const handleResizeStop = (e, direction, ref, delta, position) => {
    onUpdate(id, {
      width: parseInt(ref.style.width, 10),
      height: parseInt(ref.style.height, 10),
      ...position, // Pega top/left também
    });
  };

  // Atualiza a POSIÇÃO do input (relativo ao asset)
  const handleInputDragStop = (e, d) => {
    e.stopPropagation(); // Impede que o container de fora se mova junto
    onUpdate(id, { inputTop: d.y, inputLeft: d.x });
  };

  // Atualiza o TAMANHO do input
  const handleInputResizeStop = (e, direction, ref, delta, position) => {
    e.stopPropagation();
    onUpdate(id, {
      inputWidth: parseInt(ref.style.width, 10),
      inputHeight: parseInt(ref.style.height, 10),
      inputTop: position.y,
      inputLeft: position.x,
    });
  };

  const borderColor = isSelected ? 'border-blue-500' : 'border-transparent';

  return (
    // Container Principal (Asset)
    <Rnd
      style={{ border: `2px dashed ${isSelected ? '#03a9f4' : 'transparent'}` }}
      size={{ width: width, height: height }}
      position={{ x: left, y: top }}
      onDragStart={onSelect}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onClick={onSelect}
      className="z-10"
    >
      <img
        src={asset.src}
        alt={id}
        className="w-full h-full pointer-events-none" // Imagem preenche o container
      />
      {/* Caixa do Input (Se o tipo não for 'static') */}
      {asset.type !== 'static' && (
        <Rnd
          style={{
            backgroundColor: 'rgba(3, 169, 244, 0.3)',
            border: '2px solid #03a9f4',
            boxSizing: 'border-box',
          }}
          size={{ width: inputWidth, height: inputHeight }}
          position={{ x: inputLeft, y: inputTop }}
          onDragStart={(e) => e.stopPropagation()}
          onDragStop={handleInputDragStop}
          onResizeStop={handleInputResizeStop}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="z-20"
        >
          <span className="text-xs text-white p-1 select-none">Input</span>
        </Rnd>
      )}
    </Rnd>
  );
};

// --- 4. O COMPONENTE PRINCIPAL DA FERRAMENTA ---
const ClassicSheetAdjuster = ({ onBack }) => {
  const [elements, setElements] = useState({}); // Onde guardamos as posições
  const [selectedElementId, setSelectedElementId] = useState(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedElementData = useMemo(() => {
    return selectedElementId ? elements[selectedElementId] : null;
  }, [selectedElementId, elements]);

  // Adiciona um novo elemento ao "palco"
  const handleAddElement = (assetKey) => {
    const asset = ASSET_MANIFEST[assetKey];
    if (!asset) return;

    // Tenta nomear de forma única (ex: fortitude_1, fortitude_2)
    let count = 1;
    let newId = `${assetKey}_${count}`;
    while (elements[newId]) {
      count++;
      newId = `${assetKey}_${count}`;
    }

    setElements((prev) => ({
      ...prev,
      [newId]: {
        assetKey: assetKey,
        top: 10,
        left: 10,
        width: 100, // Tamanho padrão
        height: 50, // Tamanho padrão
        // Padrões do Input
        inputTop: 5,
        inputLeft: 5,
        inputWidth: 80,
        inputHeight: 30,
      },
    }));
    setSelectedElementId(newId);
  };

  // Atualiza um elemento no state
  const handleUpdateElement = (id, newProps) => {
    setElements((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...newProps },
    }));
  };

  // Atualiza pelos inputs numéricos (para precisão)
  const handlePropertyChange = (e) => {
    if (!selectedElementId) return;
    const { name, value } = e.target;
    handleUpdateElement(selectedElementId, { [name]: parseInt(value, 10) || 0 });
  };

  // Exporta o JSON
  const handleExport = () => {
    const json = JSON.stringify(elements, null, 2);
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

  // Importa um JSON
  const handleImportChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedElements = JSON.parse(event.target.result);
        setElements(importedElements);
      } catch (err) {
        console.error("Erro ao importar JSON:", err);
        alert("Arquivo JSON inválido.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Limpa o input
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
          onChange={(e) => handleAddElement(e.target.value)}
          className="bg-gray-700 text-white px-3 py-1 rounded"
          value=""
        >
          <option value="" disabled>Adicionar Elemento...</option>
          {Object.keys(ASSET_MANIFEST).map((key) => (
            <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>
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
          Exportar JSON
        </button>
        {selectedElementId && (
          <button
            onClick={() => {
              const { [selectedElementId]: _, ...rest } = elements;
              setElements(rest);
              setSelectedElementId(null);
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded ml-auto"
          >
            Remover ({selectedElementId})
          </button>
        )}
      </header>

      {/* --- ÁREA DE TRABALHO --- */}
      <div className="flex" style={{ height: 'calc(100vh - 48px)' }}>
        
        {/* O Palco (Stage) */}
        <div className="flex-1 overflow-auto p-4 bg-gray-900" ref={stageRef}>
          <div
            className="mx-auto"
            style={{
              position: 'relative',
              width: '827px', // Largura fixa para facilitar
              height: '1170px', // Altura fixa para facilitar
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={() => setSelectedElementId(null)} // Desseleciona ao clicar no fundo
          >
            {Object.entries(elements).map(([id, data]) => (
              <AdjustableElement
                key={id}
                id={id}
                data={data}
                asset={ASSET_MANIFEST[data.assetKey]}
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
              <h3 className="font-bold text-blue-300">{selectedElementId}</h3>
              <PropertyInput label="Asset Key" name="assetKey" value={selectedElementData.assetKey} readOnly />
              <fieldset className="border border-gray-600 p-2 rounded">
                <legend className="text-sm px-1">Container (Asset)</legend>
                <PropertyInput label="Top" name="top" value={selectedElementData.top} onChange={handlePropertyChange} />
                <PropertyInput label="Left" name="left" value={selectedElementData.left} onChange={handlePropertyChange} />
                <PropertyInput label="Width" name="width" value={selectedElementData.width} onChange={handlePropertyChange} />
                <PropertyInput label="Height" name="height" value={selectedElementData.height} onChange={handlePropertyChange} />
              </fieldset>
              
              {ASSET_MANIFEST[selectedElementData.assetKey]?.type !== 'static' && (
                <fieldset className="border border-blue-500 p-2 rounded">
                  <legend className="text-sm px-1 text-blue-300">Input (Relativo)</legend>
                  <PropertyInput label="Input Top" name="inputTop" value={selectedElementData.inputTop} onChange={handlePropertyChange} />
                  <PropertyInput label="Input Left" name="inputLeft" value={selectedElementData.inputLeft} onChange={handlePropertyChange} />
                  <PropertyInput label="Input Width" name="inputWidth" value={selectedElementData.inputWidth} onChange={handlePropertyChange} />
                  <PropertyInput label="Input Height" name="inputHeight" value={selectedElementData.inputHeight} onChange={handlePropertyChange} />
                </fieldset>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Selecione um elemento para editar suas propriedades.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

// Componente helper para o painel de propriedades
const PropertyInput = ({ label, name, value, onChange, readOnly = false }) => (
  <div className="flex justify-between items-center">
    <label htmlFor={name} className="text-sm text-gray-300">{label}:</label>
    <input
      type={readOnly ? "text" : "number"}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-2/3 p-1 rounded ${readOnly ? 'bg-gray-600 text-gray-400' : 'bg-gray-700 text-white'}`}
    />
  </div>
);

export default ClassicSheetAdjuster;
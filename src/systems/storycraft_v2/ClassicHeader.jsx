// src/systems/storycraft_v2/ClassicHeader.jsx

import React, { useState, useEffect, useMemo } from 'react';

// 1. Importar os assets que este componente usa
import imgNome from '@/package/sheet/nome do personagem.png';
import imgClasse from '@/package/sheet/classe.png';
import imgRaca from '@/package/sheet/raca.png';
import imgNivel from '@/package/sheet/nivel.png';
import imgEscala from '@/package/sheet/escala.png';
import imgDeslocamento from '@/package/sheet/deslocamento.png';
import imgTamanho from '@/package/sheet/tamanho.png';
import imgTendencia from '@/package/sheet/tendencia.png';

// -------------------------------------------------------------------
// 2. LÓGICA DE ESCALA (copiada do CorePanels.jsx V1)
// -------------------------------------------------------------------
const getPowerScale = (level) => {
  level = parseInt(level, 10);
  if (isNaN(level) || level < 1) {
      return { scale: 'N/A', category: 'Desconhecida' };
  }
  if (level >= 1 && level <= 10) return { scale: 0, category: 'Comum' };
  if (level >= 11 && level <= 20) return { scale: 1, category: 'Lendário I' };
  if (level >= 21 && level <= 30) return { scale: 2, category: 'Lendário II' };
  if (level >= 31 && level <= 40) return { scale: 3, category: 'Lendário III' };
  if (level >= 41 && level <= 45) return { scale: 4, category: 'Colossal I' };
  if (level >= 46 && level <= 50) return { scale: 5, category: 'Colossal II' };
  if (level >= 51 && level <= 55) return { scale: 6, category: 'Colossal III' };
  if (level >= 56 && level <= 59) return { scale: 7, category: 'Titânico' };
  if (level === 60) return { scale: 8, category: 'Divino' };
  return { scale: 'N/A', category: 'Além do Divino' }; // Acima de 60
};

// -------------------------------------------------------------------
// 3. O COMPONENTE REUTILIZÁVEL (Asset + Input Transparente)
// -------------------------------------------------------------------
const ClassicInput = ({ fieldName, value, onUpdate, assetImg, top, left, width, height, isTextarea = false, isNumeric = false }) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    // Sincroniza se o valor do 'character' mudar (ex: outro usuário atualizou)
    setLocalValue(value || '');
  }, [value]);

  const handleBlur = () => {
    const originalValue = value || (isNumeric ? 0 : '');
    const finalValue = isNumeric ? (parseInt(localValue, 10) || 0) : localValue;

    if (finalValue !== originalValue) {
      onUpdate(fieldName, finalValue);
    }
  };

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };
  
  // Decide se renderiza <input> ou <textarea>
  const InputComponent = isTextarea ? 'textarea' : 'input';

  return (
    <div style={{ position: 'absolute', top: `${top}px`, left: `${left}px` }}>
      {/* A Imagem de Fundo (o Asset) */}
      <img src={assetImg} alt={fieldName} />
      
      {/* O Input Transparente (a "Mágica") */}
      <InputComponent
        type={isNumeric ? 'number' : 'text'}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="classic-input" // Usa a classe CSS que definiremos
        style={{
          // Posicionamento e tamanho do input
          // Estes valores terão que ser ajustados por você!
          position: 'absolute',
          top: '5px',      // Chute
          left: '100px',   // Chute
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    </div>
  );
};

// -------------------------------------------------------------------
// 4. O COMPONENTE PRINCIPAL DO CABEÇALHO
// -------------------------------------------------------------------
const ClassicHeader = ({ character, onUpdate }) => {
  
  // Calcula a Escala de Poder
  const { category: powerScaleCategory } = useMemo(
    () => getPowerScale(character.level), 
    [character.level]
  );

  return (
    <>
      {/* --- MAPEAMENTO DOS CAMPOS ---
        Aqui nós usamos o componente ClassicInput para cada campo.
        
        SUA TAREFA: Ajustar os valores de 'top', 'left', 'width' e 'height'
        até que o input transparente se alinhe perfeitamente com a imagem do asset.
      */}

      {/* Nome do Personagem */}
      <ClassicInput
        fieldName="name"
        value={character.name}
        onUpdate={onUpdate}
        assetImg={imgNome}
        top={75} left={100} width={300} height={30} 
      />
      
      {/* Raça */}
      <ClassicInput
        fieldName="race"
        value={character.race}
        onUpdate={onUpdate}
        assetImg={imgRaca}
        top={130} left={100} width={200} height={30}
      />
      
      {/* Classe */}
      <ClassicInput
        fieldName="class"
        value={character.class}
        onUpdate={onUpdate}
        assetImg={imgClasse}
        top={130} left={400} width={200} height={30}
      />
      
      {/* Nível */}
      <ClassicInput
        fieldName="level"
        value={character.level}
        onUpdate={onUpdate}
        assetImg={imgNivel}
        top={130} left={700} width={50} height={30}
        isNumeric={true}
      />
      
      {/* Escala (Campo Apenas Leitura) */}
      <div style={{ position: 'absolute', top: 180, left: 100 }}>
        <img src={imgEscala} alt="Escala" />
        <span 
          className="classic-input classic-readonly" // Usamos a mesma classe, mas a tornamos readonly
          style={{ 
            position: 'absolute', 
            top: 5, left: 100, width: 200, height: 30, // Ajuste estes valores
            padding: '5px' // Adiciona padding para alinhar o texto
          }}
        >
          {powerScaleCategory}
        </span>
      </div>

      {/* Deslocamento */}
      <ClassicInput
        fieldName="deslocamento" // Assumindo novo campo 'deslocamento'
        value={character.deslocamento}
        onUpdate={onUpdate}
        assetImg={imgDeslocamento}
        top={180} left={400} width={200} height={30}
      />
      
      {/* Tendências */}
      <ClassicInput
        fieldName="alignment" // Reutilizando campo 'alignment'
        value={character.alignment}
        onUpdate={onUpdate}
        assetImg={imgTendencia}
        top={75} left={700} width={150} height={30}
      />
      
      {/* Tamanho */}
      <ClassicInput
        fieldName="tamanho" // Assumindo novo campo 'tamanho'
        value={character.tamanho}
        onUpdate={onUpdate}
        assetImg={imgTamanho}
        top={130} left={800} width={100} height={30}
      />
    </>
  );
};

export default ClassicHeader;
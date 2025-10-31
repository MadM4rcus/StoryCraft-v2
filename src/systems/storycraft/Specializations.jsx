// src/systems/storycraft/Specializations.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SheetSkin from './SheetSkin.jsx';
import { useAuth } from '../../hooks'; // Necessário para verificar permissão de edição

// --- DADOS DAS PERÍCIAS ---
// Lista fixa de 30 perícias com seus nomes e atributos base
const PREDEFINED_SKILLS = [
  { name: "Acrobacia", attr: "DES" },
  { name: "Adestramento*", attr: "CAR" },
  { name: "Armadilhas*", attr: "INT" },
  { name: "Atletismo", attr: "FOR" },
  { name: "Atuação*", attr: "CAR" },
  { name: "Cavalgar", attr: "DES" },
  { name: "Cirurgia*", attr: "INT" },
  { name: "Conhecimento*", attr: "INT" },
  { name: "Cura", attr: "SAB" },
  { name: "Diplomacia", attr: "CAR" },
  { name: "Disfarce*", attr: "CAR" },
  { name: "Enganação", attr: "CAR" },
  { name: "Furtividade", attr: "DES" },
  { name: "Guerra*", attr: "INT" },
  { name: "Intimidação", attr: "CAR" },
  { name: "Intuição", attr: "SAB" },
  { name: "Investigação", attr: "INT" },
  { name: "Jogatina*", attr: "CAR" },
  { name: "Ladinagem*", attr: "DES" },
  { name: "Luta", attr: "FOR" },
  { name: "Misticismo*", attr: "INT" },
  { name: "Nobreza*", attr: "INT" },
  { name: "Ofício", attr: "INT" },
  { name: "Percepção", attr: "SAB" },
  { name: "Pilotagem*", attr: "DES" },
  { name: "Pontaria", attr: "DES" },
  { name: "Prestidigitação", attr: "DES" },
  { name: "Religião*", attr: "SAB" },
  { name: "Sedução", attr: "CAR" },
  { name: "Sobrevivência", attr: "SAB" }
];

// Mapeia a abreviação do atributo para a chave correspondente no objeto mainAttributes
const ATTR_MAP = {
  "FOR": "forca",
  "DES": "destreza",
  "CON": "constituicao", // Não usado na lista de perícias, mas mantido por completude
  "INT": "inteligencia",
  "SAB": "sabedoria",
  "CAR": "carisma"
};
// --- FIM DADOS DAS PERÍCIAS ---


const SpecializationsList = ({
    character,
    isMaster,
    isCollapsed,
    toggleSection,
    onUpdate,
    onExecuteFormula, // Usado para enviar a rolagem para o feed/Discord
    isEditMode
}) => {
    const { user } = useAuth();
    const canEdit = user.uid === character.ownerUid || isMaster;
    
    // Estado local para debouncing dos inputs "Outros"
    // Armazena o estado das perícias (treinada, bônus)
    const [localSkillSystem, setLocalSkillSystem] = useState(character.skillSystem || {});

    // Inicializa o estado das perícias no personagem se não existir ou estiver incompleto
    useEffect(() => {
        // Verifica se 'skillSystem' não existe ou se falta alguma perícia da lista pré-definida
        const needsInitialization = !character.skillSystem || PREDEFINED_SKILLS.some(skill => !character.skillSystem[skill.name]);
        
        if (needsInitialization && canEdit) {
            console.log("Inicializando sistema de perícias...");
            const initialSkillSystem = { ...character.skillSystem }; // Preserva dados existentes
            PREDEFINED_SKILLS.forEach(skill => {
                if (!initialSkillSystem[skill.name]) {
                    initialSkillSystem[skill.name] = { trained: false, otherBonus: 0 };
                }
            });
            onUpdate('skillSystem', initialSkillSystem);
        }
        
        // Sincroniza o estado local com o do personagem
        setLocalSkillSystem(character.skillSystem || {});
        
    }, [character.skillSystem, onUpdate, canEdit]);

    // Memoriza atributos e nível para evitar recálculos desnecessários
    const mainAttributes = useMemo(() => character.mainAttributes || {}, [character.mainAttributes]);
    const level = useMemo(() => character.level || 0, [character.level]);

    /**
     * Calcula o bônus total para uma perícia com base nas novas regras.
     * Fórmula: Atributo + Bônus Nível 10 + Bônus Treinamento + Outros Bônus
     */
    const calculateTotalBonus = useCallback((skill, skillState) => {
        if (!skillState) return 0;

        // 1. Bônus de Atributo (ex: 'destreza')
        const attrKey = ATTR_MAP[skill.attr];
        const attrBonus = mainAttributes[attrKey] || 0;
        
        // 2. Bônus por Nível 10 (+1 a cada 10 níveis)
        const level10Bonus = Math.floor(level / 10);
        
        // 3. Bônus de Treinamento (+2 base +1 a cada 5 níveis, se treinada)
        let trainingBonus = 0;
        if (skillState.trained) {
            trainingBonus = 2 + Math.floor(level / 5);
        }
        
        // 4. Bônus Variável (Outros)
        const otherBonus = parseInt(skillState.otherBonus, 10) || 0;
        
        // Retorna a soma total
        return attrBonus + level10Bonus + trainingBonus + otherBonus;

    }, [mainAttributes, level]);

    /**
     * Alterna o estado 'trained' de uma perícia e salva na ficha.
     */
    const handleToggleTrained = (skillName) => {
        if (!canEdit || !isEditMode) return;
        
        const currentSkillSystem = character.skillSystem || {};
        const currentSkillState = currentSkillSystem[skillName] || { trained: false, otherBonus: 0 };
        
        const newSkillSystem = {
            ...currentSkillSystem,
            [skillName]: {
                ...currentSkillState,
                trained: !currentSkillState.trained
            }
        };
        onUpdate('skillSystem', newSkillSystem);
    };

    /**
     * Atualiza o estado local do bônus "Outros" enquanto o usuário digita.
     */
    const handleLocalBonusChange = (skillName, value) => {
        setLocalSkillSystem(prev => {
            const currentSkillState = prev[skillName] || { trained: false, otherBonus: 0 };
            return {
                ...prev,
                [skillName]: {
                    ...currentSkillState,
                    otherBonus: value // Armazena como string temporariamente
                }
            };
        });
    };

    /**
     * Salva o bônus "Outros" na ficha (onBlur).
     */
    const handleSaveBonus = (skillName) => {
        if (!canEdit || !isEditMode) return;

        const localValue = localSkillSystem[skillName]?.otherBonus;
        const originalValue = character.skillSystem?.[skillName]?.otherBonus;
        
        // Converte para número para comparação e salvamento corretos
        const finalLocalValue = parseInt(localValue, 10) || 0;
        const finalOriginalValue = parseInt(originalValue, 10) || 0;

        if (finalLocalValue !== finalOriginalValue) {
             // Salva o estado local inteiro para garantir consistência
            const newSkillSystem = { ...character.skillSystem, ...localSkillSystem };
            // Garante que o valor salvo é um número
            newSkillSystem[skillName].otherBonus = finalLocalValue; 
            onUpdate('skillSystem', newSkillSystem);
        }
         
        // Se o valor digitado for inválido (ex: "abc") e virar 0,
        // força a re-sincronização do estado local com o da ficha.
        if (String(localValue) !== String(finalLocalValue)) {
             setLocalSkillSystem(character.skillSystem || {});
        }
    };

    /**
     * Prepara e executa a rolagem de perícia (d20 + bônus total).
     */
    const handleSkillRoll = (skill, totalBonus) => {
        const bonusString = `${totalBonus > 0 ? '+' : ''}${totalBonus}`;
        const action = {
            name: `Perícia: ${skill.name}`,
            components: [
                { type: 'dice', value: '1d20' }, // O dado base
                { type: 'number', value: totalBonus, label: 'Bônus Total' } // O bônus calculado
            ],
            discordText: `Rolagem de ${skill.name} (1d20${bonusString})`
        };
        // Usa a função passada pelo CharacterSheet para rolar e enviar aos feeds
        onExecuteFormula(action);
    };
    
    // Indicador de carregamento enquanto o 'skillSystem' não é inicializado
     if (!localSkillSystem || Object.keys(localSkillSystem).length < PREDEFINED_SKILLS.length) {
        return (
            <SheetSkin title="Perícias" isCollapsed={isCollapsed} toggleSection={toggleSection}>
                <p className="text-textSecondary text-center">Carregando perícias...</p>
            </SheetSkin>
        );
    }

    return (
        <SheetSkin title="Perícias" isCollapsed={isCollapsed} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {PREDEFINED_SKILLS.map(skill => {
                    const skillState = localSkillSystem[skill.name];
                    // Se o estado ainda não foi inicializado (raro, mas seguro), pula a renderização
                    if (!skillState) return null; 
                    
                    const totalBonus = calculateTotalBonus(skill, skillState);
                    const bonusString = `${totalBonus >= 0 ? '+' : ''}${totalBonus}`;

                    return (
                        <div key={skill.name} className="p-3 bg-bgElement rounded-md shadow-sm border border-bgInput flex flex-col gap-2">
                            {/* Linha 1: Checkbox, Nome (Atributo) e Bônus Total */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 flex-grow overflow-hidden">
                                    <input
                                        type="checkbox"
                                        id={`trained-${skill.name}`}
                                        checked={skillState.trained}
                                        onChange={() => handleToggleTrained(skill.name)}
                                        className="form-checkbox text-btnHighlightBg rounded-sm focus:ring-btnHighlightBg disabled:opacity-50"
                                        disabled={!canEdit || !isEditMode}
                                    />
                                    <label
                                        htmlFor={`trained-${skill.name}`}
                                        className="font-semibold text-lg text-textPrimary truncate"
                                        title={`${skill.name} (${skill.attr})`}
                                    >
                                        {skill.name} ({skill.attr})
                                    </label>
                                </div>
                                <span className="font-bold text-lg text-btnHighlightBg whitespace-nowrap ml-2">
                                    {bonusString}
                                </span>
                            </div>
                            
                            {/* Linha 2: Input "Outros" e Botão de Rolar */}
                            <div className="flex items-center gap-2">
                                <label htmlFor={`other-${skill.name}`} className="text-sm text-textSecondary whitespace-nowrap">Outros:</label>
                                <input
                                    type="number"
                                    id={`other-${skill.name}`}
                                    value={skillState.otherBonus === 0 ? '' : skillState.otherBonus}
                                    onChange={(e) => handleLocalBonusChange(skill.name, e.target.value)}
                                    onBlur={() => handleSaveBonus(skill.name)}
                                    className="w-full p-1 bg-bgInput border border-bgElement rounded-md text-textPrimary text-center disabled:bg-bgPage"
                                    placeholder="0"
                                    disabled={!canEdit || !isEditMode}
                                />
                                <button
                                    onClick={() => handleSkillRoll(skill, totalBonus)}
                                    className="px-3 py-1 bg-btnHighlightBg hover:opacity-80 text-btnHighlightText font-bold rounded-lg text-lg"
                                    title={`Rolar ${skill.name} (1d20${bonusString})`}
                                >
                                    🎲
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* O botão "+ Adicionar Perícia" é removido pois a lista agora é fixa */}
        </SheetSkin>
    );
};

export default SpecializationsList;


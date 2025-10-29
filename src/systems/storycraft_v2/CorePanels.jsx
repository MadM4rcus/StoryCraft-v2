// src/systems/storycraft_v2/CorePanels.jsx

import React, { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '@/hooks'; // Desnecessário aqui se a lógica de 'canEdit' ficar no CharacterSheet
// import SheetSkin from './SheetSkin'; // Vamos remover o SheetSkin por enquanto para focar no layout puro

/*
 * Um componente de Input simples para nossos painéis
 * (Podemos movê-lo para um arquivo 'shared' mais tarde)
*/
const SheetInput = ({ label, value, ...props }) => (
    <div className="flex flex-col">
        {label && <label className="text-xs uppercase font-semibold tracking-wider mb-1">{label}</label>}
        <input 
            type="text" 
            value={value}
            className="p-2 bg-transparent border border-[#c9b99a] rounded-md shadow-inner"
            {...props}
        />
    </div>
);

// --- 1. Cabeçalho (Nome, Raça, Classe, etc.) ---
export const CharacterHeader = ({ character, onUpdate, isEditMode }) => {
    // Lógica local de state/save (se necessário) pode vir aqui
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-[#c9b99a] rounded-md">
            <SheetInput label="Nome do Personagem" value={character.name || ''} disabled={!isEditMode} />
            <SheetInput label="Raça" value={character.race || ''} disabled={!isEditMode} />
            <SheetInput label="Classe" value={character.class || ''} disabled={!isEditMode} />
            <SheetInput label="Escala" value={character.escala || ''} disabled={!isEditMode} />
            <SheetInput label="Nível" value={character.level || ''} disabled={!isEditMode} />
            <SheetInput label="Deslocamento" value={character.deslocamento || ''} disabled={!isEditMode} />
            {/* Adicionar Tendências e Tamanho depois */}
        </div>
    );
};

// --- 2. Atributos (FOR, DES, CON, etc.) ---
export const Attributes = ({ character, onUpdate, isEditMode, buffModifiers }) => {
    
    const attributesOrder = ['FOR', 'DES', 'CON', 'SAB', 'INT', 'CAR'];
    
    return (
        <div className="flex justify-around gap-2">
            {attributesOrder.map(attrName => (
                <div key={attrName} className="flex flex-col items-center p-2 border border-[#c9b99a] rounded-md w-20">
                    <label className="text-xl font-bold">{attrName}</label>
                    {/* TODO: Adicionar o valor base e o modificador */}
                    <span className="text-3xl font-bold">10</span>
                    <span className="text-lg">(+0)</span>
                </div>
            ))}
        </div>
    );
};

// --- 3. Vitals (HP, MP, XP, Inspiração) ---
export const Vitals = ({ character, onUpdate, isEditMode }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-[#c9b99a] rounded-md text-center">
                <h3 className="text-lg font-bold uppercase">Pontos de Vida</h3>
                {/* TODO: Adicionar inputs para Base, Nível, Bônus, Total */}
            </div>
            <div className="p-4 border border-[#c9b99a] rounded-md text-center">
                <h3 className="text-lg font-bold uppercase">Pontos de Mana</h3>
                {/* TODO: Adicionar inputs para Base, Nível, Bônus, Total */}
            </div>
            
            {/* Box "Temporários" e "Experiência/Inspiração" */}
            <div className="md:col-span-2 grid grid-cols-3 gap-4">
                <SheetInput label="Temporários" />
                <SheetInput label="Experiência" />
                <SheetInput label="Inspiração" />
            </div>
        </div>
    );
};

// --- 4. Stats de Combate (Iniciativa, Evasão, Mitigação) ---
export const CombatStats = ({ character, onUpdate, isEditMode, buffModifiers }) => {
    return (
        <div className="space-y-4">
            <div className="p-3 border border-[#c9b99a] rounded-md">
                <h4 className="text-sm font-bold uppercase mb-2">Iniciativa</h4>
                {/* TODO: Adicionar inputs para DES, BVE, TOTAL */}
            </div>
            <div className="p-3 border border-[#c9b99a] rounded-md">
                <h4 className="text-sm font-bold uppercase mb-2">Margem de Evasão</h4>
                {/* TODO: Adicionar inputs para DES, BVE, TOTAL */}
            </div>
             <div className="p-3 border border-[#c9b99a] rounded-md">
                <h4 className="text-sm font-bold uppercase mb-2">Mitigação de Dano</h4>
                {/* TODO: Adicionar inputs para CON, EQUIP, TOTAL */}
            </div>
        </div>
    );
};

// --- 5. Testes de Resistência (Fortitude, Vontade, Reflexos) ---
export const SavingThrows = ({ character, onUpdate, isEditMode, buffModifiers }) => {
    const saves = ['Fortitude', 'Vontade', 'Reflexos'];
    return (
        <div className="p-4 border border-[#c9b99a] rounded-md space-y-3">
             {saves.map(save => (
                <div key={save} className="flex items-center justify-between">
                    <span className="text-lg font-bold">{save}</span>
                    <div className="flex gap-1">
                        {/* TODO: Adicionar inputs para MOD, NVL, BONUS, TOTAL */}
                        <input type="text" className="w-10 text-center bg-transparent border border-[#c9b99a] rounded" />
                        <input type="text" className="w-10 text-center bg-transparent border border-[#c9b99a] rounded" />
                        <input type="text" className="w-10 text-center bg-transparent border border-[#c9b99a] rounded" />
                        <input type="text" className="w-10 text-center bg-transparent border border-[#c9b99a] rounded" />
                    </div>
                </div>
             ))}
        </div>
    );
};

// --- 6. Perícias ---
export const SkillsPanel = ({ character, onUpdate, isEditMode }) => {
    // Como você mencionou, 'Perícias' (Specializations) vai mudar muito.
    // Por enquanto, este é apenas o placeholder do container.
    return (
        <div className="p-4 border border-[#c9b99a] rounded-md">
            <h3 className="text-xl font-bold text-center uppercase mb-4">Perícias</h3>
            <div className="space-y-2">
                {/* A nova lista de perícias virá aqui */}
                <p className="text-center text-gray-500">...</p>
            </div>
        </div>
    );
};
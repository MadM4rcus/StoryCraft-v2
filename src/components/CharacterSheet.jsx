import React, { useState, useMemo } from 'react';
import { useCharacter } from '../hooks/useCharacter.js';
import Modal from './Modal.jsx';
import CharacterInfoSection from './CharacterInfoSection.jsx';
import MainAttributesSection from './MainAttributesSection.jsx';
import ActionsSection from './ActionsSection.jsx';
import BuffsSection from './BuffsSection.jsx';
import AttributesSection from './AttributesSection.jsx';
import WalletSection from './WalletSection.jsx';
import InventorySection from './InventorySection.jsx';
import PerksSection from './PerksSection.jsx';
import SkillsSection from './SkillsSection.jsx';
import SpecializationsSection from './SpecializationsSection.jsx';
import EquippedItemsSection from './EquippedItemsSection.jsx';
import StorySection from './StorySection.jsx';
import NotesSection from './NotesSection.jsx';
import DiscordIntegrationSection from './DiscordIntegrationSection.jsx';
import ActionButtons from './ActionButtons.jsx';

const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, toggleSection } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
  const [modal, setModal] = useState({ isVisible: false });

  // A lógica do useMemo e a função handleShowOnDiscord foram movidas para fora das condições
  // para respeitar as Regras dos Hooks (Rules of Hooks).
  const allAttributes = useMemo(() => {
    if (!character) return [];
    const mainAttrs = ['Iniciativa', 'FA', 'FM', 'FD'];
    const dynamicAttrs = (character.attributes || []).map(attr => attr.name).filter(Boolean);
    return [...mainAttrs, ...dynamicAttrs];
  }, [character]);

  const buffModifiers = useMemo(() => {
    const modifiers = {};
    if (!character?.buffs) return modifiers;

    character.buffs.forEach(buff => {
      if (buff.isActive && buff.type === 'attribute' && buff.target) {
        const value = parseInt(buff.value, 10) || 0;
        modifiers[buff.target] = (modifiers[buff.target] || 0) + value;
      }
    });
    return modifiers;
  }, [character?.buffs]);

  const handleShowOnDiscord = async (title, description) => {
    if (!character) return;

    const embed = {
        author: {
            name: character.name || 'Personagem',
            icon_url: character.photoUrl || 'https://placehold.co/64x64/7c3aed/FFFFFF?text=SC'
        },
        title: title || "Sem Título",
        description: description || "Sem Descrição.",
        color: 0x7c3aed, // Roxo
    };

    if (character.discordWebhookUrl) {
        try {
            await fetch(character.discordWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });
        } catch (e) {
            console.error("Falha ao enviar para o Discord:", e);
            setModal({ isVisible: true, message: `Falha ao enviar para o Discord: ${e.message}`, type: 'info', onConfirm: () => setModal({ isVisible: false }) });
        }
    } else {
        const discordCommand = `**${title || "Sem Título"}**\n${description || "Sem Descrição."}`;
        setModal({
            isVisible: true,
            message: 'Webhook do Discord não configurado. Copie e cole no Discord:',
            type: 'info',
            copyText: discordCommand,
            showCopyButton: true,
            onConfirm: () => setModal({ isVisible: false }),
        });
    }
  };


  if (loading) {
    return <div className="text-center p-8"><p className="text-xl text-gray-300">A carregar ficha...</p></div>;
  }
  if (!character) {
    return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>;
  }
  
  const sections = {
      info: 'isCharacterInfoCollapsed', main: 'isMainAttributesCollapsed', actions: 'isActionsCollapsed',
      buffs: 'isBuffsCollapsed', attributes: 'isAttributesCollapsed', wallet: 'isWalletCollapsed',
      inventory: 'isInventoryCollapsed', perks: 'isPerksCollapsed', skills: 'isSkillsCollapsed',
      specializations: 'isSpecializationsCollapsed', equipped: 'isEquippedItemsCollapsed', discord: 'isDiscordCollapsed',
      story: 'isStoryCollapsed', notes: 'isNotesCollapsed'
  };

  const handleExportJson = () => {
    if (!character) return;
    const { collapsedStates, ...exportData } = character;
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${character.name || 'ficha'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => {
    setModal({
      isVisible: true,
      message: `Tem a certeza que deseja resetar PERMANENTEMENTE a ficha de "${character.name}"? Esta ação não pode ser desfeita.`,
      type: 'confirm',
      onConfirm: async () => {
        const fieldsToReset = {
            photoUrl: '', age: '', height: '', gender: '', race: '', class: '', alignment: '', level: 1, xp: 0,
            mainAttributes: { hp: { current: 10, max: 10, temp: 0 }, mp: { current: 10, max: 10 }, initiative: 0, fa: 0, fm: 0, fd: 0 },
            attributes: [], inventory: [], wallet: { zeni: 0, inspiration: 0 }, advantages: [], disadvantages: [], abilities: [],
            specializations: [], equippedItems: [], history: [], notes: [], buffs: [], formulaActions: [],
            discordWebhookUrl: '',
        };
        for (const [field, value] of Object.entries(fieldsToReset)) {
            await updateCharacterField(field, value);
        }
        setModal({ isVisible: false });
      },
      onCancel: () => setModal({ isVisible: false }),
    });
  };


  return (
    <div className="w-full max-w-4xl mx-auto">
      {modal.isVisible && <Modal {...modal} onCancel={() => setModal({ isVisible: false })} />}
      <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg">
        ← Voltar para a Lista
      </button>

      <CharacterInfoSection character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.[sections.info]} toggleSection={() => toggleSection(sections.info)} />
      <MainAttributesSection character={character} onUpdate={updateCharacterField} isMaster={isMaster} buffModifiers={buffModifiers} isCollapsed={character.collapsedStates?.[sections.main]} toggleSection={() => toggleSection(sections.main)} />
      <ActionsSection isCollapsed={character.collapsedStates?.[sections.actions]} toggleSection={() => toggleSection(sections.actions)} />
      <BuffsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} allAttributes={allAttributes} isCollapsed={character.collapsedStates?.[sections.buffs]} toggleSection={() => toggleSection(sections.buffs)} />
      <AttributesSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} buffModifiers={buffModifiers} isCollapsed={character.collapsedStates?.[sections.attributes]} toggleSection={() => toggleSection(sections.attributes)} />
      <WalletSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.wallet]} toggleSection={() => toggleSection(sections.wallet)} />
      <InventorySection character={character} isMaster={isMaster} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.[sections.inventory]} toggleSection={() => toggleSection(sections.inventory)} />
      <PerksSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.[sections.perks]} toggleSection={() => toggleSection(sections.perks)} />
      <SkillsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.[sections.skills]} toggleSection={() => toggleSection(sections.skills)} />
      <SpecializationsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.specializations]} toggleSection={() => toggleSection(sections.specializations)} />
      <EquippedItemsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.[sections.equipped]} toggleSection={() => toggleSection(sections.equipped)} />
      <StorySection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.story]} toggleSection={() => toggleSection(sections.story)} />
      
      <NotesSection
        character={character}
        isMaster={isMaster}
        onUpdate={updateCharacterField}
        isCollapsed={character.collapsedStates?.[sections.notes]}
        toggleSection={() => toggleSection(sections.notes)}
      />

      <DiscordIntegrationSection
        character={character}
        isMaster={isMaster}
        onUpdate={updateCharacterField}
        isCollapsed={character.collapsedStates?.[sections.discord]}
        toggleSection={() => toggleSection(sections.discord)}
      />

      <ActionButtons
        character={character}
        onExport={handleExportJson}
        onReset={handleReset}
      />
    </div>
  );
};

export default CharacterSheet;



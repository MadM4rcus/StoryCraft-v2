import React, { useState } from 'react';
import { useGlobalControls } from '@/context/GlobalControlsContext';
import { useAuth } from '@/hooks/useAuth';
import { useUIState } from '@/context/UIStateContext'; // 1. Importar o novo contexto de UI
import { useSystem } from '@/context/SystemContext'; // 1. Importar para saber o personagem ativo
import { useRollFeed } from '@/context/RollFeedContext'; // 2. Importar para a função de rolagem

// Componente de botão de navegação, movido do FloatingNav para cá.
const NavButton = ({ href, title, children }) => (
  <a
    href={href}
    title={title}
    className="bg-bgElement hover:bg-opacity-80 text-textPrimary w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-md transition-transform transform hover:scale-110 border border-bgInput"
  >
    {children}
  </a>
);

// Constantes movidas do FloatingNav
const V1_SECTIONS = [
    { href: '#info', title: 'Informações', icon: '👤' },
    { href: '#main-attributes', title: 'Atributos Principais', icon: '❤️' },
    { href: '#actions', title: 'Ações', icon: '⚔️' },
    { href: '#buffs', title: 'Buffs', icon: '✨' },
    { href: '#wallet', title: 'Carteira', icon: '💰' },
    { href: '#inventory', title: 'Inventário', icon: '🎒' },
    { href: '#equipped', title: 'Equipados', icon: '🛡️' },
    { href: '#perks', title: 'Vantagens', icon: '🌟' },
    { href: '#skills', title: 'Habilidades', icon: '🎯' },
    { href: '#specializations', title: 'Especializações', icon: '📜' },
    { href: '#story', title: 'História', icon: '📖' },
    { href: '#notes', title: 'Anotações', icon: '📝' },
    { href: '#discord', title: 'Discord', icon: '💬' },
];
const DICE_TYPES = [2, 3, 4, 6, 8, 10, 12, 20, 50, 100];

const GlobalControls = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRollPanelOpen, setIsRollPanelOpen] = useState(false);
  const { isEditMode, setIsEditMode, setIsThemeEditorOpen } = useGlobalControls();
  const { isRollFeedVisible, setIsRollFeedVisible, isPartyHealthMonitorVisible, setIsPartyHealthMonitorVisible } = useUIState(); // 2. Usar o estado de visibilidade
  const { user, isMaster } = useAuth();
  const { activeCharacter, setActiveCharacter } = useSystem(); // 3. Pega o personagem ativo e o setter
  const { addRollToFeed } = useRollFeed();

  // Ícone para o botão minimizado
  const collapsedIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 16v-2m8-6h2M4 12H2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414M19.778 4.222l-1.414 1.414M6.636 19.778l-1.414 1.414" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
    </svg>
  );

  // O botão de edição só deve aparecer se houver uma ficha ativa.
  const canToggleEditMode = !!activeCharacter && (isMaster || (user && user.uid === activeCharacter.ownerUid));

  // Lógica de rolagem rápida, movida do FloatingNav
  const handleQuickRoll = async (sides) => {
    if (!activeCharacter) return;

    const result = Math.floor(Math.random() * sides) + 1;
    setIsRollPanelOpen(false);

    let discordText = `Rolagem de d${sides}\n**Resultado: ${result}**`;
    if (activeCharacter.discordWebhookUrl) {
      try {
        await fetch(activeCharacter.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [{ title: `Rolagem de d${sides}`, description: `**Resultado: ${result}**`, color: 7506394 }] })
        });
      } catch (error) {
        console.error('Failed to send to Discord:', error);
        discordText = `(Falha ao enviar para o Discord) ${discordText}`;
      }
    }

    addRollToFeed({
      characterName: activeCharacter.name || 'Narrador',
      rollName: `Rolagem Rápida de d${sides}`,
      results: [{ value: result, displayValue: `d${sides} (${result})` }],
      discordText: discordText
    });
  };

  if (isCollapsed) {
    return (
      <div
        className="fixed bottom-4 right-4 bg-btnHighlightBg text-btnHighlightText p-3 rounded-full shadow-lg cursor-pointer hover:opacity-90 z-40"
        onClick={() => setIsCollapsed(false)}
        title="Expandir Controles"
      >
        {collapsedIcon}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-bgSurface/90 backdrop-blur-md p-2 rounded-xl shadow-2xl border border-bgElement flex flex-col">
      <div 
        className="flex justify-between items-center pb-2 mb-2 border-b border-bgElement cursor-pointer"
        onClick={() => setIsCollapsed(true)}
      >
        <h3 className="font-bold text-textAccent px-2">Controles</h3>
        <button className="text-textSecondary hover:text-textPrimary" title="Recolher">
          —
        </button>
      </div>

      <div className="p-2 flex flex-col space-y-2 max-h-[70vh] overflow-y-auto">
        {/* Botões de visibilidade de painéis (sempre visíveis quando expandido) */}
        <button
          onClick={() => setIsRollFeedVisible(!isRollFeedVisible)}
          className="w-full px-3 py-2 text-sm font-bold rounded-md shadow-md transition-colors bg-bgElement text-textPrimary hover:bg-opacity-80"
          title="Mostrar/Ocultar o painel de Chat e Rolagens."
        >
          {isRollFeedVisible ? 'Ocultar Chat' : 'Mostrar Chat'}
        </button>
        <button
          onClick={() => setIsPartyHealthMonitorVisible(!isPartyHealthMonitorVisible)}
          className="w-full px-3 py-2 text-sm font-bold rounded-md shadow-md transition-colors bg-bgElement text-textPrimary hover:bg-opacity-80"
          title="Mostrar/Ocultar o painel de Monitor de Grupo."
        >
          {isPartyHealthMonitorVisible ? 'Ocultar Grupo' : 'Mostrar Grupo'}
        </button>

        {/* Divisor para separar os tipos de botões */}
        {(!activeCharacter || activeCharacter) && <hr className="border-bgElement my-2" />}


        {/* Botões que aparecem quando NÃO há ficha ativa (no Dashboard) */}
        {!activeCharacter && (
          <button
            onClick={() => setIsThemeEditorOpen(true)}
            className="w-full px-3 py-2 text-sm font-bold rounded-md shadow-md transition-colors bg-bgElement text-textPrimary hover:bg-opacity-80"
            title="Abrir o editor de temas visuais para a aplicação."
          >
            🎨 Editor de Temas
          </button>
        )}

        {/* Botões que aparecem QUANDO uma ficha V1 está ativa */}
        {activeCharacter && (
          <>
            <button 
              onClick={() => setActiveCharacter(null)} 
              className="w-full px-3 py-2 text-sm font-bold rounded-md shadow-md transition-colors bg-bgElement text-textPrimary hover:bg-opacity-80"
              title="Voltar para a tela de seleção de personagens."
            >
              ← Voltar para a Lista
            </button>
            {canToggleEditMode && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)} 
              className={`w-full px-3 py-2 text-sm font-bold rounded-md shadow-md transition-colors ${isEditMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-bgElement text-textPrimary hover:bg-opacity-80'}`}
              title="Ativa/Desativa a edição em todas as seções da ficha."
            >
              {isEditMode ? '🔒 Sair Edição' : '✏️ Modo Edição'}
            </button>
            )}
            <hr className="border-bgElement my-2" />
            <div className="grid grid-cols-3 gap-2">
              {V1_SECTIONS.map(section => (
                <NavButton key={section.href} href={section.href} title={section.title}>
                  {section.icon}
                </NavButton>
              ))}
              {/* Lógica do QuickRoll Integrada */}
              <div className="relative col-span-1">
                <button
                  onClick={() => setIsRollPanelOpen(!isRollPanelOpen)}
                  title="Rolagem Rápida"
                  className="bg-bgElement hover:bg-opacity-80 text-textPrimary w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-md transition-transform transform hover:scale-110 border border-bgInput"
                >
                  🎲
                </button>
                {isRollPanelOpen && (
                  <div className="absolute bottom-full mb-2 right-0 bg-bgSurface/95 backdrop-blur-md p-2 rounded-xl shadow-2xl border border-bgElement w-40">
                    <div className="grid grid-cols-2 gap-2">
                      {DICE_TYPES.map((sides) => (
                        <button key={sides} onClick={() => handleQuickRoll(sides)} className="bg-bgElement hover:bg-btnHighlightBg text-textPrimary font-bold py-2 px-4 rounded-lg transition-colors">
                          d{sides}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalControls;
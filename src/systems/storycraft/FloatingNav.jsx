// src/components/FloatingNav.jsx

import React, { useState, useCallback } from 'react';
import { useRollFeed } from '@/context/RollFeedContext';

const DICE_TYPES = [2, 3, 4, 6, 8, 10, 12, 20, 50, 100];

// Componente de botão de navegação, mantido como estava.
const NavButton = ({ href, title, children }) => (
  <a
    href={href}
    title={title}
    className="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-md transition-transform transform hover:scale-110 border border-gray-600"
  >
    {children}
  </a>
);

const FloatingNav = ({ character }) => {
  const [isRollPanelOpen, setIsRollPanelOpen] = useState(false);
  const { addRollToFeed } = useRollFeed();

  const sendToDiscord = useCallback(async (title, description) => {
    const discordText = `${title}\n${description}`;
    if (character && character.discordWebhookUrl) {
      try {
        await fetch(character.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: title,
              description: description.replace(/\*/g, ''),
              color: 7506394,
            }]
          })
        });
      } catch (error) {
        console.error('Failed to send to Discord:', error);
        alert(`Falha ao enviar para o Discord: ${error.message}`);
        return null;
      }
      return discordText;
    } else {
      alert(`Webhook do Discord não configurado. Copie o comando:\n\n${discordText}`);
      return null;
    }
  }, [character]);

  const handleQuickRoll = async (sides) => {
    const result = Math.floor(Math.random() * sides) + 1;
    setIsRollPanelOpen(false);

    const discordMessage = await sendToDiscord(`Rolagem de d${sides}`, `**Resultado: ${result}**`);

    addRollToFeed({ characterName: character?.name || 'Narrador', rollName: `Rolagem Rápida de d${sides}`, results: [{ value: result, displayValue: `d${sides} (${result})` }], discordText: discordMessage });
  };

  const sections = [
    { href: '#info', title: 'Informações', icon: '👤' },
    { href: '#main-attributes', title: 'Atributos Principais', icon: '❤️' },
    { href: '#actions', title: 'Ações', icon: '⚔️' },
    { href: '#buffs', title: 'Buffs', icon: '✨' },
    { href: '#wallet', title: 'Carteira', icon: '💰' },
    { href: '#inventory', title: 'Inventário', icon: '🎒' },
    { href: '#equipped', title: 'Equipados', icon: '🛡️' }, // <-- MOVIDO PARA CÁ
    { href: '#perks', title: 'Vantagens', icon: '🌟' },
    { href: '#skills', title: 'Habilidades', icon: '🎯' },
    { href: '#specializations', title: 'Especializações', icon: '📜' },
    { href: '#story', title: 'História', icon: '📖' },
    { href: '#notes', title: 'Anotações', icon: '📝' },
    { href: '#discord', title: 'Discord', icon: '💬' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-gray-900 bg-opacity-80 backdrop-blur-sm p-2 rounded-xl shadow-2xl border border-gray-700">
      <div className="grid grid-cols-2 gap-2">
        {sections.map(section => (
          <NavButton key={section.href} href={section.href} title={section.title}>
            {section.icon}
          </NavButton>
        ))}
        {/* --- Início da Lógica do QuickRoll Integrada --- */}
        <div className="relative">
          <button
            onClick={() => setIsRollPanelOpen(!isRollPanelOpen)}
            title="Rolagem Rápida"
            className="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-md transition-transform transform hover:scale-110 border border-gray-600"
          >
            🎲
          </button>
          {isRollPanelOpen && (
            <div className="absolute bottom-full mb-2 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm p-2 rounded-xl shadow-2xl border border-gray-700 w-40">
              <div className="grid grid-cols-2 gap-2">
                {DICE_TYPES.map((sides) => (
                  <button key={sides} onClick={() => handleQuickRoll(sides)} className="bg-gray-700 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    d{sides}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* --- Fim da Lógica do QuickRoll Integrada --- */}
      </div>
    </div>
  );
};

export default FloatingNav;
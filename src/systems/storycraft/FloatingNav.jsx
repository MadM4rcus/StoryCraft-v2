// src/components/FloatingNav.jsx

import React from 'react';
import QuickRoll from './QuickRoll'; // Import the new component

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
  // Array de seções com a NOVA ORDEM
  const sections = [
    { href: '#info', title: 'Informações', icon: '👤' },
    { href: '#main-attributes', title: 'Atributos Principais', icon: '❤️' },
    { href: '#attributes', title: 'Atributos', icon: '📊' },
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
        <QuickRoll character={character} />
      </div>
    </div>
  );
};

export default FloatingNav;
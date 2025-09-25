// src/components/QuickRoll.jsx
import React, { useState, useCallback } from 'react';

const DICE_TYPES = [2, 3, 4, 6, 8, 10, 12, 20, 50, 100];

const QuickRoll = ({ character }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sendToDiscord = useCallback(async (title, description) => {
    if (character && character.discordWebhookUrl) {
      try {
        await fetch(character.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: title,
              description: description,
              color: 7506394, // A nice purple color
            }]
          })
        });
      } catch (error) {
        console.error('Failed to send to Discord:', error);
        // Maybe show a modal here? For now, just log it.
      }
    } else {
      // Fallback or alert if no webhook is configured
      const command = `**${title}**\n${description}`;
      // This part needs a modal system to be in place.
      // For now, we can just alert the user.
      alert(`Webhook do Discord não configurado. Copie o comando:\n\n${command}`);
    }
  }, [character]);

  const handleRoll = (sides) => {
    const result = Math.floor(Math.random() * sides) + 1;
    sendToDiscord(`Rolagem de d${sides}`, `**Resultado: ${result}**`);
    setIsOpen(false); // Close panel after rolling
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Rolagem Rápida"
        className="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-md transition-transform transform hover:scale-110 border border-gray-600"
      >
        🎲
      </button>
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm p-2 rounded-xl shadow-2xl border border-gray-700 w-40">
          <div className="grid grid-cols-2 gap-2">
            {DICE_TYPES.map((sides) => (
              <button
                key={sides}
                onClick={() => handleRoll(sides)}
                className="bg-gray-700 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                d{sides}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickRoll;

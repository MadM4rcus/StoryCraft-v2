import React, { useState } from 'react';
import { useRollFeed } from '@/context';
import { useAuth, useCharacter } from '@/hooks';

const ChatInput = () => {
  const [message, setMessage] = useState('');
  const { addMessageToFeed } = useRollFeed();
  const { user } = useAuth();
  const { character } = useCharacter(); // Pega o personagem ativo do contexto

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;

    addMessageToFeed({
      characterName: character?.name || user.displayName || 'Usuário',
      text: message,
      ownerUid: user.uid,
    });

    setMessage('');
  };

  return (
    <form onSubmit={handleSendMessage} className="p-3 border-t border-bgElement">
      <div className="flex items-center bg-bgInput rounded-md">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="w-full bg-transparent p-2 text-textPrimary placeholder-textSecondary focus:outline-none"
        />
        <button type="submit" className="p-2 text-textAccent hover:opacity-80 disabled:opacity-50" disabled={!message.trim()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
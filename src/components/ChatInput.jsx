import React, { useState } from 'react';
import { useRollFeed, useSystem } from '@/context';
import { useAuth } from '@/hooks';

const ChatInput = () => {
  const [message, setMessage] = useState('');
  const { addMessageToFeed, addRollToFeed } = useRollFeed();
  const { user } = useAuth();
  const { activeCharacter } = useSystem();

  /**
   * Safely evaluates a mathematical expression.
   * @param {string} fn - The expression to evaluate.
   * @returns {number}
   */
  const evil = (fn) => {
    // eslint-disable-next-line no-new-func
    return new Function('return ' + fn)();
  };

  /**
   * Parses a dice formula string (e.g., "1d20+5", "((1d6-1)*2)") and returns the roll details.
   * @param {string} formula - The dice formula.
   * @returns {{results: Array, totalResult: number, finalExpression: string}}
   */
  const parseAndRoll = (rawFormula) => {
    const rollResultsForFeed = [];
    let expressionForEval = rawFormula.replace(/\s/g, '');

    // Regex to find all dice notations (e.g., 1d20, 4d6)
    const diceRegex = /(\d+d\d+)/gi;
    const diceMatches = rawFormula.match(diceRegex);

    if (diceMatches) {
      diceMatches.forEach(diceString => {
        const [numDiceStr, numSidesStr] = diceString.split('d');
        const numDice = parseInt(numDiceStr, 10) || 1;
        const numSides = parseInt(numSidesStr, 10);

        if (isNaN(numSides) || numSides <= 0) return;

        let rolls = [];
        let diceRollResult = 0;
        for (let d = 0; d < numDice; d++) {
          const roll = Math.floor(Math.random() * numSides) + 1;
          rolls.push(roll);
          diceRollResult += roll;
        }

        // Add to the feed display
        rollResultsForFeed.push({
          type: 'dice',
          value: diceRollResult,
          displayValue: `${diceString}(${rolls.join('+')})`
        });

        // Replace the first occurrence of the dice string in the expression with its result
        expressionForEval = expressionForEval.replace(diceString, `(${diceRollResult})`);
      });
    }

    // Sanitize the expression to only allow numbers, operators, and parentheses
    const sanitizedExpression = expressionForEval.replace(/[^0-9+\-*/().]/g, '');

    let totalResult = 0;
    try {
      // Safely evaluate the final mathematical expression
      totalResult = evil(sanitizedExpression);
      if (isNaN(totalResult)) {
        throw new Error("Invalid mathematical expression.");
      }
    } catch (error) {
      console.error("Error evaluating roll expression:", error);
      return { results: [], totalResult: 0, finalExpression: "Erro na fórmula" };
    }

    return { results: rollResultsForFeed, totalResult, finalExpression: sanitizedExpression };
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage === '') return;

    if (trimmedMessage.toLowerCase().startsWith('r ')) {
      const formula = trimmedMessage.substring(2);
      // Apenas executa a rolagem se a fórmula não estiver vazia
      if (formula.trim()) {
        const { results, totalResult, finalExpression } = parseAndRoll(formula);
        addRollToFeed({
          characterName: activeCharacter?.name || user.displayName || 'Usuário',
          rollName: `Rolagem: ${finalExpression || formula}`,
          results,
          totalResult,
          ownerUid: user.uid,
        });
      } else {
        // Se for apenas "r ", envia como mensagem normal
        addMessageToFeed({
          characterName: activeCharacter?.name || user.displayName || 'Usuário',
          text: message,
          ownerUid: user.uid,
        });
      }
    } else {
      addMessageToFeed({
        characterName: activeCharacter?.name || user.displayName || 'Usuário',
        text: message,
        ownerUid: user.uid,
      });
    }

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
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUIState } from '@/context/UIStateContext';
import { useEventManager } from '@/context/EventManagerContext';

const EventManager = ({ onCharacterClick }) => {
  const { isMaster } = useAuth();
  const { layout, updateLayout, isSpoilerMode } = useUIState();
  const { 
    allCharacters, 
    events, 
    createEvent, 
    deleteEvent, 
    addCharacterToEvent,
    removeCharacterFromEvent,
    actionRequests,
    approveActionRequest,
    denyActionRequest,
    saveEvent,
    refreshEvent, // Importa a nova função
    loadEventsFromFirestore // Importa a nova função
  } = useEventManager();

  // Ferramenta de Diagnóstico: Adiciona um log sempre que os eventos mudarem.
  useEffect(() => {
    if (isMaster) {
      console.log('[DIAGNÓSTICO] EventManager recebeu eventos atualizados:', events);
      console.log('[DIAGNÓSTICO] EventManager actionRequests atuais:', actionRequests);
    }
  }, [events, actionRequests, isMaster]);

  const [newEventName, setNewEventName] = useState('');
  const [managingEventId, setManagingEventId] = useState(null); // Which event's character list is open

  const togglePosition = () => {
    updateLayout({ eventManager: layout.eventManager === 'top-left' ? 'top-right' : 'top-left' });
  };

  const handleCharacterClick = (char) => {
    if (isMaster && onCharacterClick) {
      onCharacterClick(char);
    }
  };

  const handleCreateEvent = () => {
    if (newEventName.trim()) {
      createEvent(newEventName.trim());
      setNewEventName('');
    }
  };
  
  const renderCharacterHealth = (char) => {
    const hp = char.mainAttributes?.hp || { current: '?', max: '?', temp: 0 };
    const mp = char.mainAttributes?.mp || { current: '?', max: '?' };
    
    const isSpoiler = isMaster && !isSpoilerMode && char.flags?.spoiler;
    const nameClasses = `font-bold text-textPrimary truncate ${isSpoiler ? 'blur-sm' : ''}`;

    return (
      <div 
        key={char.id} 
        className={`p-2 bg-bgElement rounded-md border border-bgInput ${isMaster ? 'cursor-pointer hover:border-btnHighlightBg' : 'cursor-default'}`}
        onClick={() => handleCharacterClick(char)}
        title={isMaster ? `Clique para ir para a ficha de ${char.name}`: ''}
      >
        <div className="flex justify-between items-center">
          <p className={nameClasses}>{char.name}</p>
          {isMaster && managingEventId && (
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeCharacterFromEvent(managingEventId, char.id);
                }}
                className="text-red-500 hover:text-red-400 text-xs"
                title="Remover do evento"
              >
              X
            </button>
          )}
        </div>
        <div className="text-sm flex justify-between">
          <span className="text-red-400">HP: {hp.current}/{hp.max} {hp.temp > 0 ? `(+${hp.temp})` : ''}</span>
          <span className="text-blue-400">MP: {mp.current}/{mp.max}</span>
        </div>
      </div>
    );
  };
  
  // Memoize character map for quick lookups
  const characterMap = useMemo(() => 
    allCharacters.reduce((acc, char) => {
      acc[char.id] = char;
      return acc;
    }, {}), [allCharacters]);


  const positionClass = layout.eventManager === 'top-left' ? 'left-4' : 'right-4';

  // --- GM VIEW ---
  const renderGmView = () => (
    <>
      <div className="p-3 border-b border-bgElement">
        <h4 className="text-sm font-semibold text-textSecondary mb-2">Novo Evento</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            placeholder="Nome do combate..."
            className="flex-grow bg-bgInput text-textPrimary border border-bgElement rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-btnHighlightBg"
          />
          <button
            onClick={handleCreateEvent}
            className="px-3 py-1 bg-green-600 text-white font-bold rounded-md text-sm hover:bg-green-700"
          >
            Criar
          </button>
          <button
            onClick={loadEventsFromFirestore}
            className="px-3 py-1 bg-blue-600 text-white font-bold rounded-md text-sm hover:bg-blue-700"
            title="Carregar eventos salvos do banco de dados"
          >
            📂
          </button>
        </div>
      </div>

      {/* Action Requests Section */}
      <div className="p-3 border-b border-bgElement">
        <h4 className="text-sm font-semibold text-textSecondary mb-2">Ações Pendentes</h4>
        <div className="space-y-2">
          {actionRequests.filter(req => req.status === 'pending').length === 0 ? (
            <p className="text-textSecondary italic text-xs text-center">Nenhuma ação pendente.</p>
          ) : (
            actionRequests.filter(req => req.status === 'pending').map(req => {
              const targetNames = (req.targetIds || [req.targetId]).map(id => characterMap[id]?.name || '??').join(', ');
              const effectType = req.action.targetEffect || 'damage';
              let effectLabel = 'Dano';
              let effectColor = 'text-red-400';
              
              if (effectType === 'heal') { effectLabel = 'Cura'; effectColor = 'text-green-400'; }
              if (effectType === 'healTemp') { effectLabel = 'Ganho HP Bônus'; effectColor = 'text-green-300'; }
              if (effectType === 'damageTemp') { effectLabel = 'Dano HP Bônus'; effectColor = 'text-red-300'; }
              if (effectType === 'damageMP') { effectLabel = 'Dano MP'; effectColor = 'text-purple-400'; }
              if (effectType === 'healMP') { effectLabel = 'Cura MP'; effectColor = 'text-blue-400'; }
              if (effectType === 'cost') { effectLabel = 'Custo de Ação'; effectColor = 'text-yellow-500'; }
              if (effectType === 'selfHeal') { effectLabel = 'Auto-Recuperação'; effectColor = 'text-teal-400'; }

              return (
              <div key={req.id} className="bg-bgInput p-2 rounded-md text-sm border border-bgElement">
                <p className="text-textPrimary">
                  <span className="font-bold">{characterMap[req.actorId]?.name || '??'}</span> usa <span className="font-bold text-textAccent">{req.action.name}</span>
                  <br/>
                  Alvos: <span className="font-bold">{targetNames}</span>
                </p>
                {req.action.acertoResult && (
                  <p className="text-xs text-textSecondary mt-1">Acerto: <span className="font-bold text-textPrimary">{req.action.acertoResult.total}</span></p>
                )}
                {req.action.totalResult !== undefined && (
                  <p className="text-xs text-textSecondary mt-1">
                    {effectType === 'cost' || effectType === 'selfHeal' ? 'Detalhes:' : 'Resultado/Dano:'}
                    <span className="font-bold text-textPrimary ml-1">{req.action.totalResult}</span>
                  </p>
                )}
                <p className={`text-xs font-bold mt-1 ${effectColor}`}>Tipo: {effectLabel}</p>
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => approveActionRequest(req.id)} className="px-2 py-1 bg-green-600 text-white font-bold rounded-md text-xs hover:bg-green-700">Aprovar</button>
                  <button onClick={() => denyActionRequest(req.id)} className="px-2 py-1 bg-red-600 text-white font-bold rounded-md text-xs hover:bg-red-700">Negar</button>
                </div>
              </div>
            )})
          )}
        </div>
      </div>

      <div className="flex-grow p-3 overflow-y-auto space-y-3 max-h-[calc(100vh-350px)]">
        {events.length === 0 ? (
           <p className="text-textSecondary italic text-sm text-center py-4">
             Nenhum evento criado.
           </p>
        ) : events.map(event => (
          <div key={event.id} className="bg-bgSurface p-2 rounded-lg border border-bgElement">
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-bold text-textAccent">{event.name}</h5>
              <div className='flex gap-2 items-center'>
                 <button 
                    onClick={(e) => { e.stopPropagation(); saveEvent(event.id); }}
                    className="text-xs text-sky-400 hover:text-sky-300"
                    title="Salvar Estado no Firestore"
                  >
                   💾
                  </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); refreshEvent(event.id); }}
                    className="text-xs text-green-400 hover:text-green-300"
                    title="Recarregar dados das fichas (Atualiza HP/MP/Atributos)"
                  >
                   🔄
                  </button>
                 <button 
                    onClick={() => setManagingEventId(managingEventId === event.id ? null : event.id)}
                    className="text-xs text-textSecondary hover:text-textPrimary"
                    title="Gerenciar personagens"
                  >
                   👥
                  </button>
                <button 
                  onClick={() => deleteEvent(event.id)} 
                  className="text-red-500 hover:text-red-400 font-bold"
                  title="Deletar evento"
                >
                  X
                </button>
              </div>
            </div>
            
            {/* Character List for this event */}
            <div className="space-y-2">
              {(event.characters || []).map(char => renderCharacterHealth(char))}
            </div>

            {/* Character Selector */}
            {managingEventId === event.id && (
              <div className="mt-2 pt-2 border-t border-bgElement">
                 <h6 className="text-xs font-semibold text-textSecondary mb-1">Adicionar Personagem</h6>
                 <select
                    onChange={(e) => {
                      const charId = e.target.value;
                      const charName = allCharacters.find(c => c.id === charId)?.name || 'Desconhecido';
                      console.log(`[DIAGNÓSTICO] Tentando adicionar '${charName}' (ID: ${charId}) ao evento '${event.name}'.`);
                      addCharacterToEvent(event.id, charId);
                    }}
                    value=""
                    className="w-full bg-bgInput text-textPrimary border border-bgElement rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-btnHighlightBg"
                  >
                    <option value="" disabled>Selecione...</option>
                    {allCharacters // CORREÇÃO: Filtra personagens que já estão no evento.
                      .filter(char => !(event.characters || []).some(eventChar => eventChar.id === char.id))
                      .map(char => (
                        <option key={char.id} value={char.id}>{char.name}</option>
                    ))}
                 </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // --- PLAYER VIEW ---
  const renderPlayerView = () => {
    const allEventCharacters = useMemo(() => {
      const charIds = new Set();
      events.forEach(event => {
        (event.characters || []).forEach(charId => charIds.add(charId));
      });
      return Array.from(charIds).map(id => characterMap[id]).filter(Boolean);
    }, [events, characterMap]);

    return (
      <div className="flex-grow p-3 overflow-y-auto space-y-2 max-h-[calc(100vh-150px)]">
        {allEventCharacters.length > 0 ? (
          allEventCharacters.map(renderCharacterHealth)
        ) : (
          <p className="text-textSecondary italic text-sm text-center py-4">
            Nenhum evento em andamento.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed top-4 ${positionClass} w-full max-w-xs bg-bgSurface/90 backdrop-blur-md rounded-lg shadow-2xl border border-bgElement flex flex-col z-40`}>
      <div className="flex justify-between items-center p-3 bg-bgElement">
        <h3 className="font-bold text-textAccent">Gerenciador de Eventos</h3>
        <button
          className="text-textSecondary hover:text-textPrimary"
          onClick={togglePosition}
          title={layout.eventManager === 'top-left' ? 'Mover para a direita' : 'Mover para a esquerda'}
        >
          <span className="text-xl">🔃</span>
        </button>
      </div>
      
      {isMaster ? renderGmView() : renderPlayerView()}
    </div>
  );
};

export default EventManager;
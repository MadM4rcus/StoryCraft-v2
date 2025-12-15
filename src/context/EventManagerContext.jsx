import React, { createContext, useState, useContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from '@/context/SystemContext';
import { db, rtdb } from '@/services/firebase';
import { ref, set, onValue, remove, push, serverTimestamp } from 'firebase/database';
import { saveEventState, deleteEventFromFirestore } from '@/services/firestoreService';
import { collection, onSnapshot, query, collectionGroup, getDocs } from 'firebase/firestore';
import debounce from 'lodash/debounce';

const EventManagerContext = createContext();


export const useEventManager = () => useContext(EventManagerContext);

export const EventManagerProvider = ({ children }) => {
  const { user, isMaster } = useAuth();
  const { characterDataCollectionRoot } = useSystem();
  
  const [allCharacters, setAllCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // O estado que é transmitido pelo Mestre e recebido por todos.
  const [broadcastedState, setBroadcastedState] = useState({ events: [] });
  
  // Apenas o Mestre gerencia este estado localmente. É a fonte da verdade para o combate.
  const [combatState, setCombatState] = useState({ events: [] }); 
  
  const [actionRequests, setActionRequests] = useState([]);

  const sessionId = 'default-session'; 

  const eventsRef = useMemo(() => {
    if (!characterDataCollectionRoot) return null;
    return ref(rtdb, `storycraft-v2/combat-events/${sessionId}`);
  }, [characterDataCollectionRoot]);

  const actionRequestsRef = useMemo(() => {
    if (!characterDataCollectionRoot) return null;
    return ref(rtdb, `storycraft-v2/action-requests/${sessionId}`);
  }, [characterDataCollectionRoot]);
  
  // --- SINCRONIZAÇÃO DE ESTADO ---

  // Mestre: Transmite seu 'combatState' local para o RTDB sempre que ele muda.
  useEffect(() => {
    if (!isMaster || !eventsRef) return;
    
    // Prepara o estado para transmissão: substitui os objetos completos de personagem por seus IDs
    // e mantém apenas os dados essenciais para os jogadores.
    const stateToSend = {
      ...combatState,
      events: combatState.events.map(event => ({
        ...event,
        characters: (event.characters || []).map(char => ({
            id: char.id,
            name: char.name,
            flags: char.flags || {},
            mainAttributes: {
                hp: char.mainAttributes?.hp || { current: 0, max: 0, temp: 0 },
                mp: char.mainAttributes?.mp || { current: 0, max: 0 },
            }
        }))
      }))
    };
    
    set(eventsRef, stateToSend);

  }, [combatState, isMaster, eventsRef]);

  // Todos: Ouvem o canal de eventos do RTDB e atualizam o 'broadcastedState'.
  useEffect(() => {
    if (!eventsRef) {
      setBroadcastedState({ events: [] });
      return;
    }

    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      setBroadcastedState(data || { events: [] });
    });

    return () => unsubscribe();
  }, [eventsRef]);
  
  // Mestre: Ouve por pedidos de ação dos jogadores.
  useEffect(() => {
    if (!isMaster || !actionRequestsRef) return;
    
    console.log("[DIAGNÓSTICO] Iniciando escuta de actionRequests em:", actionRequestsRef.toString());

    const unsubscribe = onValue(actionRequestsRef, (snapshot) => {
      console.log("[DIAGNÓSTICO] Snapshot de actionRequests recebido. Existe?", snapshot.exists());
      const requests = [];
      snapshot.forEach((childSnapshot) => {
        requests.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      console.log("[DIAGNÓSTICO] Pedidos processados:", requests);
      setActionRequests(requests);
    }, (error) => {
      // AQUI É ONDE PEGAMOS ERROS DE PERMISSÃO
      console.error("[DIAGNÓSTICO] ERRO CRÍTICO ao ouvir actionRequests:", error);
    });

    return () => unsubscribe();
  }, [isMaster, actionRequestsRef]);

  // Efeito para buscar todos os personagens do Firestore.
  useEffect(() => {
    if (!user || !characterDataCollectionRoot) {
      setAllCharacters([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const q = isMaster 
      ? query(collectionGroup(db, 'characterSheets'))
      : query(collection(db, `${characterDataCollectionRoot}/users/${user.uid}/characterSheets`));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const charactersData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Parse JSON strings to objects (same logic as useCharacter hook)
        Object.keys(data).forEach(key => {
          if (typeof data[key] === 'string') {
            try {
              const parsed = JSON.parse(data[key]);
              if (typeof parsed === 'object' && parsed !== null) {
                data[key] = parsed;
              }
            } catch (e) { /* Ignore if not JSON */ }
          }
        });
        return { id: doc.id, ...data, flags: data.flags || {} };
      });
      setAllCharacters(charactersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao ouvir coleção de personagens:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, isMaster, characterDataCollectionRoot]);
  
  // --- FUNÇÕES DE GERENCIAMENTO DE EVENTOS (APENAS MESTRE) ---

  const createEvent = (eventName) => {
    if (!isMaster) return;
    const newEvent = {
      id: `evt_${Date.now()}`,
      name: eventName,
      characters: [], // Começa vazio
    };
    setCombatState(prevState => ({
      ...prevState,
      events: [...prevState.events, newEvent]
    }));
  };

  const deleteEvent = (eventId) => {
    if (!isMaster) return;
    // Deleta o evento do Firestore para que não seja recarregado
    deleteEventFromFirestore(eventId);

    // Remove o evento do estado de combate local
    setCombatState(prevState => ({
      ...prevState,
      events: prevState.events.filter(event => event.id !== eventId)
    }));
  };

  const addCharacterToEvent = (eventId, characterId) => {
    if (!isMaster) return;
    console.log('[DIAGNÓSTICO] addCharacterToEvent chamada com:', { eventId, characterId });

    const characterToAdd = allCharacters.find(c => c.id === characterId);
    if (!characterToAdd) {
      console.error('[DIAGNÓSTICO] Personagem não encontrado em allCharacters.');
      return;
    }
    
    console.log('[DIAGNÓSTICO] Personagem encontrado:', characterToAdd.name);

    // CORREÇÃO: Em vez de uma cópia profunda, cria um objeto limpo para o combate.
    // Isso garante que a estrutura de HP e MP seja sempre válida, evitando erros de 'undefined'.
    const characterInCombat = {
      ...JSON.parse(JSON.stringify(characterToAdd)), // Copia os campos seguros
      mainAttributes: {
        ...(characterToAdd.mainAttributes || {}),
        hp: characterToAdd.mainAttributes?.hp || { current: 0, max: 0, temp: 0 },
        mp: characterToAdd.mainAttributes?.mp || { current: 0, max: 0 },
      }
    };

    setCombatState(prevState => ({
      ...prevState,
      events: prevState.events.map(event => {
        // Garante que a propriedade 'characters' exista antes de tentar adicionar.
        const alreadyExists = (event.characters || []).some(c => c.id === characterId);
        if (event.id === eventId && !alreadyExists) {
          console.log(`[DIAGNÓSTICO] Adicionando personagem ao evento '${event.name}'.`);
          return { ...event, characters: [...(event.characters || []), characterInCombat] };
        }
        if (event.id === eventId && alreadyExists) console.warn(`[DIAGNÓSTICO] Personagem já existe no evento '${event.name}'.`);
        return event;
      })
    }));
  };
  
  const removeCharacterFromEvent = (eventId, characterId) => {
    if (!isMaster) return;
     setCombatState(prevState => ({
      ...prevState,
      events: prevState.events.map(event => {
        if (event.id === eventId) {
          return { ...event, characters: event.characters.filter(c => c.id !== characterId) };
        }
        return event;
      })
    }));
  };
  
  const clearAllEvents = () => {
    if (!isMaster) return;
    setCombatState({ events: [] });
  };
  
  const saveEvent = (eventId) => {
    if (!isMaster) return;
    
    const eventToSave = combatState.events.find(e => e.id === eventId);
    if (!eventToSave) {
      console.error(`Evento com id ${eventId} não encontrado no estado de combate.`);
      return;
    }
    
    console.log("Salvando evento:", eventToSave);
    saveEventState(characterDataCollectionRoot, eventToSave);
  };
  
  const sendActionRequest = (actionData) => {
    if (!actionRequestsRef) return;
    
    // Sanitiza o objeto actionData para remover undefineds que o Firebase não aceita
    const cleanActionData = JSON.parse(JSON.stringify(actionData));

    console.log("[DIAGNÓSTICO] Enviando actionRequest:", cleanActionData);

    const newRequestRef = push(actionRequestsRef);
    set(newRequestRef, {
      ...cleanActionData,
      status: 'pending',
      timestamp: serverTimestamp(),
    })
    .then(() => console.log("[EventManager] Pedido de ação enviado com sucesso."))
    .catch((error) => console.error("[EventManager] Erro ao enviar pedido de ação:", error));
  };

  const denyActionRequest = (requestId) => {
    if (!isMaster || !actionRequestsRef) return;
    const requestRef = ref(rtdb, `storycraft-v2/action-requests/${sessionId}/${requestId}`);
    remove(requestRef);
  };
  
  const approveActionRequest = (requestId) => {
    if (!isMaster) return;
  
    const request = actionRequests.find(r => r.id === requestId);
    if (!request) return;
  
    setCombatState(prevState => {
      const newEvents = prevState.events.map(event => {
        const newCharacters = event.characters.map(character => {
          // Verifica se o personagem está na lista de alvos (suporta targetId único legado ou targetIds array)
          const isTarget = (request.targetIds && request.targetIds.includes(character.id)) || character.id === request.targetId;

          if (isTarget) {
            const newChar = { ...character };
            const hp = newChar.mainAttributes.hp;
            const mp = newChar.mainAttributes.mp;
            
            // Lógica de placeholder para o efeito da ação
            const action = request.action || {};
            const amount = parseInt(action.totalResult, 10) || 0;
            const effectType = action.targetEffect || 'damage'; // Padrão é dano se não especificado

            switch (effectType) {
                case 'heal':
                    hp.current = Math.min(hp.max, hp.current + amount);
                    break;
                case 'healTemp':
                    hp.temp = (hp.temp || 0) + amount;
                    break;
                case 'damageTemp':
                    hp.temp = Math.max(0, (hp.temp || 0) - amount);
                    break;
                case 'damageMP':
                    mp.current = Math.max(0, mp.current - amount);
                    break;
                case 'healMP':
                    mp.current = Math.min(mp.max, mp.current + amount);
                    break;
                case 'cost': // Custo de ação em si mesmo
                    if (action.cost?.HP) hp.current = Math.max(0, hp.current - (action.cost.HP || 0));
                    if (action.cost?.MP) mp.current = Math.max(0, mp.current - (action.cost.MP || 0));
                    break;
                case 'selfHeal': // Recuperação em si mesmo
                    if (action.recovery?.HP) hp.current = Math.min(hp.max, hp.current + (action.recovery.HP || 0));
                    if (action.recovery?.MP) mp.current = Math.min(mp.max, mp.current + (action.recovery.MP || 0));
                    break;
                case 'damage':
                default:
                    hp.current = Math.max(0, hp.current - amount);
                    break;
            }
  
            return newChar;
          }
          return character;
        });
        return { ...event, characters: newCharacters };
      });
      return { ...prevState, events: newEvents };
    });
  
    // Remove a requisição após aprovação
    denyActionRequest(requestId);
  };
  
  // --- NOVAS FUNÇÕES: PERSISTÊNCIA E REFRESH ---

  const loadEventsFromFirestore = async () => {
    if (!isMaster) return;
    try {
      // Caminho fixo conforme definido no firestoreService.js
      const eventsRef = collection(db, 'storycraft-v2/default/events');
      const snapshot = await getDocs(eventsRef);
      
      const loadedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        // Reconstrói os objetos de personagem a partir dos IDs salvos e da lista allCharacters atual
        const characters = (data.characterIds || []).map(id => {
          const char = allCharacters.find(c => c.id === id);
          if (char) {
             // Cria uma cópia limpa para o combate
             return {
                ...JSON.parse(JSON.stringify(char)),
                mainAttributes: {
                    ...(char.mainAttributes || {}),
                    hp: char.mainAttributes?.hp || { current: 0, max: 0, temp: 0 },
                    mp: char.mainAttributes?.mp || { current: 0, max: 0 },
                }
            };
          }
          return null;
        }).filter(Boolean);

        return {
          id: doc.id,
          name: data.name,
          characters
        };
      });

      if (loadedEvents.length > 0) {
          setCombatState(prev => ({ ...prev, events: loadedEvents }));
      }
    } catch (e) {
      console.error("Erro ao carregar eventos salvos:", e);
    }
  };

  // Tenta carregar eventos salvos automaticamente quando o Mestre entra e as fichas estão prontas
  useEffect(() => {
    if (isMaster && !isLoading && allCharacters.length > 0 && combatState.events.length === 0) {
        loadEventsFromFirestore();
    }
  }, [isMaster, isLoading, allCharacters.length]); // Executa quando as fichas terminam de carregar


  const refreshEvent = (eventId) => {
    if (!isMaster) return;
    setCombatState(prevState => ({
      ...prevState,
      events: prevState.events.map(event => {
        if (event.id !== eventId) return event;

        // Atualiza os dados de cada personagem com o que está na ficha (allCharacters)
        const refreshedCharacters = event.characters.map(char => {
          const freshChar = allCharacters.find(c => c.id === char.id);
          if (freshChar) {
            return {
              ...JSON.parse(JSON.stringify(freshChar)),
              mainAttributes: {
                ...(freshChar.mainAttributes || {}),
                hp: freshChar.mainAttributes?.hp || { current: 0, max: 0, temp: 0 },
                mp: freshChar.mainAttributes?.mp || { current: 0, max: 0 },
              }
            };
          }
          return char; // Se não encontrar (ex: deletado), mantém o antigo
        });
        
        console.log(`[EventManager] Evento '${event.name}' atualizado com dados recentes das fichas.`);
        return { ...event, characters: refreshedCharacters };
      })
    }));
  };

  const value = {
      allCharacters,
      isLoading,
      isMaster,
      // Para o Mestre, os eventos vêm do estado local. Para jogadores, do estado transmitido.
      events: isMaster ? combatState.events : (broadcastedState?.events || []),
      createEvent,
      deleteEvent,
      addCharacterToEvent,
      removeCharacterFromEvent,
      clearAllEvents,
      saveEvent,
      loadEventsFromFirestore, // Exporta para uso manual se necessário
      refreshEvent,            // Exporta a função de refresh
      
      actionRequests,
      sendActionRequest,
      approveActionRequest,
      denyActionRequest,
  };

  return (
    <EventManagerContext.Provider value={value}>
      {children}
    </EventManagerContext.Provider>
  );
};
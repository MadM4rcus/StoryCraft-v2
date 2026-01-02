import React, { createContext, useState, useContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from '@/context/SystemContext';
import { useRollFeed } from '@/context/RollFeedContext';
import { useGlobalControls } from '@/context/GlobalControlsContext';
import { db, rtdb } from '@/services/firebase';
import { ref, set, onValue, remove, push, serverTimestamp } from 'firebase/database';
import { saveEventState, deleteEventFromFirestore } from '@/services/firestoreService';
import { collection, onSnapshot, query, collectionGroup, getDocs } from 'firebase/firestore';
import debounce from 'lodash/debounce';

const EventManagerContext = createContext();

// Helper function to determine character status (Near Death, Unconscious, Dead)
const getCharacterStatus = (character) => {
    const hp = character.mainAttributes?.hp;
    if (!hp || hp.max == null || hp.current == null) {
        return { isNearDeath: false, isUnconscious: false, isDead: false, deathThreshold: -10 };
    }

    const maxHP = hp.max || 1;
    const currentHP = hp.current;
    // O que for maior (em valor absoluto), ou seja, o menor número (mais negativo)
    const deathThreshold = Math.min(-10, -Math.floor(maxHP / 2));

    const isDead = currentHP <= deathThreshold;
    const isUnconscious = !isDead && currentHP <= 0;
    const isNearDeath = !isUnconscious && !isDead && currentHP > 0 && currentHP <= Math.floor(maxHP / 4);

    return { isNearDeath, isUnconscious, isDead, deathThreshold };
};

export const useEventManager = () => useContext(EventManagerContext);

export const EventManagerProvider = ({ children }) => {
  const { user, isMaster } = useAuth();
  const { characterDataCollectionRoot, currentSystem } = useSystem();
  const { addRollToFeed, addMessageToFeed } = useRollFeed();
  const { isSecretMode } = useGlobalControls();
  
  const [allCharacters, setAllCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // O estado que é transmitido pelo Mestre e recebido por todos.
  const [broadcastedState, setBroadcastedState] = useState({ events: [] });
  
  // Apenas o Mestre gerencia este estado localmente. É a fonte da verdade para o combate.
  const [combatState, setCombatState] = useState({ events: [] }); 
  
  const [actionRequests, setActionRequests] = useState([]);

  const sessionId = 'default-session'; 

  // Define a raiz do sistema para separar os eventos do V3
  const systemRoot = currentSystem === 'v3' ? 'storycraft-v3' : 'storycraft-v2';

  const eventsRef = useMemo(() => {
    if (!characterDataCollectionRoot) return null;
    return ref(rtdb, `${systemRoot}/combat-events/${sessionId}`);
  }, [characterDataCollectionRoot, systemRoot]);

  const actionRequestsRef = useMemo(() => {
    if (!characterDataCollectionRoot) return null;
    return ref(rtdb, `${systemRoot}/action-requests/${sessionId}`);
  }, [characterDataCollectionRoot, systemRoot]);
  
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
            visibleStats: char.visibleStats || false, // Transmite a visibilidade
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
    deleteEventFromFirestore(eventId, systemRoot);

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
      visibleStats: false, // Por padrão, status ocultos para jogadores
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
          return { ...event, characters: (event.characters || []).filter(c => c.id !== characterId) };
        }
        return event;
      })
    }));
  };
  
  const toggleCharacterVisibility = (eventId, characterId) => {
    if (!isMaster) return;
    setCombatState(prevState => ({
      ...prevState,
      events: prevState.events.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            characters: (event.characters || []).map(c => 
              c.id === characterId ? { ...c, visibleStats: !c.visibleStats } : c
            )
          };
        }
        return event;
      })
    }));
  };

  const closeEvent = (eventId) => {
    if (!isMaster) return;
    setCombatState(prevState => ({
      ...prevState,
      events: prevState.events.filter(event => event.id !== eventId)
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
    saveEventState(characterDataCollectionRoot, eventToSave, systemRoot);
  };
  
  const sendActionRequest = (requestData) => { // Agora recebe { action, actorSnapshot, targetIds }
    if (!actionRequestsRef) return;
    
    // Sanitiza o objeto actionData para remover undefineds que o Firebase não aceita
    const cleanRequestData = JSON.parse(JSON.stringify(requestData));

    console.log("[DIAGNÓSTICO] Enviando actionRequest:", cleanRequestData);

    // CORREÇÃO: Garante que actorId seja definido, seja via snapshot (ataques) ou direto (curas/custos)
    const actorId = requestData.actorSnapshot?.id || requestData.actorId;

    const newRequestRef = push(actionRequestsRef);
    set(newRequestRef, {
      ...cleanRequestData,
      actorId: actorId, // Usa o ID resolvido com segurança
      status: 'pending',
      timestamp: serverTimestamp(),
    })
    .then(() => console.log("[EventManager] Pedido de ação enviado com sucesso."))
    .catch((error) => console.error("[EventManager] Erro ao enviar pedido de ação:", error));
  };

  const denyActionRequest = (requestId) => {
    if (!isMaster || !actionRequestsRef) return;
    const requestRef = ref(rtdb, `${systemRoot}/action-requests/${sessionId}/${requestId}`);
    remove(requestRef);
  };
  
  const approveActionRequest = (requestId) => {
    if (!isMaster) return;
  
    const request = actionRequests.find(r => r.id === requestId);
    if (!request) return;

    const actor = request.actorSnapshot || allCharacters.find(c => c.id === request.actorId);
    if (!actor) {
        console.error("Ator não encontrado para o pedido de ação:", request.actorId);
        denyActionRequest(requestId);
        return;
    }

    // Define a ação a partir do pedido para uso consistente em toda a função.
    const { action } = request;
    if (!action) {
      console.error("Pedido de ação inválido: propriedade 'action' ausente.", request);
      denyActionRequest(requestId);
      return;
    }

    // --- HELPER: Lógica de Escala de Poder Unificada ---
    const calculateScaleMultiplier = (attackerId, targetId) => {
        const attackerChar = allCharacters.find(c => c.id === attackerId);
        const targetChar = allCharacters.find(c => c.id === targetId);
        
        if (!attackerChar || !targetChar) return { multiplier: 1, reflected: false };

        const attackerLvl = parseInt(attackerChar.level, 10) || 0;
        const targetLvl = parseInt(targetChar.level, 10) || 0;

        // Elite Diamante: Personagens de nível 50 ou superior só podem ser atingidos por outros de nível 50+.
        if (targetLvl >= 50) {
            if (attackerLvl < 50) return { multiplier: 0, reflected: false }; // Dano zerado se o atacante for inferior a 50
        }

        const diff = targetLvl - attackerLvl;

        // Atacante é nível MENOR (Redução de Dano)
        if (diff >= 25) return { multiplier: 0, reflected: false }; // Elite Rubi (Não causa dano)
        if (diff >= 20) return { multiplier: 0.25, reflected: false }; // Elite Esmeralda (75% diff -> 25% dano)
        if (diff >= 15) return { multiplier: 0.5, reflected: false }; // Elite Ouro (50% diff -> 50% dano)
        if (diff >= 10) return { multiplier: 0.75, reflected: false }; // Elite Prata (25% diff -> 75% dano)

        // Atacante é nível MAIOR (Amplificação de Dano)
        const advantage = attackerLvl - targetLvl;
        if (advantage >= 25) return { multiplier: 2.0, reflected: false }; // Elite Rubi (Dano dobrado)
        if (advantage >= 20) return { multiplier: 1.75, reflected: false }; // Elite Esmeralda (+75%)
        if (advantage >= 15) return { multiplier: 1.5, reflected: false }; // Elite Ouro (+50%)
        if (advantage >= 10) return { multiplier: 1.25, reflected: false }; // Elite Prata (+25%)

        // Elite Bronze (< 10 níveis de diferença) -> Sem alteração
        return { multiplier: 1, reflected: false };
    };

    // --- Lógica para Rolagens de Ataque (acerto vs ME) ---
    // Helper para calcular atributos derivados de um personagem "vivo" (com buffs, etc.)
    const calculateLiveAttribute = (liveChar, attrName) => {
        if (!liveChar) return 0;

        // Pega o status atual para aplicar penalidades
        const { isNearDeath } = getCharacterStatus(liveChar);

        const getStat = (character, statName) => {
            let key = statName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const base = character.mainAttributes?.[key] || 0;
            const buff = (character.buffs || []).filter(b => b.isActive).flatMap(b => b.effects || []).filter(e => e.type === 'attribute' && e.target === statName).reduce((sum, e) => sum + (parseInt(e.value, 10) || 0), 0);
            return (parseInt(base, 10) || 0) + buff;
        };

        // CORREÇÃO: MD soma com Constituição
        if (attrName === 'MD') {
            return getStat(liveChar, 'MD') + getStat(liveChar, 'Constituição');
        }

        if (attrName === 'ME') {
            const nearDeathPenalty = isNearDeath ? -2 : 0;
            return getStat(liveChar, 'ME') + nearDeathPenalty;
        }

        // CORREÇÃO: Iniciativa soma com Destreza
        if (attrName === 'Iniciativa') {
            return getStat(liveChar, 'Iniciativa') + getStat(liveChar, 'Destreza');
        }

        if (!['Fortitude', 'Reflexo', 'Vontade'].includes(attrName)) {
            return getStat(liveChar, attrName);
        }

        // Bônus de resistência global a cada 10 níveis.
        const resistanceBonus = Math.floor((liveChar.level || 0) / 10);
        const baseSaveValue = getStat(liveChar, attrName);

        const attrField = `${attrName.toLowerCase()}Attr`;
        const defaultAttrMap = { Fortitude: 'CON', Reflexo: 'DES', Vontade: 'SAB' };
        const selectedAttrAbbr = liveChar[attrField] || defaultAttrMap[attrName];
        
        const primaryAttrNameMap = { CON: 'Constituição', DES: 'Destreza', SAB: 'Sabedoria' };
        const primaryAttrName = primaryAttrNameMap[selectedAttrAbbr];
        
        const primaryAttrValue = primaryAttrName ? getStat(liveChar, primaryAttrName) : 0;
        
        const nearDeathPenalty = isNearDeath ? -1 : 0;

        return baseSaveValue + primaryAttrValue + resistanceBonus + nearDeathPenalty;
    };

    // --- Helper para aplicar custo ao ator (se houver) ---
    const applyActorCost = (eventsList, actorId, costData) => {
        if (!costData || (!costData.HP && !costData.MP)) return;
        for (const ev of eventsList) {
            const actorChar = (ev.characters || []).find(c => c.id === actorId);
            if (actorChar) {
                if (costData.HP) actorChar.mainAttributes.hp.current = Math.max(0, actorChar.mainAttributes.hp.current - costData.HP);
                if (costData.MP) actorChar.mainAttributes.mp.current = Math.max(0, actorChar.mainAttributes.mp.current - costData.MP);
                break; 
            }
        }
    };

    if (action.acertoResult) {
        const acertoTotal = action.acertoResult.total;
        const hitTargets = [];
        const missedTargets = [];
        let totalDamageDealt = 0;
        let reflectedDamageInfo = null; // Para armazenar informações sobre dano refletido

        const newState = JSON.parse(JSON.stringify(combatState));
        
        // APLICA O CUSTO AO ATOR
        applyActorCost(newState.events, request.actorId, action.cost);

        (request.targetIds || [request.targetId]).forEach(targetId => {
            let combatChar = null; // O personagem no estado de combate (para modificar)
            for (const event of newState.events) {
                const char = (event.characters || []).find(c => c.id === targetId);
                if (char) {
                    combatChar = char;
                    break;
                }
            }
            if (!combatChar) return;

            const liveChar = allCharacters.find(c => c.id === targetId);
            if (!liveChar) return;

            const totalME = calculateLiveAttribute(liveChar, 'ME'); // Penalidade já é aplicada aqui

            // REGRA: Um 20 natural é acerto automático. Outros críticos (ex: 17-19) não são, mas ainda aplicam dano extra.
            const isNatural20 = action.acertoResult?.roll === 20;
            const isCrit = action.acertoResult?.isCrit; // Mantém para lógica de dano extra.

            if (isNatural20 || acertoTotal >= totalME) {
                const hp = combatChar.mainAttributes.hp;
                const originalAmount = parseInt(action.totalResult, 10) || 0;
                const effectType = action.targetEffect || 'damage';
                let damageApplied = 0;
                let damageReduced = 0;
                let statusChanges = [];

                // --- LÓGICA DE ESCALA ---
                const { multiplier, reflected } = calculateScaleMultiplier(actor.id, targetId);
                const scaledDamage = reflected ? 0 : Math.floor(originalAmount * multiplier);
                const reflectedAmount = reflected ? Math.floor(originalAmount * 2) : 0;
                // --- FIM DA LÓGICA DE ESCALA ---

                if (effectType === 'damage' && scaledDamage > 0) {
                    const totalMD = calculateLiveAttribute(liveChar, 'MD');
                    // Se ignoraMD for true (total) OU se tiver um valor específico de ignoreMDValue
                    damageReduced = action.ignoraMD ? 0 : Math.max(0, totalMD - (action.ignoreMDValue || 0));
                    const damageToApply = Math.max(0, scaledDamage - damageReduced);

                    const initialHP = hp.current;
                    const statusBeforeDamage = getCharacterStatus(liveChar);

                    hp.current -= damageToApply; // Permite HP negativo
                    damageApplied = initialHP - hp.current;
                    totalDamageDealt += damageApplied;

                    // Verifica mudança de estado após o dano
                    const statusAfterDamage = getCharacterStatus(combatChar);
                    if (statusAfterDamage.isDead && !statusBeforeDamage.isDead) {
                        statusChanges.push({ type: 'dead', message: `${combatChar.name} foi morto!` });
                    } else if (statusAfterDamage.isUnconscious && !statusBeforeDamage.isUnconscious) {
                        statusChanges.push({ type: 'unconscious', message: `${combatChar.name} caiu inconsciente!` });
                    } else if (statusAfterDamage.isNearDeath && !statusBeforeDamage.isNearDeath) {
                        statusChanges.push({ type: 'near_death', message: `${combatChar.name} está perto da morte!` });
                    }

                }

                // Aplica o dano refletido de volta no atacante
                if (reflectedAmount > 0) {
                    for (const event of newState.events) {
                        const attackerCombatChar = (event.characters || []).find(c => c.id === actor.id);
                        if (attackerCombatChar) {
                            const attackerHP = attackerCombatChar.mainAttributes.hp;
                            const attackerInitialHP = attackerHP.current;
                            // Dano refletido ignora MD, conforme assumido
                            attackerHP.current = Math.max(0, attackerHP.current - reflectedAmount);
                            const reflectedDamageApplied = attackerInitialHP - attackerHP.current;
                            reflectedDamageInfo = { targetName: actor.name, damage: reflectedDamageApplied };
                            break; // Sai do loop de eventos
                        }
                    }
                }

                hitTargets.push({ 
                    name: combatChar.name, 
                    me: totalME, 
                    damage: damageApplied,
                    reduced: damageReduced,
                    powerScaleMultiplier: multiplier, // Adiciona para o feed
                    initialDamage: originalAmount, // Adiciona para o feed
                    statusChanges, // Adiciona para o feed
                });
            } else {
                missedTargets.push({ name: combatChar.name, me: totalME });
            }
        });

        setCombatState(newState);

        try {
          addRollToFeed({
              type: 'roll',
              characterName: actor.name,
              ownerUid: actor.ownerUid,
              rollName: action.name,
              acertoResult: action.acertoResult,
              totalResult: totalDamageDealt,
              rolledDamage: action.totalResult, // Passa o dano rolado original
              targetResults: { hits: hitTargets, misses: missedTargets },
              reflectedDamage: reflectedDamageInfo, // Passa a info de dano refletido
              costText: action.costText || '',
              isSecret: isSecretMode,
              detailsText: action.detailsText || '', // Passa a fórmula do dano
          });
        } catch (error) {
            console.error("Falha ao enviar resultado do ataque para o feed:", error);
        }

        denyActionRequest(requestId);
        return;
    }
    
    // --- LÓGICA PARA TESTES DE RESISTÊNCIA (SAVING THROWS) ---
    if (action.savingThrow && action.savingThrow.type !== 'none') {
        const savingThrowResults = [];
        const newState = JSON.parse(JSON.stringify(combatState));
        
        // APLICA O CUSTO AO ATOR
        applyActorCost(newState.events, request.actorId, action.cost);
        
        let reflectedDamageInfo = null;

        (request.targetIds || [request.targetId]).forEach(targetId => {
            let combatChar = null;
            for (const event of newState.events) {
                const char = (event.characters || []).find(c => c.id === targetId);
                if (char) { combatChar = char; break; }
            }
            if (!combatChar) return;

            const liveChar = allCharacters.find(c => c.id === targetId);
            if (!liveChar) return;

            // --- LÓGICA DE ESCALA ---
            const { multiplier, reflected } = calculateScaleMultiplier(actor.id, targetId);
            const originalAmount = parseInt(action.totalResult, 10) || 0;
            const scaledDamage = reflected ? 0 : Math.floor(originalAmount * multiplier);
            const reflectedAmount = reflected ? Math.floor(originalAmount * 2) : 0;
            // ------------------------

            const saveType = action.savingThrow.type;
            const saveDC = action.savingThrow.dc;
            const saveBonus = calculateLiveAttribute(liveChar, saveType);
            
            const d20Roll = Math.floor(Math.random() * 20) + 1;
            const saveTotal = d20Roll + saveBonus;
            const isSuccess = saveTotal >= saveDC;

            let damageAfterSave = scaledDamage;

            if (isSuccess) {
                if (action.savingThrow.effect === 'halfDamage') {
                    damageAfterSave = Math.floor(damageAmount / 2);
                } else if (action.savingThrow.effect === 'noDamage') {
                    damageAfterSave = 0;
                }
            }

            const totalMD = calculateLiveAttribute(liveChar, 'MD');
            const damageReducedByMD = action.ignoraMD ? 0 : Math.max(0, totalMD - (action.ignoreMDValue || 0));
            const finalDamage = Math.max(0, damageAfterSave - damageReducedByMD);

            const initialHP = combatChar.mainAttributes.hp.current;
            combatChar.mainAttributes.hp.current = initialHP - finalDamage; // Permite HP negativo
            const damageApplied = initialHP - combatChar.mainAttributes.hp.current;

            if (reflectedAmount > 0 && !reflectedDamageInfo) {
                 for (const event of newState.events) {
                    const attackerCombatChar = (event.characters || []).find(c => c.id === actor.id);
                    if (attackerCombatChar) {
                        const attackerHP = attackerCombatChar.mainAttributes.hp;
                        attackerHP.current -= reflectedAmount; // Permite HP negativo
                        reflectedDamageInfo = { targetName: actor.name, damage: reflectedAmount };
                        break;
                    }
                }
            }

            // Verifica mudança de estado após o dano
            const statusChanges = [];
            const statusBeforeDamage = getCharacterStatus(liveChar);
            const statusAfterDamage = getCharacterStatus(combatChar);
            if (statusAfterDamage.isDead && !statusBeforeDamage.isDead) {
                statusChanges.push({ type: 'dead', message: `${combatChar.name} foi morto!` });
            } else if (statusAfterDamage.isUnconscious && !statusBeforeDamage.isUnconscious) {
                statusChanges.push({ type: 'unconscious', message: `${combatChar.name} caiu inconsciente!` });
            } else if (statusAfterDamage.isNearDeath && !statusBeforeDamage.isNearDeath) {
                statusChanges.push({ type: 'near_death', message: `${combatChar.name} está perto da morte!` });
            }

            savingThrowResults.push({
                targetName: liveChar.name,
                saveType,
                d20Roll,
                saveBonus,
                saveTotal,
                saveDC,
                isSuccess,
                initialDamage: originalAmount,
                powerScaleMultiplier: multiplier, // Info para o feed
                damageAfterSave,
                damageReducedByMD,
                finalDamage: damageApplied,
                statusChanges, // Adiciona para o feed
            });
        });

        setCombatState(newState);

        try {
            addRollToFeed({
                type: 'roll',
                characterName: actor.name,
                ownerUid: actor.ownerUid,
                rollName: action.name,
                savingThrowResults,
                reflectedDamage: reflectedDamageInfo,
                isSecret: isSecretMode,
            });
        } catch (error) {
            console.error("Falha ao enviar resultado do teste de resistência para o feed:", error);
        }
        denyActionRequest(requestId);
        return;
    }

    // --- LÓGICA PARA AÇÕES DE CURA/CUSTO COM FÓRMULA (SEM ACERTO/RESISTÊNCIA) ---
    if (action.targetEffect === 'selfHeal') {
        const newState = JSON.parse(JSON.stringify(combatState));
        const modifiedTargetsDesc = [];

        newState.events = newState.events.map(event => ({
            ...event,
            characters: (event.characters || []).map(character => {
                const isTarget = (request.targetIds && request.targetIds.includes(character.id)) || character.id === request.targetId;
                if (!isTarget) return character;

                const newChar = { ...character };
                const { hp, mp } = newChar.mainAttributes;
                let changeDescription = '';

                if (action.recovery) {
                    if (action.recovery.HP) {
                        const healedHP = Math.min(hp.max, hp.current + (action.recovery.HP || 0)) - hp.current;
                        hp.current += healedHP;
                        changeDescription += `recuperou ${healedHP} HP`;
                    }
                    if (action.recovery.MP) {
                        const healedMP = Math.min(mp.max, mp.current + (action.recovery.MP || 0)) - mp.current;
                        mp.current += healedMP;
                        if (changeDescription) changeDescription += ' e ';
                        changeDescription += `recuperou ${healedMP} MP`;
                    }
                }

                if (changeDescription) {
                    modifiedTargetsDesc.push(`${character.name} ${changeDescription}`);
                }
                return newChar;
            })
        }));

        setCombatState(newState);

        // Envia um item de rolagem rico para o feed, que será renderizado com todos os detalhes.
        addRollToFeed({
            type: 'roll',
            characterName: actor.name,
            ownerUid: actor.ownerUid,
            rollName: action.name,
            totalResult: action.totalResult,
            detailsText: action.detailsText,
            costText: action.costText,
            // Usa o campo discordText para mostrar um resumo do que aconteceu.
            discordText: modifiedTargetsDesc.join('. ') + '.'
        });

        denyActionRequest(requestId);
        return;
    }

    // --- Lógica Genérica (Dano/Cura Simples) ---
    const newState = JSON.parse(JSON.stringify(combatState));
    const affectedTargets = [];
    const actorName = allCharacters.find(c => c.id === request.actorId)?.name || 'Desconhecido';
    let reflectedDamageInfo = null;

    // APLICA O CUSTO AO ATOR (Se não for uma ação de custo dedicada, para evitar duplicidade)
    if (action.targetEffect !== 'cost') {
        applyActorCost(newState.events, request.actorId, action.cost);
    }

    newState.events = newState.events.map(event => ({
        ...event,
        characters: (event.characters || []).map(character => {
            const isTarget = (request.targetIds && request.targetIds.includes(character.id)) || character.id === request.targetId;
            if (!isTarget) return character;

            const newChar = { ...character };
            const { hp, mp } = newChar.mainAttributes;
            const originalAmount = parseInt(action.totalResult, 10) || 0;
            const effectType = action.targetEffect || 'damage';
            let msg = '';
            const statusBeforeDamage = getCharacterStatus(character);
            
            // --- LÓGICA DE ESCALA ---
            let finalAmount = originalAmount;
            let scaleMsg = '';
            
            if (['damage', 'damageMP', 'damageTemp'].includes(effectType)) {
                const { multiplier, reflected } = calculateScaleMultiplier(actor.id, character.id);
                
                if (reflected) {
                    finalAmount = 0;
                    scaleMsg = ' (Refletido!)';
                    // Aplica dano refletido ao atacante (se encontrado neste evento)
                    const attackerCombatChar = (event.characters || []).find(c => c.id === actor.id);
                    if (attackerCombatChar) {
                         const refAmount = Math.floor(originalAmount * 2); // Usa originalAmount para dano refletido
                         attackerCombatChar.mainAttributes.hp.current = Math.max(0, attackerCombatChar.mainAttributes.hp.current - refAmount);
                         reflectedDamageInfo = { targetName: actor.name, damage: refAmount };
                    }
                } else {
                    finalAmount = Math.floor(originalAmount * multiplier);
                    if (multiplier !== 1) scaleMsg = ` (x${multiplier.toFixed(2)})`;
                }
            }
            // ------------------------

            switch (effectType) {
                case 'heal': 
                    const healedHP = Math.min(hp.max, hp.current + finalAmount) - hp.current;
                    hp.current += healedHP; 
                    msg = `recuperou ${healedHP} HP`; 
                    break;
                case 'healTemp': hp.temp = (hp.temp || 0) + finalAmount; msg = `ganhou ${finalAmount} HP Temporário`; break;
                case 'damageTemp': hp.temp = Math.max(0, (hp.temp || 0) - finalAmount); msg = `perdeu ${finalAmount} HP Temporário${scaleMsg}`; break;
                case 'damageMP': mp.current = Math.max(0, mp.current - finalAmount); msg = `perdeu ${finalAmount} MP${scaleMsg}`; break;
                case 'healMP': mp.current = Math.min(mp.max, mp.current + finalAmount); msg = `recuperou ${finalAmount} MP`; break;
                case 'cost':
                    if (action.cost?.HP) hp.current = Math.max(0, hp.current - (action.cost.HP || 0));
                    if (action.cost?.MP) mp.current = Math.max(0, mp.current - (action.cost.MP || 0));
                    msg = `pagou o custo da ação`;
                    break;
                case 'damage':
                default: 
                    hp.current -= finalAmount; // Permite HP negativo
                    msg = `sofreu ${finalAmount} de dano${scaleMsg}`; 
                    break;
            }
            
            if (msg) {
                // Verifica mudança de estado após o dano/cura
                const statusAfterDamage = getCharacterStatus(newChar);
                if (statusAfterDamage.isDead && !statusBeforeDamage.isDead) {
                    msg += `\n- 💀 ${newChar.name} foi morto!`;
                } else if (statusAfterDamage.isUnconscious && !statusBeforeDamage.isUnconscious) {
                    msg += `\n- 😵 ${newChar.name} caiu inconsciente!`;
                } else if (statusAfterDamage.isNearDeath && !statusBeforeDamage.isNearDeath) {
                    msg += `\n- ⚠️ ${newChar.name} está perto da morte!`;
                }

                affectedTargets.push({ name: character.name, msg });
            }
            return newChar;
        })
    }));

    setCombatState(newState);

    if (affectedTargets.length > 0 || reflectedDamageInfo) {
        let description = affectedTargets.map(t => `${t.name} ${t.msg}.`).join('\n');
        if (reflectedDamageInfo) {
            description += `\n💥 DANO REFLETIDO! ${reflectedDamageInfo.targetName} sofreu ${reflectedDamageInfo.damage} de dano.`;
        }

        addRollToFeed({
            type: 'roll',
            characterName: actorName,
            ownerUid: user.uid,
            rollName: action.name || 'Ação',
            totalResult: action.totalResult,
            discordText: description,
            isSecret: isSecretMode,
        });
    }

    denyActionRequest(requestId);
  };
  
  // --- NOVAS FUNÇÕES: PERSISTÊNCIA E REFRESH ---

  const loadEventsFromFirestore = async () => {
    if (!isMaster) return;
    try {
      // Caminho fixo conforme definido no firestoreService.js
      const eventsRef = collection(db, `${systemRoot}/default/events`);
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
          setCombatState(prev => {
            const currentIds = new Set(prev.events.map(e => e.id));
            const newEvents = loadedEvents.filter(e => !currentIds.has(e.id));
            return { ...prev, events: [...prev.events, ...newEvents] };
          });
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
        const refreshedCharacters = (event.characters || []).map(char => {
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
      toggleCharacterVisibility,
      closeEvent,
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
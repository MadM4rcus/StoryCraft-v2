import { db } from './firebase';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc,
  onSnapshot 
} from 'firebase/firestore';

// A função agora pode buscar todas as fichas se fetchAll for verdadeiro
export const getCharactersForUser = async (basePath, userId, fetchAll = false) => {
  if (!userId || !basePath) return [];
  try {
    let characters = [];
    if (fetchAll) {
      // Busca em todos os utilizadores
      const usersRef = collection(db, `${basePath}/users`);
      const usersSnapshot = await getDocs(usersRef);
      for (const userDoc of usersSnapshot.docs) {
        const charactersRef = collection(db, `${basePath}/users/${userDoc.id}/characterSheets`);
        const q = query(charactersRef);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          characters.push({ id: doc.id, ownerUid: userDoc.id, ...doc.data() });
        });
      }
    } else {
      // Busca apenas no utilizador atual
      const charactersRef = collection(db, `${basePath}/users/${userId}/characterSheets`);
      const q = query(charactersRef);
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        characters.push({ id: doc.id, ownerUid: userId, ...doc.data() });
      });
    }
    return characters;
  } catch (error) {
    console.error("Erro ao buscar personagens:", error);
    return [];
  }
};

export const createNewCharacter = async (basePath, userId) => {
  if (!userId || !basePath) return null;
  const characterName = prompt("Qual o nome do novo personagem?");
  if (!characterName) return null;
  try {
    const charactersRef = collection(db, `${basePath}/users/${userId}/characterSheets`);
    const newCharData = {
      name: characterName,
      ownerUid: userId,
      createdAt: serverTimestamp(),
      level: 1, // Valor padrão
      mainAttributes: { // Inicializa com valores padrão para HP e MP
        hp: {
          current: 100,
          max: 100,
          temp: 0,
        },
        mp: {
          current: 50,
          max: 50,
        },
      },
      // ... (resto dos dados iniciais)
    };
    const docRef = await addDoc(charactersRef, newCharData);
    return { id: docRef.id, ...newCharData };
  } catch (error) {
    console.error("Erro ao criar novo personagem:", error);
    return null;
  }
};

export const deleteCharacter = async (basePath, userId, characterId) => {
  if (!userId || !characterId || !basePath) return false;
  try {
    const charDocRef = doc(db, `${basePath}/users/${userId}/characterSheets/${characterId}`);
    await deleteDoc(charDocRef);
    console.log("Ficha deletada com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao deletar personagem:", error);
    return false;
  }
};

/**
 * Busca as configurações de um usuário no Firestore.
 * @param {string} basePath - O caminho base da coleção (ex: "artifacts2/1:727...")
 * @param {string} userId - O UID do usuário.
 * @returns {Promise<object|null>} As configurações do usuário ou null se não encontradas.
 */
export const getUserSettings = async (basePath, userId) => {
  if (!userId || !basePath) return null;
  // CORRIGIDO: Usa o basePath dinâmico em vez de "storycraft"
  const settingsDocRef = doc(db, `${basePath}/users/${userId}`); 
  try {
    const docSnap = await getDoc(settingsDocRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Erro ao buscar configurações do usuário:", error);
    return null;
  }
};

/**
 * Salva as configurações de um usuário no Firestore.
 * @param {string} basePath - O caminho base da coleção (ex: "artifacts2/1:727...")
 * @param {string} userId - O UID do usuário.
 * @param {object} settings - O objeto de configurações a ser salvo.
 */
export const saveUserSettings = async (basePath, userId, settings) => {
  if (!userId || !basePath) return;
  // CORRIGIDO: Usa o basePath dinâmico em vez de "storycraft"
  const settingsDocRef = doc(db, `${basePath}/users/${userId}`); 
  await setDoc(settingsDocRef, settings, { merge: true });
};


// =====================================================================
// 2. --- NOVAS FUNÇÕES DE LAYOUT (ROADMAP) ---
// =====================================================================

// Dimensões do palco do Adjuster (baseado no ClassicSheetAdjuster.jsx)
const STAGE_WIDTH = 827;
const STAGE_HEIGHT = 1170;
// Caminho da coleção de layouts (baseado na sua estrutura de regras do firestore.rules)
const LAYOUT_COLLECTION_PATH = 'storycraft-v2/default/layouts'; // <-- Usando 'default' como {appId}

/**
 * Salva o objeto de layout no Firestore.
 * Converte automaticamente os valores de pixels (do Adjuster) para porcentagens.
 * @param {string} systemId - O ID do sistema (ex: "storycraft_classic").
 * @param {object} layoutInPixels - O objeto de elementos (estado) do ClassicSheetAdjuster.
 */
export const saveLayout = async (systemId, layoutInPixels) => {
  if (!systemId || !layoutInPixels) {
    console.error("saveLayout: ID do sistema ou dados do layout ausentes.");
    return;
  }

  // Converte de pixels (do Adjuster) para porcentagens (para o DB)
  // Lógica baseada na função handleExport do ClassicSheetAdjuster.jsx
  const layoutInPercent = {};
  Object.entries(layoutInPixels).forEach(([id, data]) => {
    layoutInPercent[id] = {
      type: data.type,
      top: (data.top / STAGE_HEIGHT) * 100,
      left: (data.left / STAGE_WIDTH) * 100,
      width: (data.width / STAGE_WIDTH) * 100,
      height: (data.height / STAGE_HEIGHT) * 100,
    };
  });

  try {
    // Salva o documento no caminho: /storycraft-v2/default/layouts/{systemId}
    const layoutRef = doc(db, LAYOUT_COLLECTION_PATH, systemId);
    await setDoc(layoutRef, layoutInPercent);
    console.log(`[FirestoreService] Layout para ${systemId} salvo com sucesso!`);
  } catch (error) {
    console.error("Erro ao salvar o layout:", error);
  }
};

/**
 * Ouve as atualizações de um layout do Firestore EM TEMPO REAL.
 * Converte automaticamente os valores de porcentagem (do DB) para pixels.
 * @param {string} systemId - O ID do sistema (ex: "storycraft_classic").
 * @param {function} callback - Função que será chamada com os dados do layout em pixels.
 * @returns {function} - A função 'unsubscribe' do onSnapshot.
 */
export const getLayout = (systemId, callback) => {
  if (!systemId) {
    console.error("getLayout: ID do sistema ausente.");
    return () => {}; // Retorna uma função de unsubscribe vazia
  }

  // Ouve o documento no caminho: /storycraft-v2/default/layouts/{systemId}
  const layoutRef = doc(db, LAYOUT_COLLECTION_PATH, systemId);
  
  const unsubscribe = onSnapshot(layoutRef, (docSnap) => {
    if (docSnap.exists()) {
      const layoutInPercent = docSnap.data();
      
      // Converte de porcentagens (do DB) para pixels (para o Componente)
      // Lógica baseada na função handleImportChange do ClassicSheetAdjuster.jsx
      const layoutInPixels = {};
      Object.entries(layoutInPercent).forEach(([id, data]) => {
        layoutInPixels[id] = {
          type: data.type,
          top: (data.top / 100) * STAGE_HEIGHT,
          left: (data.left / 100) * STAGE_WIDTH,
          width: (data.width / 100) * STAGE_WIDTH,
          height: (data.height / 100) * STAGE_HEIGHT,
        };
      });
      
      callback(layoutInPixels);

    } else {
      // Documento não existe, retorna um objeto vazio
      console.warn(`[FirestoreService] Nenhum layout encontrado para ${systemId}. Usando layout vazio.`);
      callback({});
    }
  }, (error) => {
    console.error("Erro ao buscar o layout:", error);
    callback({});
  });

  return unsubscribe; // Retorna a função para o componente poder se desinscrever
};
import { db } from './firebase';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// A appId do nosso projeto v1, para construir o caminho correto
const appId = "1:727724875985:web:97411448885c68c289e5f0";

/**
 * Busca a lista de personagens de um usuário específico.
 * @param {string} userId - O ID do usuário logado.
 * @returns {Promise<Array>} Uma lista com os personagens do usuário.
 */
export const getCharactersForUser = async (userId) => {
  if (!userId) return [];

  try {
    const charactersRef = collection(db, `artifacts2/${appId}/users/${userId}/characterSheets`);
    const q = query(charactersRef);
    const querySnapshot = await getDocs(q);
    
    const characters = [];
    querySnapshot.forEach((doc) => {
      characters.push({ id: doc.id, ...doc.data() });
    });
    
    return characters;
  } catch (error) {
    console.error("Erro ao buscar personagens:", error);
    return [];
  }
};

/**
 * Cria um novo personagem para um usuário.
 * @param {string} userId - O ID do usuário para quem o personagem será criado.
 */
export const createNewCharacter = async (userId) => {
  if (!userId) return null;

  const characterName = prompt("Qual o nome do novo personagem?");
  if (!characterName) return null;

  try {
    const charactersRef = collection(db, `artifacts2/${appId}/users/${userId}/characterSheets`);
    const newCharData = {
      name: characterName,
      ownerUid: userId,
      createdAt: serverTimestamp(),
      level: 1,
      xp: 0,
      // Usaremos o mesmo estado inicial do seu App V1 para consistência
      ...{
        mainAttributes: { hp: { current: 0, max: 0, temp: 0 }, mp: { current: 0, max: 0 }, initiative: 0, fa: 0, fm: 0, fd: 0 },
        attributes: [], inventory: [], wallet: { zeni: 0, inspiration: 0 }, advantages: [], disadvantages: [], abilities: [],
        specializations: [], equippedItems: [], history: [], notes: [], buffs: [], formulaActions: [],
        discordWebhookUrl: '',
      }
    };
    
    const docRef = await addDoc(charactersRef, newCharData);
    console.log("Personagem criado com ID: ", docRef.id);
    // Para manter a compatibilidade com o V1, vamos serializar os objetos complexos
    Object.keys(newCharData).forEach(key => {
        if (typeof newCharData[key] === 'object' && newCharData[key] !== null) {
            newCharData[key] = JSON.stringify(newCharData[key]);
        }
    });
    return { id: docRef.id, ...newCharData };
  } catch (error) {
    console.error("Erro ao criar novo personagem:", error);
    alert("Ocorreu um erro ao criar o personagem. Verifique a consola para mais detalhes.");
    return null;
  }
};
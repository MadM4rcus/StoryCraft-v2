// src/services/localStoreService.js

/**
 * Este serviço simula a API do Firestore (onSnapshot, setDoc, doc)
 * usando o localStorage do navegador. Ele permite que a aplicação
 * funcione em um modo "offline" ou de emergência.
 */

const DB_KEY = 'storycraft_local_db';

// Nosso "banco de dados" em memória
let localDB = {};

// Objeto para armazenar os "ouvintes" (listeners) para simular o onSnapshot
const listeners = {};

/**
 * Carrega o banco de dados do localStorage para a memória.
 */
const loadDb = () => {
  try {
    const dbString = localStorage.getItem(DB_KEY);
    localDB = dbString ? JSON.parse(dbString) : {};
  } catch (e) {
    console.error("Erro ao carregar o banco de dados local:", e);
    localDB = {};
  }
};

/**
 * Salva o banco de dados da memória para o localStorage.
 */
const saveDb = () => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(localDB, null, 2));
  } catch (e) {
    console.error("Erro ao salvar o banco de dados local:", e);
  }
};

// Carrega o DB quando o módulo é importado pela primeira vez.
loadDb();

/**
 * Navega no objeto do DB local usando um caminho (ex: 'users/123/sheets/abc').
 * @param {string} path - O caminho para o dado.
 * @returns {object|undefined} O dado encontrado.
 */
const getByPath = (path) => {
  return path.split('/').reduce((obj, key) => obj && obj[key], localDB);
};

/**
 * Define um valor em um caminho específico no objeto do DB local.
 * @param {string} path - O caminho para o dado.
 * @param {object} value - O valor a ser definido.
 * @param {boolean} merge - Se deve mesclar com dados existentes.
 */
const setByPath = (path, value, merge = false) => {
  const keys = path.split('/');
  let current = localDB;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  const finalKey = keys[keys.length - 1];
  current[finalKey] = merge ? { ...(current[finalKey] || {}), ...value } : value;
};

// --- Funções que Simulam a API do Firestore ---

export const doc = (db, path) => path; // Apenas retorna o caminho como referência

export const setDoc = async (path, data, options) => {
  setByPath(path, data, options?.merge);
  saveDb();
  // Notifica os listeners para este caminho
  if (listeners[path]) {
    const docData = getByPath(path);
    const docSnap = {
      exists: () => !!docData,
      data: () => docData,
      id: path.split('/').pop(),
    };
    listeners[path].forEach(callback => callback(docSnap));
  }
};

export const onSnapshot = (path, callback) => {
  if (!listeners[path]) {
    listeners[path] = [];
  }
  listeners[path].push(callback);

  // Envia o estado atual imediatamente, como o onSnapshot real faz.
  const docData = getByPath(path);
  const docSnap = { exists: () => !!docData, data: () => docData, id: path.split('/').pop() };
  callback(docSnap);

  // Retorna a função de unsubscribe
  return () => {
    listeners[path] = listeners[path].filter(cb => cb !== callback);
  };
};
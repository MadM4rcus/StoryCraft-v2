import { db } from './firebase';
import { getCharactersForUser, createNewCharacter, deleteCharacter } from './firestoreService';
import { getThemeById, getUserSettings, saveUserSettings } from './themeService';

export {
  db,
  getCharactersForUser,
  createNewCharacter,
  deleteCharacter,
  getThemeById,
  getUserSettings,
  saveUserSettings,
};

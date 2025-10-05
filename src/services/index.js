import { db } from './firebase';
import { getCharactersForUser, createNewCharacter, deleteCharacter } from './firestoreService';
import { getThemeById } from './themeService';

export {
  db,
  getCharactersForUser,
  createNewCharacter,
  deleteCharacter,
  getThemeById,
};

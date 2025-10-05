# Mapa de Dependências do StoryCraft v2

Este documento mapeia as relações de `import` e `export` entre todos os arquivos `.js` e `.jsx` no diretório `src`.

---

### `src/App.jsx`
- **Exporta:**
  - `default`: `App` (Função)
- **Importa:**
  - `React`, `{ useState, useEffect }` de `'react'`
  - `{ useAuth }` de `'./hooks/useAuth'`
  - `Login` de `'./components/Login'`
  - `Dashboard` de `'./components/Dashboard'`

---

### `src/main.jsx`
- **Nenhum export.**
- **Importa:**
  - `React` de `'react'`
  - `ReactDOM` de `'react-dom/client'`
  - `App` de `'./App.jsx'`
  - `'./index.css'`
  - `{ AuthProvider }` de `'./context/AuthContext.jsx'`

---

### `src/components/Dashboard.jsx`
- **Exporta:**
  - `default`: `Dashboard` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect, useRef }` de `'react'`
  - `CharacterList` de `'./CharacterList.jsx'`
  - `CharacterSheet` de `'./CharacterSheet.jsx'`
  - `ModalManager` de `'./ModalManager.jsx'`
  - `ThemeEditor` de `'./ThemeEditor.jsx'`
  - `{ useAuth }` de `'../hooks/useAuth.js'`
  - `{ getCharactersForUser, createNewCharacter, deleteCharacter }` de `'../services/firestoreService'`
  - `{ getThemeById }` de `'../services/themeService'`
  - `{ doc, setDoc, collection, onSnapshot }` de `'firebase/firestore'`
  - `{ db }` de `'../services/firebase.js'`

---

### `src/components/CharacterList.jsx`
- **Exporta:**
  - `default`: `CharacterList` (Componente)
- **Importa:**
  - `React` de `'react'`

---

### `src/components/CharacterSheet.jsx`
- **Exporta:**
  - `default`: `CharacterSheet` (Componente)
- **Importa:**
  - `React`, `{ useState, useMemo }` de `'react'`
  - `{ useCharacter }` de `'../hooks/useCharacter.js'`
  - `ModalManager` de `'./ModalManager.jsx'`
  - `FloatingNav` de `'./FloatingNav.jsx'`
  - `ActionButtons` de `'./storycraft/ActionButtons.jsx'`
  - `{ CharacterInfo, MainAttributes, Wallet, DiscordIntegration }` de `'./CorePanels.jsx'`
  - `{ InventoryList, EquippedItemsList, SkillsList, PerksList }` de `'./ListSections.jsx'`
  - `SpecializationsList` de `'./Specializations.jsx'`
  - `{ Story, Notes }` de `'./ContentSections.jsx'`
  - `ActionsSection` de `'./storycraft/ActionsSection.jsx'`
  - `BuffsSection` de `'./BuffsSection.jsx'`
  - `AttributesSection` de `'./AttributesSection.jsx'`

---

### `src/components/CorePanels.jsx`
- **Exporta:**
  - `CharacterInfo` (Componente)
  - `MainAttributes` (Componente)
  - `Wallet` (Componente)
  - `DiscordIntegration` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect, useCallback, useMemo }` de `'react'`
  - `{ useAuth }` de `'../hooks/useAuth'`
  - `SheetSkin` de `'./SheetSkin'`

---

### `src/components/ListSections.jsx`
- **Exporta:**
  - `InventoryList` (Componente)
  - `EquippedItemsList` (Componente)
  - `SkillsList` (Componente)
  - `PerksList` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect, useCallback, useRef }` de `'react'`
  - `{ useAuth }` de `'../hooks/useAuth'`
  - `SheetSkin` de `'./SheetSkin'`

---

### `src/components/ContentSections.jsx`
- **Exporta:**
  - `Story` (Componente)
  - `Notes` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect, useRef, useCallback }` de `'react'`
  - `{ useAuth }` de `'../hooks/useAuth'`
  - `SheetSkin` de `'./SheetSkin'`

---

### `src/components/storycraft/ActionsSection.jsx`
- **Exporta:**
  - `default`: `ActionsSection` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect, useCallback, useRef }` de `'react'`
  - `{ useAuth }` de `'../../hooks/useAuth.js'`
  - `SheetSkin` de `'../SheetSkin'`

---

### `src/components/storycraft/ActionButtons.jsx`
- **Exporta:**
  - `default`: `ActionButtons` (Componente)
- **Importa:**
  - `React` de `'react'`

---

### `src/components/AttributesSection.jsx`
- **Exporta:**
  - `default`: `AttributesSection` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect, useCallback }` de `'react'`
  - `SheetSkin` de `'./SheetSkin'`

---

### `src/components/BuffsSection.jsx`
- **Exporta:**
  - `default`: `BuffsSection` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect, useCallback }` de `'react'`
  - `{ useAuth }` de `'../hooks/useAuth'`
  - `SheetSkin` de `'./SheetSkin'`

---

### `src/components/Specializations.jsx`
- **Exporta:**
  - `default`: `SpecializationsList` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect, useCallback, useRef }` de `'react'`
  - `{ useAuth }` de `'../hooks/useAuth'`
  - `SheetSkin` de `'./SheetSkin'`

---

### `src/components/FloatingNav.jsx`
- **Exporta:**
  - `default`: `FloatingNav` (Componente)
- **Importa:**
  - `React` de `'react'`
  - `QuickRoll` de `'./QuickRoll'`

---

### `src/components/QuickRoll.jsx`
- **Exporta:**
  - `default`: `QuickRoll` (Componente)
- **Importa:**
  - `React`, `{ useState, useCallback }` de `'react'`

---

### `src/components/SheetSkin.jsx`
- **Exporta:**
  - `default`: `SheetSkin` (Componente)
- **Importa:**
  - `React` de `'react'`

---

### `src/components/Login.jsx`
- **Exporta:**
  - `default`: `Login` (Componente)
- **Importa:**
  - `React` de `'react'`
  - `{ useAuth }` de `'../hooks/useAuth'`

---

### `src/components/ModalManager.jsx`
- **Exporta:**
  - `default`: `ModalManager` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect }` de `'react'`

---

### `src/components/ThemeEditor.jsx`
- **Exporta:**
  - `default`: `ThemeEditor` (Componente)
- **Importa:**
  - `React`, `{ useState, useEffect }` de `'react'`
  - `{ useAuth }` de `'../hooks/useAuth'`
  - `{ getThemesForUser, saveTheme, deleteTheme, applyThemeToCharacter }` de `'../services/themeService'`
  - `ModalManager` de `'./ModalManager'`

---

### `src/context/AuthContext.jsx`
- **Exporta:**
  - `AuthContext` (Contexto)
  - `AuthProvider` (Componente)
- **Importa:**
  - `React`, `{ createContext, useEffect, useState }` de `'react'`
  - `{ GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut }` de `'firebase/auth'`
  - `{ auth, db }` de `'../services/firebase.js'`
  - `{ doc, setDoc, getDoc, onSnapshot }` de `'firebase/firestore'`

---

### `src/hooks/useAuth.js`
- **Exporta:**
  - `useAuth` (Hook)
- **Importa:**
  - `{ useContext }` de `'react'`
  - `{ AuthContext }` de `'../context/AuthContext'`

---

### `src/hooks/useCharacter.js`
- **Exporta:**
  - `useCharacter` (Hook)
- **Importa:**
  - `{ useState, useEffect, useCallback }` de `'react'`
  - `{ doc, onSnapshot, setDoc }` de `'firebase/firestore'`
  - `{ db }` de `'../services/firebase'`

---

### `src/services/firebase.js`
- **Exporta:**
  - `auth` (Serviço)
  - `db` (Serviço)
- **Importa:**
  - `{ initializeApp }` de `'firebase/app'`
  - `{ getAuth }` de `'firebase/auth'`
  - `{ getFirestore }` de `'firebase/firestore'`

---

### `src/services/firestoreService.js`
- **Exporta:**
  - `getCharactersForUser` (Função)
  - `createNewCharacter` (Função)
  - `deleteCharacter` (Função)
- **Importa:**
  - `{ db }` de `'./firebase'`
  - `{ collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc }` de `'firebase/firestore'`

---

### `src/services/themeService.js`
- **Exporta:**
  - `getThemesForUser` (Função)
  - `getThemeById` (Função)
  - `saveTheme` (Função)
  - `deleteTheme` (Função)
  - `applyThemeToCharacter` (Função)
- **Importa:**
  - `{ db }` de `'./firebase'`
  - `{ collection, query, where, getDocs, getDoc, addDoc, doc, setDoc, deleteDoc }` de `'firebase/firestore'`

---

## Dependências Externas (Raiz do Projeto)

Esta seção descreve como os arquivos na raiz do projeto dependem dos arquivos dentro de `/src`.

### `index.html`
- **Tipo de Dependência:** Ponto de Entrada da Aplicação
- **Detalhes:** Carrega o script principal da aplicação React através da tag:
  ```html
  <script type="module" src="/src/main.jsx"></script>
  ```
- **Impacto:** Este é o elo fundamental entre o navegador e a sua aplicação React. O Vite (o empacotador do projeto) começa por aqui para construir a árvore de dependências.

### `tailwind.config.js`
- **Tipo de Dependência:** Configuração de Estilização (Scan de Conteúdo)
- **Detalhes:** O campo `content` especifica quais arquivos o Tailwind CSS deve "assistir" para encontrar classes e gerar o CSS necessário.
  ```javascript
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  ```
- **Impacto:** Mover arquivos *dentro* de `src` não quebra essa configuração, pois o padrão (`./src/**/*.{js,ts,jsx,tsx}`) é um "glob" que encontra todos os arquivos correspondentes, não importa em qual subpasta de `src` eles estejam.

### `package.json`
- **Tipo de Dependência:** Ferramentas de Build e Scripts
- **Detalhes:** A seção `scripts` define como o projeto é executado e construído, usando `vite`.
  ```json
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  ```
- **Impacto:** O `vite` é a ferramenta que lê `index.html`, processa os imports a partir de `src/main.jsx`, e empacota tudo para o navegador. A configuração do Vite (implícita ou em um `vite.config.js`) é o que gerencia a resolução dos módulos dentro de `src`.

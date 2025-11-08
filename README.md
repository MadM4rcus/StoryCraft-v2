# StoryCraft V2 - Ficha de Personagem RPG

Bem-vindo ao repositório do StoryCraft V2! Este é um sistema de fichas de personagem de RPG dinâmico e personalizável, construído com React, Vite e Firebase.

🚀 Sobre o Projeto
=================

O StoryCraft é uma plataforma web para gerenciar fichas de personagem de TTRPG em tempo real. O foco principal é fornecer uma experiência rápida, responsiva e personalizável tanto para jogadores quanto para Mestres (GMs).

A plataforma utiliza o Firebase Firestore para sincronização de dados em tempo real, permitindo que múltiplas pessoas (como um Mestre e um Jogador) visualizem e editem a mesma ficha simultaneamente.

✨ Principais Funcionalidades
===========================

*   **Autenticação de Usuários**: Login seguro via Google para fácil acesso e gerenciamento de fichas.
*   **Fichas em Tempo Real**: Edições em uma ficha são refletidas instantaneamente para todos os usuários autorizados, graças ao Cloud Firestore.
*   **Visuais de Ficha (Skins)**: A arquitetura suporta múltiplos visuais ("skins") para o mesmo sistema de regras. Atualmente, existem o visual `v1` (clássico) e `v2` (com layout dinâmico).
*   **Visão do Mestre (GM)**: Mestres de jogo têm permissão para visualizar, editar e deletar as fichas de todos os jogadores em sua sessão, conforme definido nas regras do Firestore.
*   **Feed de Sessão**: Um feed em tempo real para rolagens de dados e mensagens, garantindo a integridade do log de eventos da sessão.
*   **Layout Dinâmico (Skin V2)**: O visual v2 não possui um layout fixo. Sua estrutura é carregada de um documento no Firestore, permitindo que a aparência da ficha seja alterada sem a necessidade de um novo deploy.
*   **Ferramenta de Ajuste (GM-Only)**: Uma ferramenta interna (`ClassicSheetAdjuster`) permite que o Mestre mova, redimensione e salve as posições dos elementos do visual V2 diretamente no banco de dados.

📁 Estrutura do Projeto
======================

Uma visão geral da arquitetura de pastas do src/:

*   `/components`: Componentes React globais e reutilizáveis (Ex: `ModalManager`, `Login`).
*   `/context`: React Contexts para gerenciamento de estado global (Ex: `AuthContext`, `SystemContext`).
*   `/hooks`: Hooks customizados que encapsulam lógica de negócios e interações com serviços (Ex: `useAuth`, `useCharacter`).
*   `/services`: Módulos que lidam com a comunicação com serviços externos, primariamente o Firebase (`firebase.js`, `firestoreService.js`).
*   `/systems`: O coração da aplicação. Cada subpasta representa um visual de ficha (skin) para o sistema StoryCraft.
    *   `/storycraft`: O visual V1 (HTML/Tailwind).
    *   `/storycraft_v2`: O novo visual V2 (dinâmico, baseado em imagem e layout do Firestore).

### Arquivos de Configuração Principais

*   `vite.config.js`: Configuração do ambiente de desenvolvimento Vite, incluindo aliases de caminho como `@` e `@systems`.
*   `tailwind.config.js`: Define o tema do Tailwind CSS, incluindo cores customizadas (`bgPage`, `textPrimary`, etc.) que são povoadas por variáveis CSS, permitindo a tematização dinâmica.
*   `firebase.json`: Configura o deploy para o Firebase Hosting, definindo o diretório público como `dist` e configurando reescritas para suportar roteamento de single-page application (SPA).
*   `firestore.rules`: Define as regras de segurança para o banco de dados Cloud Firestore, essencial para proteger os dados dos usuários e garantir que apenas pessoas autorizadas (jogadores e mestres) possam acessar ou modificar as fichas.


🎯 Próximos Passos (Roadmap)
============================

Aqui é onde podemos rastrear as próximas grandes tarefas.

-   [x] Implementar a ferramenta `ClassicSheetAdjuster` para mapeamento de layout.
-   [ ] (Em andamento) Migrar o `sheet_layout.json` de um arquivo estático para um documento no Firestore.
-   [ ] Criar as funções `getLayout` e `saveLayout` no `firestoreService.js`.
-   [ ] Conectar o `ClassicSheetAdjuster` para salvar o layout no Firestore.
-   [ ] Conectar o `ClassicSheet` para carregar o layout do Firestore em tempo real.
-   [ ] Implementar a lógica de rolagem (`rollable`) nos elementos da ficha.


file tree

📦STORYCRAFT-V2
 ┣ 📂src
 ┃ ┣ 📂components
 ┃ ┃ ┣ 📜ChatInput.jsx
 ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┣ 📜Login.jsx
 ┃ ┃ ┣ 📜LoginScreen.jsx
 ┃ ┃ ┣ 📜ModalManager.jsx
 ┃ ┃ ┣ 📜PartyHealthMonitor.jsx
 ┃ ┃ ┣ 📜RollFeed.jsx
 ┃ ┃ ┣ 📜SystemRouter.jsx
 ┃ ┃ ┗ 📜ThemeEditor.jsx
 ┃ ┣ 📂context
 ┃ ┃ ┣ 📜AuthContext.jsx
 ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┣ 📜PartyHealthContext.jsx
 ┃ ┃ ┣ 📜RollFeedContext.jsx
 ┃ ┃ ┗ 📜SystemContext.jsx
 ┃ ┣ 📂hooks
 ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┣ 📜useAuth.js
 ┃ ┃ ┗ 📜useCharacter.js
 ┃ ┣ 📂package
 ┃ ┃ ┗ 📜storycraft-bg-classic.png
 ┃ ┣ 📂services
 ┃ ┃ ┣ 📜firebase.js
 ┃ ┃ ┣ 📜firestoreService.js
 ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┣ 📜sessionService.js
 ┃ ┃ ┗ 📜themeService.js
 ┃ ┣ 📂systems
 ┃ ┃ ┣ 📂storycraft
 ┃ ┃ ┃ ┣ 📜ActionsSection.jsx
 ┃ ┃ ┃ ┣ 📜BuffsSection.jsx
 ┃ ┃ ┃ ┣ 📜CharacterList.jsx
 ┃ ┃ ┃ ┣ 📜CharacterSheet.jsx
 ┃ ┃ ┃ ┣ 📜ContentSections.jsx
 ┃ ┃ ┃ ┣ 📜CorePanels.jsx
 ┃ ┃ ┃ ┣ 📜Dashboard.jsx
 ┃ ┃ ┃ ┣ 📜FloatingNav.jsx
 ┃ ┃ ┃ ┣ 📜index.js
 ┃ ┃ ┃ ┣ 📜ListSections.jsx
 ┃ ┃ ┃ ┣ 📜QuickRoll.jsx
 ┃ ┃ ┃ ┣ 📜SheetSkin.jsx
 ┃ ┃ ┃ ┗ 📜Specializations.jsx
 ┃ ┃ ┗ 📂storycraft_v2
 ┃ ┃ ┃ ┣ 📜ClassicHeader.jsx
 ┃ ┃ ┃ ┣ 📜ClassicSheet.jsx
 ┃ ┃ ┃ ┣ 📜ClassicSheetAdjuster.jsx
 ┃ ┃ ┃ ┣ 📜classicSheetStyles.css
 ┃ ┃ ┃ ┣ 📜Dashboard.jsx
 ┃ ┃ ┃ ┗ 📜sheet_layout.json
 ┃ ┣ 📜App.jsx
 ┃ ┣ 📜index.css
 ┃ ┗ 📜main.jsx
 ┣ 📜.firebaserc
 ┣ 📜.gitignore
 ┣ 📜firebase.json
 ┣ 📜firestore.rules
 ┣ 📜index.html
 ┣ 📜jsconfig.json
 ┣ 📜package-lock.json
 ┣ 📜package.json
 ┣ 📜postcss.config.js
 ┣ 📜README.md
 ┣ 📜tailwind.config.js
 ┗ 📜vite.config.js
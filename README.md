# StoryCraft V2 - Ficha de Personagem RPG

Bem-vindo ao repositório do StoryCraft V2! Este é um sistema de fichas de personagem de RPG dinâmico e personalizável, construído com React, Vite e Firebase.

🚀 Sobre o Projeto
=================

O StoryCraft é uma plataforma web para gerenciar fichas de personagem de TTRPG em tempo real. O foco principal é fornecer uma experiência rápida, responsiva e personalizável tanto para jogadores quanto para Mestres (GMs).

A plataforma utiliza o Firebase Firestore para sincronização de dados em tempo real, permitindo que múltiplas pessoas (como um Mestre e um Jogador) visualizem e editem a mesma ficha simultaneamente.

✨ Principais Funcionalidades
===========================

* **Autenticação de Usuários**: Login seguro via Google para fácil acesso e gerenciamento de fichas.
* **Fichas em Tempo Real**: Edições em uma ficha são refletidas instantaneamente para todos os usuários autorizados, graças ao Cloud Firestore.
* **Visuais de Ficha (Skins)**: A arquitetura suporta múltiplos visuais ("skins") para o mesmo sistema de regras. Atualmente, existem o visual `v1` (clássico) e `v2` (com layout dinâmico).
* **Visão do Mestre (GM)**: Mestres de jogo têm permissão para visualizar, editar e deletar as fichas de todos os jogadores em sua sessão, conforme definido nas regras do Firestore.
* **Feed de Sessão**: Um feed em tempo real para rolagens de dados e mensagens, garantindo a integridade do log de eventos da sessão.
* **Layout Dinâmico (Skin V2)**: O visual v2 não possui um layout fixo. Sua estrutura é carregada de um documento no Firestore, permitindo que a aparência da ficha seja alterada sem a necessidade de um novo deploy.
* **Ferramenta de Ajuste (GM-Only)**: Uma ferramenta interna (`ClassicSheetAdjuster`) permite que o Mestre mova, redimensione e salve as posições dos elementos do visual V2 diretamente no banco de dados.

⚙️ Gerenciando Permissões de Mestre
==================================

A permissão de Mestre (`isMaster`) é controlada por "Custom Claims" do Firebase Authentication para otimizar a performance e reduzir custos de leitura do Firestore. Para modificar essas permissões, você precisa usar scripts Node.js que interagem com o Firebase Admin SDK.

**Passo 1: Obter a Chave de Conta de Serviço**

1.  Vá para o seu **Console do Firebase**.
2.  Clique na engrenagem (⚙️) e selecione **Configurações do projeto**.
3.  Vá para a aba **Contas de serviço**.
4.  Clique em **Gerar nova chave privada**.
5.  Renomeie o arquivo JSON baixado para `serviceAccountKey.json` e coloque-o na raiz do projeto.
    *   **Atenção:** Este arquivo é confidencial. Ele já está no `.gitignore` para evitar que seja enviado para o repositório.

**Passo 2: Promover um Usuário a Mestre**

1.  Encontre o UID do usuário no Console do Firebase > Authentication.
2.  Execute o seguinte comando no terminal, na raiz do projeto:

    ```bash
    node set-master-claim.cjs <UID_DO_USUARIO>
    ```

**Passo 3: Remover a Permissão de Mestre**

1.  Encontre o UID do usuário no Console do Firebase > Authentication.
2.  Execute o seguinte comando no terminal:

    ```bash
    node remove-master-claim.cjs <UID_DO_USUARIO>
    ```

📁 Estrutura do Projeto
======================

Uma visão geral da arquitetura de pastas do src/:

* `/components`: Componentes React globais e reutilizáveis (Ex: `ModalManager`, `Login`).
* `/context`: React Contexts para gerenciamento de estado global (Ex: `AuthContext`, `SystemContext`).
* `/hooks`: Hooks customizados que encapsulam lógica de negócios e interações com serviços (Ex: `useAuth`, `useCharacter`).
* `/services`: Módulos que lidam com a comunicação com serviços externos, primariamente o Firebase (`firebase.js`, `firestoreService.js`).
* `/systems`: O coração da aplicação. Cada subpasta representa um visual de ficha (skin) para o sistema StoryCraft.
    * `/storycraft`: O visual V1 (HTML/Tailwind).
    * `/storycraft_v2`: O novo visual V2 (dinâmico, baseado em imagem e layout do Firestore).

### Arquivos de Configuração Principais

* `vite.config.js`: Configuração do ambiente de desenvolvimento Vite, incluindo aliases de caminho como `@` e `@systems`.
* `tailwind.config.js`: Define o tema do Tailwind CSS, incluindo cores customizadas (`bgPage`, `textPrimary`, etc.) que são povoadas por variáveis CSS, permitindo a tematização dinâmica.
* `firebase.json`: Configura o deploy para o Firebase Hosting, definindo o diretório público como `dist` e configurando reescritas para suportar roteamento de single-page application (SPA).
* `mirror_firestore_rules.md`: Cópia das regras de segurança para o banco de dados Cloud Firestore, essencial para proteger os dados dos usuários e garantir que apenas pessoas autorizadas (jogadores e mestres) possam acessar ou modificar as fichas.


🎯 Próximos Passos (Roadmap)
============================

Aqui é onde podemos rastrear as próximas grandes tarefas.

### Prioridade Atual: Otimização e Redução de Custos

-   [x] **Otimizar Leituras do Firestore:** Identificar e corrigir componentes que causam consumo excessivo de leituras no banco de dados. O objetivo é garantir que a aplicação seja sustentável e não ultrapasse os limites do plano gratuito.

(Tarefa executada, porêm sempre manter manutenção.)

### Em Pausa

-   **Desenvolvimento da Skin V2 (`storycraft_classic`):** O trabalho no sistema de layout dinâmico está em pausa até que a funcionalidade do Gerenciador de Eventos seja concluída.

### Nova Funcionalidade: Gerenciador de Eventos (Combate)

Esta será a próxima grande funcionalidade, evoluindo o `PartyHealthMonitor` para um sistema completo de gerenciamento de encontros. O objetivo é permitir que o Mestre controle combates e que as ações dos jogadores tenham consequências automatizadas, mantendo os custos do Firebase no mínimo.

**Plano de Ação:**

1.  **Arquitetura "Mestre como Host":**
    *   O estado do combate (participantes, HPs, turnos, etc.) será mantido no navegador do Mestre, não no Firestore, para evitar leituras/escritas constantes.
    *   Ao iniciar um "evento", o Mestre adiciona jogadores e NPCs. O sistema fará uma leitura inicial das fichas no **Firestore** para popular o estado do combate.

2.  **Comunicação via Realtime Database:**
    *   Será criado um novo "canal" (`/combat-events/{sessionId}`) no **Realtime Database**.
    *   O Mestre transmitirá o estado do combate para este canal. Todos os jogadores irão "ouvir" as mudanças para que suas interfaces (ex: o monitor de vida do grupo) sejam atualizadas em tempo real.
    *   As regras de segurança garantirão que apenas o Mestre possa escrever neste canal.

3.  **Fluxo de Ação com Aprovação:**
    *   Quando um jogador usar uma ação (ex: um ataque), ele não executará a lógica. Em vez disso, enviará uma "solicitação de ação" para um canal separado no Realtime Database (`/action-requests/{sessionId}`).
    *   O navegador do Mestre receberá essa solicitação e exibirá um **popup de aprovação**.
    *   O Mestre poderá aprovar, negar ou modificar a ação.

4.  **Execução e Sincronização:**
    *   Ao aprovar, o navegador do Mestre executará a lógica da ação (rolagens, cálculos de dano, etc.).
    *   O estado do combate local do Mestre será atualizado (ex: o HP do alvo diminui).
    *   Imediatamente, o novo estado será retransmitido para todos os jogadores via Realtime Database.

5.  **Persistência Econômica:**
    *   As atualizações de HP/MP só serão salvas permanentemente no **Firestore** quando o Mestre clicar em um botão "Salvar Combate". Isso consolida todas as mudanças em poucas operações de escrita, otimizando drasticamente os custos.

6.  **Desenvolvimento da Interface:**
    *   Evoluir o componente `PartyHealthMonitor` para se tornar o novo "Gerenciador de Eventos".
    *   Criar o novo modal de aprovação de ações para o Mestre.
    *   Adaptar a ficha do jogador para entrar em "modo de combate", onde as ações disparam solicitações em vez de execuções diretas.

Sobre essa tarefa: eu já renomeei o partyHealthMonitor e seu context para nomenclaturas mais adequadas, (verificar dependencias.)

a idéia é evoluir o componente em vez de apenas um monitor e atalho para fichas, para um construtor de eventos robusto. a interface do mestre deverá ser possivel de criar multiplos eventos de combate.
salvar e encerrar esses eventos caso deseje. na interface do jogador não mestre ele apenas tem a exibição do jeito que está atualmente com os nomes das fichas, sem poder clicar para ver a ficha, apenas o nome, hp e mp caso o mestre deseje compartilhar. 

o mestre deverá poder adicionar quaisquer fichas ao evento, essas fichas que estão juntas em um evento devem poder interagir entre sí: por exemplo já temos as açoes rápidas que são espécies de ataques que o proprio jogador configura. ao clicar nessa ação atualmente o app faz as rolagens pré-configuradas no chat e no discord. porém quando estiver em um evento com mais de uma ficha, o usuário dono da ficha que está em um evento deverá poder escolher um alvo para essa ação rápida, seja cura ou ataque, ao usar uma ação e escolher um alvo, o app vai enviar essas informaçoes para o monitor de eventos para o mestre confirmar ou cancelar. se o mestre confirmar a ação toma efeito. seja ela uma cura, um ataque, se for cura, a rolagem deve acontecer, e o alvo recuperar o hp segundo as regras definidas pela ação em questão, o mesmo para os ataques. existem algumas regras e lógicas que devem ser aplicadas mas isso eu adicionarei futuramente, a principio precisamos criar essa interface que reune essas açoes. 

uma nova coleçao no firestore será criada para salvar esses eventos de combate. caso o mestre deseje salvar. 
para evitar leituras e escritas desnecessárias no firestore, somente será feita a leitura das fichas quando o mestre adicionar uma ficha para o evento, ou quando ele clicar em algum botão "atualizar" pois as vezes alguma ficha pode receber um buff, e isso provavelmente não será atualizado em tempo real no monitor de eventos. 
no decorrer do evento, vão acontecer curas e ataques, alterações no hp e mp das fichas. essa informação não deve ser constantemente lida e escrita, apenas quando o mestre clicar em salvar. 
tudo isso acontecerá usando o navegador do mestre como servidor temporário. e será salvo no firestore quando o mestre clicar em salvar atualizando assim o hp e mp de todas as fichas envolvidas no evento. 
para visualização em tempo real dos jogadores podemos usar o servidor real time, para atualizar para os jogadores o estado de hp e mp, bem como outras informaçoes, passagem de turnos etec. 

a principio vamos deixar o componente minimamente funcional, criar os canais de comunicação, e depois eu adiciono os detalhes e regras


📦STORYCRAFT-V2
┣ 📂src
┃ ┣ 📂components
┃ ┃ ┣ 📜ChatInput.jsx
┃ ┃ ┣ 📜GlobalControls.jsx
┃ ┃ ┣ 📜Login.jsx
┃ ┃ ┣ 📜LoginScreen.jsx
┃ ┃ ┣ 📜ModalManager.jsx
┃ ┃ ┣ 📜PartyHealthMonitor.jsx => EventManager.jsx
┃ ┃ ┣ 📜RollFeed.jsx
┃ ┃ ┣ 📜SystemRouter.jsx
┃ ┃ ┗ 📜ThemeEditor.jsx
┃ ┣ 📂context
┃ ┃ ┣ 📜AuthContext.jsx
┃ ┃ ┣ 📜GlobalControlsContext.jsx
┃ ┃ ┣ 📜PartyHealthContext.jsx => EventManagerContext.jsx
┃ ┃ ┣ 📜RollFeedContext.jsx
┃ ┃ ┣ 📜SystemContext.jsx
┃ ┃ ┗ 📜UIStateContext.jsx
┃ ┣ 📂hooks
┃ ┃ ┣ 📜useAuth.js
┃ ┃ ┗ 📜useCharacter.js
┃ ┣ 📂package
┃ ┃ ┗ 📜storycraft-bg-classic.png
┃ ┣ 📂services
┃ ┃ ┣ 📜firebase.js
┃ ┃ ┣ 📜firestoreService.js
┃ ┃ ┣ 📜index.js
┃ ┃ ┣ 📜localStoreService.js
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
┃ ┃ ┃ ┣ 📜ListSections.jsx
┃ ┃ ┃ ┣ 📜SheetSkin.jsx
┃ ┃ ┃ ┗ 📜Specializations.jsx
┃ ┃ ┗ 📂storycraft_classic
┃ ┃   ┣ 📜classic_sheet_layout.json
┃ ┃   ┣ 📜ClassicDashboard.jsx
┃ ┃   ┣ 📜ClassicHeader.jsx
┃ ┃   ┣ 📜ClassicSheet.jsx
┃ ┃   ┣ 📜ClassicSheetAdjuster.jsx
┃ ┃   ┗ 📜classicSheetStyles.css
┃ ┣ 📜App.jsx
┃ ┣ 📜index.css
┃ ┗ 📜main.jsx
┣ 📜.firebaserc
┣ 📜.gitignore
┣ 📜firebase.json
┣ 📜index.html
┣ 📜jsconfig.json
┣ 📜mirror_firestore_rules.md
┣ 📜mirror_realtime_rules.md
┣ 📜package.json
┣ 📜postcss.config.js
┣ 📜README.md
┣ 📜remove-master-claim.cjs
┣ 📜set-master-claim.cjs
┣ 📜tailwind.config.js
┗ 📜vite.config.js

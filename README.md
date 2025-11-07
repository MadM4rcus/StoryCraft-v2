# StoryCraft V2 - Ficha de Personagem RPG

Bem-vindo ao repositório do StoryCraft V2! Este é um sistema de fichas de personagem de RPG dinâmico e personalizável, construído com React e Firebase.

Npm run build

firebase deploy
_______________________________________________________

Regras firestore

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // =====================================================================
    // FUNÇÕES GLOBAIS
    // =====================================================================
    function isMasterV2(appId) {
      return get(/databases/$(database)/documents/artifacts2/$(appId)/users/$(request.auth.uid)).data.isMaster == true;
    }

    function isMasterV1(appId) {
      return get(/databases/$(database)/documents/artifacts/$(appId)/users/$(request.auth.uid)).data.isMaster == true;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    // =====================================================================
    // REGRAS PARA STORYCRAFT V1 (LEGADO - artifacts)
    // =====================================================================
    match /artifacts/{appId}/users/{userId}/characterSheets/{documentId} {
      allow write: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
      allow read: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
      allow delete: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
    }

    match /artifacts/{appId}/users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
      allow write: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
    }

    match /artifacts/{appId}/users/{userId}/{documents=**} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }

    // =====================================================================
    // REGRAS PARA STORYCRAFT V2 (ATUAL - artifacts2)
    // =====================================================================
    match /artifacts2/{appId}/users/{userId} {
      allow read, write: if isSignedIn() && (request.auth.uid == userId || isMasterV2(appId));
      allow list: if isSignedIn() && isMasterV2(appId); // Permite ao mestre listar usuários
    }

    match /artifacts2/{appId}/users/{userId}/characterSheets/{sheetId} {
      allow read, write, delete: if isSignedIn() && (request.auth.uid == userId || isMasterV2(appId));
    }

    // =====================================================================
    // REGRAS PARA DADOS DE SESSÃO (CHAT/FEED E CONFIGS) - NOVO
    // =====================================================================
    match /storycraft-v2/{appId}/feed/{messageId} {
      // Qualquer usuário logado pode ler o feed e criar novas mensagens/rolagens.
      // Ninguém pode atualizar ou deletar mensagens para manter a integridade do log.
      allow read, create: if isSignedIn();
      allow update, delete: if false; // Proíbe explicitamente a alteração/deleção
    }

    match /storycraft-v2/{appId}/userSettings/{userId} {
      // Um usuário só pode ler e escrever suas próprias configurações.
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }

    // =====================================================================
    // REGRAS PARA TEMAS (SEM ALTERAÇÃO)
    // =====================================================================
    match /themes/{themeId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.ownerUid;
      allow update, delete: if isSignedIn() && request.auth.uid == resource.data.ownerUid;
    }
  }
}

___________________________________________________

Next:

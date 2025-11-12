rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // =====================================================================
    // FUNÇÕES GLOBAIS
    // =====================================================================
    function isMasterV2(appId) {
      return get(/databases/$(database)/documents/artifacts2/$(appId)/users/$(request.auth.uid)).data.isMaster == true;
    }

    // =====================================================================
    // REGRAS PARA STORYCRAFT V1 (LEGADO - artifacts)
    // =====================================================================
    match /artifacts/{appId}/users/{userId}/characterSheets/{documentId} {
      // Para o legado, vamos assumir que apenas o dono pode editar por enquanto.
      // A lógica de mestre V1 precisaria ser migrada para claims também se ainda for usada.
      allow write: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
      allow read: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
      allow delete: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
    }

    match /artifacts/{appId}/users/{userId} {
      // Simplificando regras legadas
      allow read: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
      allow write: if isSignedIn() && (request.auth.uid == userId || isMasterV1(appId));
    }

    match /artifacts/{appId}/users/{userId}/{documents=**} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }

    // =====================================================================
    // REGRAS PARA STORYCRAFT V2 (ATUAL - artifacts2)
    // =====================================================================
    
    // --- REGRA CORRIGIDA (Separamos Read e Write para quebrar o loop) ---
    match /artifacts2/{appId}/users/{userId} {
      // Um usuário pode SEMPRE ler seu próprio documento. Isso quebra o loop.
      allow read: if isSignedIn() && request.auth.uid == userId;
      
      // Um usuário pode escrever em seu próprio doc, OU um Mestre pode escrever.
      // A função 'write' chama 'isMasterV2', que 'lê'.
      // Como a regra 'read' acima é separada e permite a leitura, o loop é quebrado.
      allow write: if isSignedIn() && (request.auth.uid == userId || isMasterV2(appId));
      
      // Um mestre pode listar todos os usuários.
      allow list: if isSignedIn() && isMasterV2(appId);
    }

    match /artifacts2/{appId}/users/{userId}/characterSheets/{sheetId} {
      allow read, write, delete: if isSignedIn() && (request.auth.uid == userId || isMasterV2(appId));
    }

    // =====================================================================
    // REGRAS PARA DADOS DE SESSÃO (CHAT/FEED E CONFIGS) - NOVO
    // =====================================================================
    match /storycraft-v2/{appId}/feed/{messageId} {
      allow read, create: if isSignedIn();
      allow update, delete: if false; 
    }

    // --- REGRA PARA OS LAYOUTS DE FICHA (SKINS) ---
    match /storycraft-v2/{appId}/layouts/{systemId} {
      allow read: if isSignedIn();
      
      // *** AQUI ESTÁ A REGRA CORRETA QUE VOCÊ QUERIA ***
      // Agora ela funciona, pois 'isMasterV2' pode ler o doc de usuário sem travar.
      // Ela usa o {appId} do seu aplicativo (o 1:727...) que o seu app
      // deve conhecer e passar para a função isMasterV2.
      // Vamos usar o seu appId específico, como você me mostrou.
      allow write: if isSignedIn() && isMasterV2("1:727724875985:web:97411448885c68c289e5f0");
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
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // =====================================================================
    // REGRAS PARA STORYCRAFT V1 (LEGADO - artifacts)
    // =====================================================================
    match /artifacts/{appId}/users/{userId}/characterSheets/{documentId} {
      // Para o legado, vamos assumir que apenas o dono pode editar por enquanto.
      // A lógica de mestre V1 precisaria ser migrada para claims também se ainda for usada.
      allow write: if request.auth != null && (request.auth.uid == userId || request.auth.token.isMaster == true);
      allow read: if request.auth != null && (request.auth.uid == userId || request.auth.token.isMaster == true);
      allow delete: if request.auth != null && (request.auth.uid == userId || request.auth.token.isMaster == true);
    }

    match /artifacts/{appId}/users/{userId} {
      // Simplificando regras legadas
      allow read: if request.auth != null && (request.auth.uid == userId || request.auth.token.isMaster == true);
      allow write: if request.auth != null && (request.auth.uid == userId || request.auth.token.isMaster == true);
    }

    match /artifacts/{appId}/users/{userId}/{documents=**} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }

    // =====================================================================
    // REGRAS PARA STORYCRAFT V2 (ATUAL - artifacts2)
    // =====================================================================
    
    // Regra para o documento de usuário.
    match /artifacts2/{appId}/users/{userId} {
      // Um usuário pode SEMPRE ler seu próprio documento.
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Um usuário pode escrever em seu próprio doc, OU um Mestre pode escrever.
      // A verificação de 'isMaster' no token é segura e não causa loops de leitura.
      allow write: if request.auth != null && (request.auth.uid == userId || request.auth.token.isMaster == true);
      
      // Um mestre pode listar todos os usuários.
      allow list: if request.auth != null && request.auth.token.isMaster == true;
    }

    match /artifacts2/{appId}/users/{userId}/characterSheets/{sheetId} {
      // O dono da ficha ou um Mestre podem ler, escrever e deletar.
      allow read, write, delete: if request.auth != null && (request.auth.uid == userId || request.auth.token.isMaster == true);
    }

    // Regra de Collection Group: Permite que Mestres listem TODAS as fichas de uma vez.
    // Necessária para consultas como a do PartyHealthMonitor.
    // IMPORTANTE: Esta regra requer um índice composto no Firestore.
    match /{path=**}/characterSheets/{sheetId} {
      allow read: if request.auth != null && request.auth.token.isMaster == true;
    }

    // --- NOVA REGRA: Para a coleção de status otimizada do Party Monitor ---
    match /artifacts2/{appId}/partyStatus/{statusId} {
      // Qualquer usuário logado pode ler os status (contém apenas HP/MP/Nome).
      allow read: if request.auth != null;
      // Ninguém pode escrever diretamente. Apenas o backend (Cloud Function) poderá atualizar.
      allow write: if false;
    }

    // =====================================================================
    // REGRAS PARA DADOS DE SESSÃO (CHAT/FEED E CONFIGS) - NOVO
    // =====================================================================
    // Regra para os layouts de ficha (skins).
    match /storycraft-v2/{appId}/layouts/{systemId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.isMaster == true;
    }

    match /storycraft-v2/{appId}/userSettings/{userId} {
      // Um usuário só pode ler e escrever suas próprias configurações.
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // =====================================================================
    // REGRAS PARA TEMAS (SEM ALTERAÇÃO)
    // =====================================================================
    match /themes/{themeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerUid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerUid;
    }
  }
}
{
  "rules": {
    // Define as regras para o nó principal do seu app
    "storycraft-v2": { // Nó para o chat/feed
      // Regra curinga para qualquer ID de sessão (ex: "default-session")
      "$session_id": {
        // Qualquer usuário autenticado pode ler os dados da sessão (o feed de rolagens).
        ".read": "auth != null",

        // Ninguém pode sobrescrever a lista inteira de itens do feed.
        // A permissão de escrita será concedida por item individual abaixo.
        ".write": false,

        // Adiciona um índice no campo 'timestamp' para otimizar as consultas
        // que ordenam e limitam os itens do feed. Isso resolve o aviso de performance.
        ".indexOn": "timestamp",

        // Regras para cada novo item ($pushId) que está sendo adicionado ao feed.
        "$pushId": {
          // Permite a escrita se o usuário estiver autenticado E se o item ainda não existir.
          // Isso garante que a operação seja apenas de criação (push).
          ".write": "auth != null && !data.exists()",

          // Valida a estrutura dos dados que estão sendo enviados para garantir consistência.
          ".validate": "newData.hasChildren(['type', 'ownerUid', 'timestamp', 'characterName']) && newData.child('ownerUid').val() === auth.uid && newData.child('timestamp').val() === now && ((newData.child('type').val() === 'message' && newData.hasChild('text')) || (newData.child('type').val() === 'roll' && newData.hasChild('rollName')))"
        }
      },

      // --- NOVO: REGRAS PARA O GERENCIADOR DE EVENTOS ---
      "combat-events": {
        "$session_id": {
          // Qualquer jogador autenticado na sessão pode ler o estado do combate.
          // Isso permite que a UI de todos os jogadores se atualize em tempo real.
          ".read": "auth != null",

          // APENAS o Mestre pode escrever no estado do combate.
          // Esta é a regra de segurança final que impede que jogadores modifiquem o combate.
          // A verificação `auth.token.isMaster === true` usa o Custom Claim que já configuramos.
          ".write": "auth != null && auth.token.isMaster === true"
        }
      },

      // --- NOVO: REGRAS PARA AS SOLICITAÇÕES DE AÇÃO DO JOGADOR ---
      "action-requests": {
        "$session_id": {
          // Qualquer jogador autenticado pode enviar (escrever) uma solicitação de ação.
          ".write": "auth != null"
        }
      }
    }
  }
}

{
  "rules": {
    // Define as regras para o nó principal do seu app
    "storycraft-v2": {
      // Regra curinga para qualquer ID de sessão (ex: "default-session")
      "$session_id": {
        // Qualquer usuário autenticado pode ler os dados da sessão (o feed).
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
      }
    }
  }
}

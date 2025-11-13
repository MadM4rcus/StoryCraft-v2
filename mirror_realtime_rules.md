{
  "rules": {
    // Por padrão, ninguém pode ler ou escrever em lugar nenhum.
    ".read": false,
    ".write": false,
    
    // Define as regras para o nó principal do seu app
    "storycraft-v2": {
      // Define as regras para o nó da sessão de chat/rolagens
      "default-session": {
        
        // Qualquer usuário autenticado pode ler as mensagens do feed.
        ".read": "auth != null",
        
        // Para cada nova mensagem ($pushId) que está sendo adicionada...
        "$pushId": {
          // Apenas usuários autenticados podem tentar escrever.
          // A validação abaixo garante que eles só escrevam em seu próprio nome.
          ".write": "auth != null",
          
          // Valida a estrutura e a autoria dos dados que estão sendo enviados.
          ".validate": "newData.hasChildren(['characterName', 'ownerUid', 'timestamp', 'type']) && newData.child('ownerUid').val() === auth.uid && (newData.child('type').val() === 'message' ? newData.hasChild('text') : newData.hasChild('rollName')) && newData.child('timestamp').val() === now"
        }
      }
    }
  }
}

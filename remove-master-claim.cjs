// remove-master-claim.cjs

/**
 * =================================================================================
 * SCRIPT PARA REMOVER A PERMISSÃO DE MESTRE (MASTER) DE UM USUÁRIO
 * =================================================================================
 * 
 * COMO USAR:
 * 1. Certifique-se de que o arquivo `serviceAccountKey.json` está na raiz do projeto.
 * 
 * 2. Encontre o UID do usuário que você quer rebaixar no Console do Firebase > Authentication.
 * 
 * 3. Execute o seguinte comando no seu terminal, substituindo <UID_DO_USUARIO> pelo UID real:
 *    
 *    node remove-master-claim.cjs <UID_DO_USUARIO>
 * 
 * =================================================================================
 */

const admin = require('firebase-admin');

// Carrega as credenciais da sua conta de serviço
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa o Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Pega o UID do usuário a partir do argumento da linha de comando
const uid = process.argv[2];

if (!uid) {
  console.error('Erro: Forneça o UID do usuário como argumento.');
  console.log('Uso: node remove-master-claim.cjs <UID_DO_USUARIO>');
  process.exit(1);
}

// Define a custom claim 'isMaster' como null para remover a permissão.
admin.auth().setCustomUserClaims(uid, { isMaster: null })
  .then(() => {
    console.log(`Sucesso! A claim 'isMaster' foi removida para o usuário: ${uid}`);
    console.log('O usuário precisa deslogar e logar novamente (ou recarregar a página) para que a mudança tenha efeito.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao remover a custom claim:', error);
    process.exit(1);
  });
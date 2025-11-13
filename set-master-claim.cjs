// set-master-claim.cjs

/**
 * =================================================================================
 * SCRIPT PARA PROMOVER UM USUÁRIO A MESTRE (MASTER)
 * =================================================================================
 * 
 * COMO USAR:
 * 1. Certifique-se de que o arquivo `serviceAccountKey.json` está na raiz do projeto.
 *    (Você pode gerar um novo em: Console do Firebase > Configurações do Projeto > Contas de Serviço)
 * 
 * 2. Encontre o UID do usuário que você quer promover no Console do Firebase > Authentication.
 * 
 * 3. Execute o seguinte comando no seu terminal, substituindo <UID_DO_USUARIO> pelo UID real:
 *    
 *    node set-master-claim.cjs <UID_DO_USUARIO>
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
  console.log('Uso: node set-master-claim.cjs <UID_DO_USUARIO>');
  process.exit(1);
}

// Define a custom claim 'isMaster' como true para o usuário especificado
admin.auth().setCustomUserClaims(uid, { isMaster: true })
  .then(() => {
    console.log(`Sucesso! A claim 'isMaster: true' foi definida para o usuário: ${uid}`);
    console.log('O usuário precisa deslogar e logar novamente (ou recarregar a página) para que a mudança tenha efeito.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao definir a custom claim:', error);
    process.exit(1);
  });
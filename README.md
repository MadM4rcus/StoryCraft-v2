# StoryCraft V2 - Ficha de Personagem RPG

Bem-vindo ao repositório do StoryCraft V2! Este é um sistema de fichas de personagem de RPG dinâmico e personalizável, construído com React e Firebase.

## 🚀 Rodando o Projeto (Ambiente de Desenvolvimento)

Para trabalhar em novas funcionalidades, testar mudanças ou corrigir bugs, você deve usar o servidor de desenvolvimento local. Este modo **não afeta** a versão que está online.

1.  **Abra o projeto em um ambiente como o GitHub Codespaces.**

2.  **Instale as dependências (se for a primeira vez):**
    Abra o terminal e execute:
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    Isso iniciará um servidor local (geralmente em uma porta como `5173`). O Codespaces irá te mostrar um pop-up para abrir o site em uma nova aba do navegador. Todas as alterações que você fizer no código serão atualizadas automaticamente nesta aba.

## 🛰️ Publicando Atualizações (Deploy para a Web)

Quando você tiver certeza de que suas alterações estão prontas, siga estes passos para atualizar o site que está no ar em **`https://storycraftrpg.web.app`**.

**Pré-requisito Importante:** Antes de publicar, sempre salve seu progresso no GitHub!
```bash
git add .
git commit -m "Descreva suas alterações aqui"
git push

O processo de deploy tem 2 comandos:

"Empacotar" o Projeto: Este comando cria a versão otimizada do seu site na pasta dist/.

Bash

npm run build
"Enviar" para o Firebase: Este comando pega a pasta dist/ e a envia para o servidor, atualizando o site online.

Bash

firebase deploy
Ao final, o terminal confirmará que o deploy foi concluído e o seu site estará atualizado!

⚙️ Configuração Única do Firebase (Para um Novo Codespace)
Se você abrir este projeto em um ambiente Codespaces novo no futuro, talvez precise fazer o login no Firebase novamente. O processo é simples:

Instale as ferramentas do Firebase no ambiente:

Bash

npm install -g firebase-tools
Faça o login (modo para ambientes de nuvem):

Bash

firebase login --no-localhost
O terminal vai gerar um link. Copie e abra no navegador.

Faça o login com sua conta Google e autorize.

O navegador vai te dar um código. Copie e cole de volta no terminal.

Depois disso, você estará pronto para rodar o comando firebase deploy novamente.
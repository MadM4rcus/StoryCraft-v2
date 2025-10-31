# StoryCraft V2 - Ficha de Personagem RPG

Bem-vindo ao repositório do StoryCraft V2! Este é um sistema de fichas de personagem de RPG dinâmico e personalizável, construído com React e Firebase.

Npm run build

firebase deploy

Next:
seguinte. 

vou fazer com que o app seja um reunidor de fichas de diversos sistemas. a idéia é pegar os componentes que são exclusivos de storycraft e separar dos outros componentes. 



Contexto: Você deve entender e aplicar as regras do sistema "Escalas de Poder" do RPG StoryCraft, com base na documentação de regras a seguir.
1. Visão Geral das Escalas de Poder
As Escalas de Poder medem a diferença de força, influência e impacto entre personagens e criaturas. Elas definem o quanto cada ser ultrapassa os limites do comum.
2. Mapeamento de Escalas (Progressão)
Para fins de cálculo de regras, as categorias de Escala são mapeadas para um "Nível de Escala" unificado (de 0 a 8), que é usado para determinar a diferença de poder. A progressão é baseada no nível do personagem:
Nível de Escala 0: Comum
Categoria: Comum
Nível Interno: 0
Nível de Personagem: 1-10 (Implícito pela progressão a cada 10 níveis)
Nível de Escala 1: Lendário 1
Categoria: Lendário
Nível Interno: 1
Nível de Personagem: 11 ao 20
Nível de Escala 2: Lendário 2
Categoria: Lendário
Nível Interno: 2
Nível de Personagem: 21 ao 30
Nível de Escala 3: Lendário 3
Categoria: Lendário
Nível Interno: 3
Nível de Personagem: 31 ao 40
Nível de Escala 4: Colossal 1
Categoria: Colossal
Nível Interno: 1
Nível de Personagem: 41 ao 45
Nível de Escala 5: Colossal 2
Categoria: Colossal
Nível Interno: 2
Nível de Personagem: 46 ao 50
Nível de Escala 6: Colossal 3
Categoria: Colossal
Nível Interno: 3
Nível de Personagem: 51 ao 55
Nível de Escala 7: Titânico 1
Categoria: Titânico
Nível Interno: 1
Nível de Personagem: 56 ao 59
Nível de Escala 8: Divino
Categoria: Divino
Nível Interno: Único
Nível de Personagem: 60
3. Mecânicas de Jogo
Todas as mecânicas são baseadas na diferença entre os "Níveis de Escala" (de 0 a 8) entre os dois seres.
3.1. Cálculo de Dano
O dano é ajustado com base na diferença de Nível de Escala.
Regra de Vantagem: Para cada Nível de Escala que um atacante tem acima do seu alvo, ele:
Causa +1/3 de dano extra.
Recebe -1/3 de dano a menos (sofre dano reduzido) daquele alvo.
Regra de Desvantagem: O atacante em escala inferior sofre a redução inversa.
Exemplos de Diferença de Dano:
1 Nível de Diferença: O ser superior causa $4/3$ do dano e recebe apenas $2/3$ do dano.
2 Níveis de Diferença: O ser superior causa $5/3$ do dano e recebe apenas $1/3$ do dano.
3 Níveis de Diferença: O ser superior causa o dobro (200%) do dano, e o ser inferior não causa nenhum dano (0%).
3.2. Bônus em ME e Resistências
A diferença de Escala também afeta a Margem de Evasão (ME) e as Resistências (Reflexos, Fortitude e Vontade).
Regra: Para cada Nível de Escala que um personagem tem acima de um oponente, ele recebe +2 em sua ME e em todas as Resistências contra ataques ou efeitos vindos desse oponente.
Penalidade: Quem está em desvantagem de Escala sofre a penalidade equivalente.
4. Descrição das Categorias
Comum (Escala 0): A escala base. Engloba humanos normais, animais e criaturas comuns.
Lendário (Escala 1-3): Heróis épicos, campeões de grandes reinos e monstros únicos.
Colossal (Escala 4-6): Dragões ancestrais, gigantes, demônios supremos e entidades de imenso poder.
Titânico (Escala 7): Entidades que ultrapassam o físico e o espiritual, como deuses caídos, avatares elementais e arquidemônios, capazes de moldar a realidade.
Divino (Escala 8): O ápice. Deuses supremos e forças cósmicas que transcendem a criação. Eles não apenas controlam as forças primordiais, eles são essas forças. Sua vontade define a realidade.



perfeito.

agora vamos fazer o seguinte: ja temos um componente de party hp manager certo? esse componente é responsavel por verificar o estado do hp e mp de certas fichas selecionadas. ele já funciona de forma esperada. 
minha ideia agora era criar um componente parecido que seria como uma especie de evento, o mestre cria esse evento. e escolhe certas fichas (npcs)  e fichas de jogadores, os donos das fichas devem ser inclusos automaticamente nesse "evento" e aí poderão interagir entre sí. atacando, curando, etec. esses ataques devem passar por todos os calculos de escala bem como algumas outras regras que vou adicionar futuramente.

----

a forma como as pericias funcionam é adicionando pericias e editando as regras manualmente, em vez disso vamos ter as pericias pré definidas.

são 30 pericias no total. vou explicar as regras como elas devem funcionar.

Acrobacia (DES) Adestramento* (CAR) Armadilhas* (INT) Atletismo (FOR) Atuação* (CAR) Cavalgar (DES) Cirurgia* (INT) Conhecimento* (INT) Cura (SAB) Diplomacia (CAR) Disfarce* (CAR) Enganação (CAR) Furtividade (DES) Guerra* (INT) Intimidação (CAR) Intuição (SAB) Investigação (INT) Jogatina* (CAR) Ladinagem* (DES) Luta (FOR) Misticismo* (INT) Nobreza* (INT) Ofício (INT) Percepção (SAB) Pilotagem* (DES) Pontaria (DES) Prestidigitação (DES) Religião* (SAB) Sedução (CAR) Sobrevivência (SAB)

as pericias com * devem continuar com essa * no nome.

a pericia é uma rolagem de d20+o atributo q está entre parenteses. esses atributos podem ser encontrados no corepanels.jsx

a cada 10 lvl todo personagem ganha 1 bonus de +1 em qualquer pericia.

as pericias precisam ter um checkbox para marcar e indicar se ela foi treinada.

ao treinar uma pericia. duas coisas acontecem. ganha-se diretamente +2 de bonus na rolagem, e a cada 5 lvls ganha +1 de bonus se a pericia for treinada.

alguns buffs e vantagens podem conceder bonus de pericia também então precisamos de um campo para digitar esse bonus.

então em resumo o calculo da pericia é: D20 + atributo + bonus por 10 lvl + bonus de treinamento (2 +1 a cada 5 lvl) + bonus variavel de vantagens.

preciso que crie essa lógica. e que cada pericia tenha um icone de um dadinho para clicar e rolar. essa rolagem deve aparecer no discord e no feed de rolagem dentro do aplicativo, outros arquivos voce pode encontrar dentro da pasta SRC que está no seu contexto.

edite o componente specializations.jsx para fazer as alteraçoes.

Também quero desativar o componente attributessection.jsx para usar apenas os atributos descritos no corepanels.jsx
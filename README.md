# StoryCraft V2 - Ficha de Personagem RPG

Bem-vindo ao repositório do StoryCraft V2! Este é um sistema de fichas de personagem de RPG dinâmico e personalizável, construído com React e Firebase.

Npm run build

firebase deploy

Next:

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

----------------------

quero dar uma refatorada nas açoes rápidas. vou te explicar oq quero fazer. num faça nada, apenas entenda como funciona tudo, se quiser ver mais algum arquivo me peça q eu mando.

eu quero alterar a forma que as açoes calculam dano.

antigamente tinha-mos o dado critico. que era um d6 que podia critar e se critasse eu definiria os critérios para tal. agora usamos outro método.

parecido com o tormenta 20, onde o usuario rola uma perícia e é a rolagem da perícia contra a Margem de evasão do alvo.

a rolagem de pericia não causa dano, mas ela pode critar. quero que permaneça a lógica onde o usuario define o valor minimo para poder critar pois ainda tem vantagens que reduzem o valor do critico no dado.

e quero que eu possa escrever a formula do que deve acontecer ao critar. por exemplo: adicionar 1d8 ao dano, ou adicionar o valor fixo 8, ou adicionar o valor de algum atributo meu. ou multiplicar a rolagem toda. ou multiplicar o numero apenas dos dados.  a interface deve continuar sendo flexivel como sempre foi, mas agora estamos trabalhando um pouco diferente.

nesse momento eu preciso apenas que a rolagem saia de forma automatica, no chat.

1 click na ação vai rolar automaticamente a pericia e rolar o dano.

sobre essa rolagem de pericia. como pode ver já temos uma lista de 30 perícias, essas pericias ja tem seus bonus. e formulas e calculos.

então minha ideia de interface para essa rolagem de acerto seria algo tipo:

eu seleciono a pericia que deve ser rolada, eu digito o valor minimo para ser considerado crítico (19, 18, 17 etec...) se O DADO da pericia atingir esse valor então será considerado um critico, e aí deve se aplicar os bonus que eu definir. os bonus da pericia não contam para o crítico, mas contam para o total do acerto.

capixe?
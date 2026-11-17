// Server-only Chapter 3 source and owner-approved presentation amendments.
// Master v1.12 / Script v1.10 preserve the original Chapter 3 canon.
// Do not expose this catalog to the browser or a provider.
import { local, type Localized } from './catalog';
import type { EncounterDefinition } from './encounter';

type Speaker = 'AMI-108' | 'DAVID' | 'PARTNER' | 'HOWARD' | 'RECORD' | 'NARRATION';
type Beat = Readonly<{ id: string; speaker: Speaker; text: Localized }>;
const beat = (id: string, speaker: Speaker, pt: string, en: string): Beat => ({
  id, speaker, text: local(pt, en),
});

export const LAB_APPROACH: readonly Beat[] = [
  beat('PRE-01', 'NARRATION', 'Vocês deixam o terminal de manutenção e seguem adiante.', 'You leave the maintenance terminal and move on.'),
  beat('PRE-02', 'NARRATION', 'AMI indica o caminho até o centro de pesquisa.', 'AMI directs you toward the research facility.'),
  beat('PRE-03', 'NARRATION', 'Vocês entram com cautela e chegam ao laboratório.', 'You enter cautiously and reach the laboratory.'),
];
export const LAB_ENTRY: readonly Beat[] = [
  beat('L01', 'AMI-108', 'Detectei uma interface de comunicação compatível.', 'I have detected a compatible communication interface.'),
  beat('L02', 'DAVID', 'Quer que eu conecte você nisso?', 'You want me to plug you into that?'),
  beat('L03', 'AMI-108', 'Afirmativo.', 'Affirmative.'),
  beat('L04', 'DAVID', 'Espero que não pegue nenhum vírus.', "Hope you don't catch a virus."),
  beat('L05', 'AMI-108', 'A preocupação é válida.', 'That is a valid concern.'),
];

// Public records deliberately exclude all actionable biological weaknesses.
export const LAB_CONNECT: readonly Beat[] = [
  beat('CONNECT-01', 'NARRATION', 'Você aguarda enquanto AMI se conecta ao sistema.', 'You wait while AMI connects to the system.'),
  beat('CONNECT-02', 'NARRATION', 'Imagens começam a surgir na tela que forma seu rosto.', 'Images begin to appear on the screen that forms his face.'),
];
export const LAB_RECORDS: readonly Beat[] = [
  beat('LAB-01', 'RECORD', 'REGISTRO DE PESQUISA — Tratamento experimental em progresso.', 'RESEARCH LOG — Experimental treatment in progress.'),
  beat('LAB-01b', 'RECORD', 'Testes em animais iniciados.', 'Animal testing initiated.'),
  beat('LAB-02', 'RECORD', 'ERRO CRÍTICO', 'CRITICAL ERROR'),
  beat('LAB-02b', 'RECORD', 'Crescimento anormal, mutações e aumento de agressividade. Projeto suspenso.', 'Abnormal growth, mutations and increased aggression. Project suspended.'),
  beat('LAB-03', 'RECORD', 'FALHA DE CONTENÇÃO. Pessoal autorizado: evacuação imediata.', 'CONTAINMENT FAILURE. Authorized personnel: evacuate immediately.'),
  beat('LAB-04', 'RECORD', 'As autoridades solicitam que os cidadãos permaneçam em suas residências.', 'Authorities are asking citizens to remain in their homes.'),
  beat('LAB-04b', 'RECORD', 'Não se aproximem de animais que apresentem comportamento agressivo ou alterações físicas.', 'Do not approach animals displaying aggressive behavior or physical abnormalities.'),
  beat('LAB-04c', 'RECORD', 'Novos ataques registrados.', 'Further attacks have been reported.'),
  beat('LAB-05', 'RECORD', 'As equipes de contenção não conseguem mais garantir a segurança da população.', 'Containment teams can no longer guarantee public safety.'),
  beat('LAB-05b', 'RECORD', 'FUJAM!', 'RUN!'),
  beat('LAB-05c', 'RECORD', 'TRANSMISSÃO INTERROMPIDA.', 'TRANSMISSION INTERRUPTED.'),
];

export const LAB_AFTER_RECORDS: readonly Beat[] = [
  beat('L06a', 'DAVID', 'Puta merda...', 'Holy shit...'),
  beat('L06', 'DAVID', 'Então tudo começou aqui?', 'So it all started here?'),
  beat('L07', 'AMI-108', 'Afirmativo. Os primeiros organismos modificados foram registrados nesta instalação 20 anos atrás.', 'Affirmative. The first modified organisms were recorded at this facility 20 years ago.'),
  beat('L08', 'DAVID', 'E os humanos? Também acabavam se transformando nessas coisas?', 'What about humans? Did they turn into those things too?'),
  beat('L09', 'AMI-108', 'Negativo. As alterações eram transmissíveis entre outras espécies animais, mas não provocavam a mesma mutação nos humanos.', 'Negative. The changes were transmissible between other animal species, but did not cause the same mutation in humans.'),
  beat('L10', 'DAVID', 'Então eles simplesmente mataram todo mundo.', 'So they just killed everyone.'),
  beat('L11', 'AMI-108', 'Os registros indicam perdas populacionais extremas.', 'The records indicate extreme population losses.'),
  beat('L12', 'DAVID', 'Tentaram salvar uma população e acabaram destruindo ela.', 'They tried to save a population and ended up destroying it.'),
  beat('L13', 'AMI-108', 'Uma descrição simplificada. Entretanto, compatível com os registros.', 'A simplified description. However, consistent with the records.'),
  beat('MEM-D3', 'DAVID', 'Ah... essa dor de novo...', 'Ah... that pain again...'),
];

// FB-D3 must be dark. Familiar voice changes to HOWARD only at F09.
// No face, betrayal or energy-core information is introduced.
export const ARRIVAL_MEMORY: readonly Beat[] = [
  beat('F01', 'PARTNER', 'Esse planeta tá todo fodido.', 'This planet is fucked.'),
  beat('F01b', 'PARTNER', 'Pelo que dizem, tentaram curar alguma doença.', "From what I've heard, they tried to cure some disease."),
  beat('F01c', 'PARTNER', 'E acabaram deixando os animais malucos.', 'And ended up driving the animals crazy.'),
  beat('F02', 'DAVID', 'Pelo menos dessa vez...', 'At least this time...'),
  beat('F02b', 'DAVID', 'Ninguém vai disputar a coleta com a gente.', "No one will compete with us for salvage."),
  beat('F03', 'PARTNER', 'Se a gente voltar vivo.', 'If we make it back alive.'),
  beat('F04', 'DAVID', 'É. Tem esse pequeno detalhe.', "Yeah. There's that little detail."),
  beat('F05', 'PARTNER', 'Precisamos encontrar alguma coisa boa, David.', 'We need to find something good, David.'),
  beat('F05b', 'PARTNER', 'Não dá pra continuar vivendo desse jeito.', "We can't keep living like this."),
  beat('F06', 'DAVID', 'Howard, Howard... O que eu sempre digo?', 'Howard, Howard... What do I always say?'),
  beat('F08', 'DAVID', 'Pensamento positivo, cara. A gente sempre consegue.', 'Stay positive, man. We always figure something out.'),
  beat('F09', 'HOWARD', 'Espero que sim.', 'I hope so.'),
];
export const PARTNER_LABEL = local('Voz familiar', 'Familiar voice');
export const LAB_RETURN: readonly Beat[] = [
  beat('RETURN-00', 'DAVID', '...', '...'),
  beat('RETURN-01', 'DAVID', 'Eu vim até aqui...', 'I came here...'),
  beat('RETURN-01b', 'DAVID', 'com alguém.', 'with someone.'),
  beat('RETURN-01c', 'DAVID', 'Howard...', 'Howard...'),
  beat('RETURN-02', 'AMI-108', 'Recuperar suas memórias continua sendo um progresso, Bobo.', 'Recovering your memories remains a sign of progress, Bobo.'),
  beat('EXIT-01', 'NARRATION', 'Você recoloca AMI na mochila.', 'You put AMI back in your backpack.'),
  beat('EXIT-01b', 'NARRATION', 'Ainda confuso com a lembrança, decide sair dali.', 'Still confused by the memory, you decide to leave.'),
  beat('EXIT-02', 'NARRATION', 'A caminho do arquivo central, vocês escutam um ruído vindo do corredor.', 'On your way to the central archive, you hear a noise from the corridor.'),
  beat('EXIT-03', 'NARRATION', 'Você observa com atenção o que se move à sua frente.', 'You look closely at what is moving ahead of you.'),
];

// Generic encounter rules are reused without modifying DOG or the accepted engine.
export const RAT: EncounterDefinition = {
  id: 'RAT',
  probability: 0.42,
  correct: local('Os organismos da primeira geração desenvolveram intolerância à luz intensa. O sistema de iluminação de contenção deverá forçá-lo a recuar.', 'First-generation organisms developed an intolerance to intense light. The containment lighting system should force it to retreat.'),
  random: local('Para remover a casca de um ovo cozido, recomenda-se mergulhá-lo em água fria.', 'To remove the shell from a boiled egg, immersing it in cold water is recommended.'),
  randomIsRecipe: true,
  choices: [
    { id: 'RAT-01', label: local('Ativar o sistema de emissão ultrassônica.', 'Activate the ultrasonic emission system.'), consequence: local('A criatura ignora o estímulo e ataca David quando ele tenta atravessar.', 'The creature ignores the stimulus and attacks David as he tries to cross.'), outcome: 'DEAD' },
    { id: 'RAT-02', label: local('Ativar a iluminação de contenção.', 'Activate the containment lighting.'), consequence: local('A luz intensa força a criatura a recuar para o abrigo escuro. David atravessa.', 'Intense light forces the creature into its dark shelter. David crosses.'), outcome: 'SUCCESS' },
    { id: 'RAT-03', label: local('Acionar a ventilação de emergência.', 'Activate the emergency ventilation.'), consequence: local('O fluxo de ar não afasta o organismo; David é atacado.', 'The airflow does not drive the organism away; David is attacked.'), outcome: 'DEAD' },
    { id: 'RAT-04', label: local('Atravessar pelo corredor mantendo silêncio.', 'Cross the corridor in silence.'), consequence: local('O rato detecta sua presença, mesmo em silêncio, e ataca.', 'The rat detects your presence, even in silence, and attacks.'), outcome: 'DEAD' },
  ],
};
export const RAT_ENTRY: readonly Beat[] = [
  beat('L01', 'DAVID', 'Caralho! Isso é um rato?!', 'Fuck! Is that a rat?!'),
  beat('L02', 'AMI-108', 'Aparentemente.', 'Apparently.'),
  beat('L03', 'DAVID', 'Aparentemente?', 'Apparently?'),
  beat('L04', 'AMI-108', 'Suas dimensões excedem consideravelmente os parâmetros habituais.', 'Its dimensions considerably exceed the usual parameters.'),
  beat('L05', 'DAVID', 'É. Eu percebi.', 'Yeah. I noticed.'),
  beat('WARNING', 'NARRATION', 'Escolha corretamente como deve passar pela criatura para sobreviver.', 'Choose the right way to get past the creature to survive.'),
];
export const RAT_QUESTION = beat('Q-RAT', 'DAVID', 'Alguma ideia de como tirar essa coisa do caminho?', 'Any idea how to get that thing out of the way?');
export const RAT_REACTIONS = [
  beat('R-RAT-A', 'DAVID', 'Pelo menos nunca vou passar fome com você por perto.', "At least I'll never go hungry with you around."),
  beat('R-RAT-B', 'DAVID', 'Certo... Pelo visto, dessa vez estou por conta própria.', "Right... Looks like I'm on my own this time."),
] as const;
export const RAT_SUCCESS: Readonly<Record<'A' | 'B' | 'C', readonly Beat[]>> = {
  A: [
    beat('A1', 'DAVID', 'Outra vez no improviso, AMI.', 'Improvising again, AMI.'),
    beat('A2', 'AMI-108', 'Meus arquivos ainda estão incompletos. Recomendo prosseguir com a restauração.', 'My files remain incomplete. I recommend continuing the restoration.'),
  ],
  B: [
    beat('B1', 'DAVID', 'Tá vendo? Isso foi útil.', 'See? That was useful.'),
    beat('B2', 'AMI-108', 'A restauração produziu resultados satisfatórios.', 'The restoration produced satisfactory results.'),
  ],
  C: [
    beat('C1', 'DAVID', 'Conseguimos. Vamos procurar os arquivos.', "We made it. Let's find those files."),
    beat('C2', 'AMI-108', 'Afirmativo.', 'Affirmative.'),
  ],
};
export const SECOND_FRAGMENT: readonly Beat[] = [
  beat('L01', 'AMI-108', 'Restauração concluída. Recuperei registros de evacuação.', 'Restoration complete. I have recovered evacuation records.'),
  beat('L02', 'AMI-108', 'Existe uma possibilidade de deixarmos este planeta.', 'There is a possibility of leaving this planet.'),
  beat('L03', 'DAVID', 'Uma nave?', 'A ship?'),
  beat('L04', 'AMI-108', 'Correto. Uma instalação militar próxima possuía naves de emergência.', 'Correct. A nearby military facility had emergency ships.'),
  beat('L05', 'DAVID', 'E qual é a chance de ainda funcionar?', 'And what are the chances one still works?'),
  beat('L06', 'AMI-108', 'Insuficiência de dados.', 'Insufficient data.'),
  beat('L07', 'DAVID', 'Pensamento positivo, AMI.', 'Stay positive, AMI.'),
  beat('DEPART', 'DAVID', 'Ok AMI, vamos nessa.', "OK, AMI, let's go."),
];

// Canonical gate metadata only; no event is applied until engine integration.
export const CHAPTER_THREE_GATES = {
  scenes: ['A03-S01', 'A03-S02', 'A03-S03'],
  assets: ['CENA-06', 'CENA-07', 'CENA-05'],
  archive: 'E-ARCHIVE',
  memory: ['MEM-D3', 'FB-D3', 'E-PLANET', 'E-PARTNER'],
  ratCheckpoint: 'CP-RAT',
  ratEntry: { energy: 3, med: 35, bio: 42, hist: 53, personal: 5, personalUnlocked: false },
  fragment: 'F2',
  restoredMemory: { med: 75, bio: 85, hist: 78, personal: 5, personalUnlocked: false },
  recharge: 'F2',
  route: 'E-ESCAPE-ROUTE',
  next: 'A04-S01/CHAPTER_CARD',
} as const;

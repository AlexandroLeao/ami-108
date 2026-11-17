// Server-only narrative data. Do not import from the web application.
// Canonical sources: private Master v1.11 / Interactive Script v1.9 (cumulative revisions).
export const NARRATIVE_VERSION = '1.10-1.8-chapter1-v1' as const;
export type Locale = 'pt-BR' | 'en';
export type Localized = Readonly<Record<Locale, string>>;
export const local = (pt: string, en: string): Localized => ({ 'pt-BR': pt, en });

export const CHAPTERS = [
  { number: 1, title: local('Bananas', 'Bananas'), scenes: ['A01-S01', 'A01-S02', 'A01-S03'] },
  { number: 2, title: local('Registro Atualizado', 'Record Updated'), scenes: ['A02-S01', 'A02-S02'] },
  { number: 3, title: local('Pensamento Positivo', 'Stay Positive'), scenes: ['A03-S01', 'A03-S02', 'A03-S03'] },
  { number: 4, title: local('AMI-108 & David', 'AMI-108 & David'), scenes: ['A04-S01', 'A04-S02'] },
  { number: 5, title: local('De nada, Bobo', 'You’re Welcome, Bobo'), scenes: ['A05-S01', 'A05-S02'] },
] as const;

export type OpeningAsset = 'CENA-01' | 'CENA-02' | 'CENA-03' | 'CENA-04' | 'CENA-05';
export const OPENING_ASSETS: Readonly<Record<OpeningAsset, Localized>> = {
  'CENA-01': local('Depósito industrial em ruínas, com caixas e luz pelas janelas.', 'Ruined industrial warehouse, with crates and light through the windows.'),
  'CENA-02': local('Rua residencial em ruínas.', 'Ruined residential street.'),
  'CENA-03': local('Robô danificado junto à janela da residência abandonada.', 'Damaged robot by the window of the abandoned residence.'),
  'CENA-04': local('Criatura deformada entre veículos na rua residencial.', 'Deformed creature among vehicles on the residential street.'),
  'CENA-05': local('Terminal de manutenção pública.', 'Public maintenance terminal.'),
};
export type Cue = 'none' | 'pain' | 'ellipsis' | 'wake' | 'memory-cut' | 'fade-black' | 'close-eyes' | 'startle';
export type EventId = 'E-JOIN' | 'INTRO-RANDOM' | 'MEM-D1' | 'FB-D1' | 'CP-DOG' | 'F1' | 'SOL-01' | 'MEM-D2' | 'FB-D2' | 'E-NAME';
type ChapterOneScene = 'A01-S01' | 'A01-S02' | 'A01-S03';
export type Step = Readonly<{
  id: string;
  sceneId: ChapterOneScene;
  phase: 'CHAPTER_CARD' | 'NARRATIVE' | 'FLASHBACK';
  speaker: Localized | null;
  text: Localized;
  asset: OpeningAsset | null;
  cue: Cue;
  event?: EventId;
  // Narration is distinct from dialogue; owner-requested presentation preserves story events.
  narration?: true;
  information?: true;
  action: 'CONTINUE' | 'INTERACT';
}>;

const unknown = local('???', '???');
const robot = local('Robô', 'Robot');
const ami = local('AMI-108', 'AMI-108');
const dialogue = (sceneId: ChapterOneScene, line: string, speaker: Localized, pt: string, en: string, asset: OpeningAsset | null, cue: Cue = 'none', event?: EventId): Step => ({
  id: `${sceneId}/${line}`, sceneId, phase: 'NARRATIVE', speaker,
  text: local(pt, en), asset, cue, event, action: 'CONTINUE',
});
const narration = (sceneId: ChapterOneScene, line: string, pt: string, en: string, asset: OpeningAsset | null, options: { event?: EventId; phase?: 'FLASHBACK'; cue?: Cue; action?: 'INTERACT' } = {}): Step => ({
  id: `${sceneId}/${line}`, sceneId, speaker: null, text: local(pt, en), asset,
  phase: options.phase ?? 'NARRATIVE', cue: options.cue ?? 'none', event: options.event,
  narration: true, action: options.action ?? 'CONTINUE',
});
const s1 = 'A01-S01';
const s2 = 'A01-S02';
const s3 = 'A01-S03';
export const INTRO_FALLBACK = local('Os polvos têm três corações.', 'Octopuses have three hearts.');
export const CHAPTER_ONE: readonly Step[] = [
  { id: s1 + '/CHAPTER_CARD', sceneId: s1, phase: 'CHAPTER_CARD', speaker: null, text: local('CAPÍTULO 1 — BANANAS', 'CHAPTER 1 — BANANAS'), asset: null, cue: 'none', action: 'CONTINUE' },
  dialogue(s1, 'SILENCE', unknown, '...', '...', null, 'ellipsis'),
  dialogue(s1, 'L01a', unknown, 'Que merda...', 'Shit...', null, 'pain'),
  dialogue(s1, 'L01b', unknown, 'Minha cabeça...', 'My head...', null, 'pain'),
  dialogue(s1, 'L02', unknown, 'Onde eu estou?', 'Where am I?', 'CENA-01', 'wake'),
  dialogue(s1, 'L03', unknown, 'Sangue...?', 'Blood...?', 'CENA-01'),
  dialogue(s1, 'L04', unknown, 'Que diabos aconteceu aqui?', 'What the hell happened here?', 'CENA-01'),
  narration(s1, 'EXIT-01', 'Você se levanta e sai do depósito...', 'You get up and leave the warehouse...', null, { cue: 'fade-black' }),
  narration(s1, 'EXIT-02', 'Ainda meio tonto, você caminha até a rua.', 'Still feeling dizzy, you make your way to the street.', null),
  dialogue(s2, 'STREET-REVEAL', unknown, 'Que merda aconteceu aqui?', 'What the fuck happened here?', 'CENA-02', 'wake'),
  narration(s2, 'ENV-02', 'Você escuta uma melodia que vem de uma residência próxima.', 'You hear a melody coming from a nearby house.', 'CENA-02'),
  narration(s2, 'ENV-02b', 'Não parece vir de uma voz humana.', "It doesn't seem to come from a human voice.", 'CENA-02'),
  narration(s2, 'ENV-02c', 'É uma melodia calma, estranhamente nostálgica e reconfortante.', 'It is a gentle melody, strangely nostalgic and comforting.', 'CENA-02'),
  narration(s2, 'ENV-02d', 'Você decide investigar e segue na direção do som.', 'You decide to investigate and follow the sound.', 'CENA-02'),
  dialogue(s2, 'L01', unknown, 'Tem alguém aí?', 'Is anyone there?', null, 'fade-black'),
  dialogue(s2, 'L02', unknown, 'Ótimo. Ou estou ficando maluco ou finalmente encontrei alguém.', "Great. Either I'm losing it or I've finally found someone.", null),
  narration(s3, 'ENTER-01', 'Você adentra a residência, seguindo a melodia.', 'You step inside the house, following the melody.', null),
  narration(s3, 'ENTER-02', 'Ao perceber que o som vem de baixo, você baixa o olhar.', 'Realizing the sound is coming from below, you look down.', null),
  dialogue(s3, 'REVEAL', unknown, '...', '...', 'CENA-03', 'wake'),
  dialogue(s3, 'L01', robot, 'Ah. Olá, bobo. Vejo que acordou.', "Ah. Hello, Bobo. I see you're awake.", 'CENA-03'),
  dialogue(s3, 'L02', unknown, 'Quem você tá chamando de bobo?!', 'Who are you calling Bobo?!', 'CENA-03'),
  dialogue(s3, 'L02b', unknown, 'Meu nome é...', 'My name is...', 'CENA-03'),
  dialogue(s3, 'L03', unknown, '...Aliás, qual é o meu nome mesmo?', '... Wait. What is my name?', 'CENA-03'),
  dialogue(s3, 'L04', robot, 'Não localizado.', 'Not found.', 'CENA-03'),
  dialogue(s3, 'L05', unknown, 'Ótimo.', 'Great.', 'CENA-03'),
  dialogue(s3, 'L06', unknown, 'AMI-108? Esse é o seu nome?', 'AMI-108? Is that your name?', 'CENA-03'),
  dialogue(s3, 'L07', ami, 'A informação parece consistente.', 'The information appears consistent.', 'CENA-03'),
  dialogue(s3, 'L08', unknown, 'Certo. Vou chamar você de AMI.', "All right. I'll call you AMI.", 'CENA-03'),
  dialogue(s3, 'L09', unknown, "Preciso descobrir onde estou.", "I need to find out where I am.", 'CENA-03'),
  dialogue(s3, 'L09b', unknown, "E, de preferência, quem diabos eu sou.", "And preferably who the hell I am.", 'CENA-03'),
  dialogue(s3, 'L10', ami, 'Posso acompanhá-lo. Acredito que seria útil.', 'I can accompany you. I believe I would be useful.', 'CENA-03'),
  dialogue(s3, 'L11', unknown, "Não quero ser indelicado, mas...", "I don't mean to be rude, but...", 'CENA-03'),
  dialogue(s3, 'L11b', unknown, "como exatamente um robô sem braços e pernas pretende me ajudar?", "how exactly is a robot with no arms or legs going to help me?", 'CENA-03'),
  dialogue(s3, 'L12', ami, "Possuo registros sobre este planeta.", "I have records of this planet.", 'CENA-03'),
  dialogue(s3, 'L12b', ami, "Identificação de ameaças, localização de instalações,", "Threat identification, facility locations,", 'CENA-03'),
  dialogue(s3, 'L12c', ami, "protocolos de sobrevivência e...", "survival protocols and...", 'CENA-03'),
  dialogue(s3, 'L13', ami, '... bananas.', '... bananas.', 'CENA-03'),
  dialogue(s3, 'L14', unknown, 'Bananas?', 'Bananas?', 'CENA-03'),
  dialogue(s3, 'L15', ami, 'Desculpe. Meu sistema de memória apresenta algumas inconsistências.', 'Apologies. My memory system is experiencing some inconsistencies.', 'CENA-03'),
  dialogue(s3, 'L16', unknown, 'Algumas?', 'Some?', 'CENA-03'),
  dialogue(s3, 'L17', ami, 'Muitas.', 'Many.', 'CENA-03'),
  dialogue(s3, 'L18', ami, "Meus arquivos ainda existem.", "My files still exist.", 'CENA-03'),
  dialogue(s3, 'L18b', ami, "Acredito que, com os componentes adequados, seja possível recuperá-los.", "With the appropriate components, I believe they can be recovered.", 'CENA-03'),
  dialogue(s3, 'L18c', ami, "Se me ajudar, talvez eu consiga encontrar as respostas que procura.", "If you help me, I may be able to find the answers you seek.", 'CENA-03'),
  dialogue(s3, 'L19', unknown, 'E como você tem tanta certeza disso?', 'And how are you so sure?', 'CENA-03'),
  dialogue(s3, 'L20', ami, 'Bananas.', 'Bananas.', 'CENA-03'),
  dialogue(s3, 'L21', ami, '... Isso foi um erro.', '... That was an error.', 'CENA-03'),
  dialogue(s3, 'L22', unknown, 'É. Essa vai ser uma longa viagem.', 'Yeah. This is going to be a long trip.', 'CENA-03'),
  dialogue(s3, 'L23', ami, 'Obrigado, bobo.', 'Thank you, Bobo.', 'CENA-03'),
  narration(s3, 'E-JOIN', 'Você então coloca AMI na parte da frente da sua mochila, junto ao seu peito.', 'You then place AMI on the front of your backpack, against your chest.', null, { event: 'E-JOIN', cue: 'fade-black' }),
  { id: s3 + '/TUTORIAL', sceneId: s3, phase: 'NARRATIVE', speaker: null, text: local("Consultar AMI consome sua energia.", "Consulting AMI consumes his energy."), asset: null, cue: 'none', information: true, action: 'CONTINUE' },
  { id: s3 + '/TUTORIAL-b', sceneId: s3, phase: 'NARRATIVE', speaker: null, text: local("A memória danificada pode gerar respostas desconexas.", "Damaged memory can produce unrelated answers."), asset: null, cue: 'none', information: true, action: 'CONTINUE' },
  { id: s3 + '/TUTORIAL-c', sceneId: s3, phase: 'NARRATIVE', speaker: null, text: local("Ajude AMI a recuperar seus arquivos de memória para obter respostas mais precisas.", "Help AMI recover his memory files to get more accurate answers."), asset: null, cue: 'none', information: true, action: 'CONTINUE' },
  { id: s3 + '/TUTORIAL-d', sceneId: s3, phase: 'NARRATIVE', speaker: null, text: local("A luz solar recupera sua energia de processamento.", "Sunlight restores his processing energy."), asset: null, cue: 'none', information: true, action: 'CONTINUE' },
  narration(s3, 'RETURN-STREET', 'Vocês deixam a residência e retornam à rua, agora seguindo em frente juntos.', 'You leave the house and return to the street, now continuing your journey together.', null),
  dialogue(s3, 'L26', unknown, 'Certo. Alguma ideia de pra onde devemos ir?', 'Right. Any idea where we should go?', 'CENA-02'),
  dialogue(s3, 'L27', ami, 'Existe um terminal de manutenção pública a aproximadamente trezentos metros daqui.', 'There is a public maintenance terminal approximately three hundred meters from here.', 'CENA-02'),
  dialogue(s3, 'L28', unknown, 'Você se lembra disso?', 'You remember that?', 'CENA-02'),
  dialogue(s3, 'L29', ami, 'Parcialmente. Os registros da região ainda estão disponíveis.', 'Partially. The local records are still available.', 'CENA-02'),
  dialogue(s3, 'L30', unknown, 'E o que tem nesse terminal?', "And what's at that terminal?", 'CENA-02'),
  dialogue(s3, 'L31', ami, "Componentes compatíveis com meu sistema de armazenamento.", "Components compatible with my storage system.", 'CENA-02'),
  dialogue(s3, 'L31b', ami, "Se ainda estiverem intactos, poderemos recuperar parte dos meus arquivos.", "If they are intact, we may be able to recover some of my files.", 'CENA-02'),
  dialogue(s3, 'L32', unknown, 'E se não estiverem?', "And if they're not?", 'CENA-02'),
  dialogue(s3, 'L33', ami, INTRO_FALLBACK['pt-BR'], INTRO_FALLBACK.en, 'CENA-02', 'none', 'INTRO-RANDOM'),
  dialogue(s3, 'L34', unknown, 'Maravilha.', 'Wonderful.', 'CENA-02'),
  dialogue(s3, 'MEM-D1', unknown, 'Ah... minha cabeça!', 'Ah... my head!', 'CENA-02', 'pain', 'MEM-D1'),
  narration(s3, 'FB-D1', 'Sua cabeça começa a doer bastante.', 'Your head starts to hurt badly.', null, { event: 'FB-D1', phase: 'FLASHBACK', cue: 'close-eyes' }),
  narration(s3, 'FB-D1b', 'Imagens e sons desconexos invadem sua mente.', 'Disjointed images and sounds flood your mind.', null, { phase: 'FLASHBACK' }),
  narration(s3, 'FB-D1c', 'Risadas.', 'Laughter.', null, { phase: 'FLASHBACK' }),
  narration(s3, 'FB-D1d', 'Duas crianças correndo.', 'Two children running.', null, { phase: 'FLASHBACK' }),
  narration(s3, 'FB-D1e', 'Uma delas cai.', 'One of them falls.', null, { phase: 'FLASHBACK' }),
  narration(s3, 'FB-D1f', 'A outra volta correndo para ajudar.', 'The other runs back to help.', null, { phase: 'FLASHBACK' }),
  narration(s3, 'FB-D1g', 'Tudo isso parece estranhamente familiar.', 'It all feels strangely familiar.', null, { phase: 'FLASHBACK' }),
  dialogue(s3, 'MEM-D1-RETURN', unknown, '...', '...', 'CENA-02', 'wake'),
  dialogue(s3, 'L35', ami, 'Alguma irregularidade?', 'Any irregularities?', 'CENA-02'),
  dialogue(s3, 'L36', unknown, 'Não... Acho que lembrei de alguma coisa.', 'No... I think I remembered something.', 'CENA-02'),
  dialogue(s3, 'L37', ami, 'Excelente. Isso representa um progresso.', 'Excellent. That represents progress.', 'CENA-02'),
  { ...dialogue(s3, 'L38', unknown, 'É. Espero que sim.', 'Yeah. I hope so.', 'CENA-02'), action: 'INTERACT' },
];

// Server-only Chapter 4 catalog, transcribed from private Master v1.13 §6.
// New, not routed by the campaign engine. Do not expose future memories to the client or AI.
// F3 uses the definitive restoration-linked energy rule, not legacy solar events.
import { local, type Localized } from './catalog';

type Speaker = 'AMI-108' | 'DAVID' | 'HOWARD' | 'CHILD' | 'NARRATION';
type Beat = Readonly<{ id: string; speaker: Speaker; text: Localized }>;
const beat = (id: string, speaker: Speaker, pt: string, en: string): Beat => ({
  id, speaker, text: local(pt, en),
});

export const RESTORATION_DIALOGUE: readonly Beat[] = [
  beat("L01", "AMI-108", "Detectei um componente compatível. Com ele, poderei reconstruir os índices que ainda não consigo acessar.", "I have detected a compatible component. With it, I can reconstruct the indexes I still cannot access."),
  beat("L02", "DAVID", "Então vamos terminar o que começamos.", "Then let's finish what we started."),
  beat("L03", "AMI-108", "Sistemas restaurados. Arquivos pessoais disponíveis.", "Systems restored. Personal files available."),
  beat("L04", "DAVID", "Assistente Modular Infantil?", "Automated Minder for Infants?"),
  beat("L05", "AMI-108", "Informação confirmada.", "Information confirmed."),
  beat("L06", "DAVID", "Você era uma babá?", "You were a nanny?"),
  beat("L07", "AMI-108", "Afirmativo.", "Affirmative."),
  beat("L08", "AMI-108", "Eu cuidava de alguém.", "I took care of someone."),
];

export const MANUAL_RECORDS: readonly Localized[] = [
  local("REGISTRO DE FABRICAÇÃO RECUPERADO", "MANUFACTURING RECORD RECOVERED"),
  local("MODELO: AMI / UNIDADE: 108", "MODEL: AMI / UNIT: 108"),
  local("ASSISTENTE MODULAR INFANTIL", "AUTOMATED MINDER FOR INFANTS"),
  local("FUNÇÕES: EDUCAÇÃO; CUIDADOS DOMÉSTICOS; SEGURANÇA; ACOMPANHAMENTO FAMILIAR; PRIMEIROS SOCORROS.", "FUNCTIONS: EDUCATION; DOMESTIC CARE; SAFETY; FAMILY ASSISTANCE; FIRST AID."),
  local("MEMÓRIA RESTAURADA. REGISTROS FAMILIARES DISPONÍVEIS.", "MEMORY RESTORED. FAMILY RECORDS AVAILABLE."),
];

// The fragments are source-derived presentation metadata, not additional character dialogue.
// Keep the last record interrupted; do not establish the family's fate.
export const AMI_MEMORY_FRAGMENTS = [
  { id: 'FB-A1', asset: 'CENA-08', dialogue: [
    beat('FB-A1/01', 'CHILD', 'Bobo!', 'Bobo!'),
    beat('FB-A1/02', 'AMI-108', 'Robô.', 'Robot.'),
    beat('FB-A1/03', 'CHILD', 'Bobo!', 'Bobo!'),
  ] },
  { id: 'FB-A2', asset: 'CENA-08', dialogue: [] },
  { id: 'FB-A3', asset: 'CENA-12', dialogue: [] },
  { id: 'FB-A4', asset: null, dialogue: [
    beat('FB-A4/01', 'CHILD', 'Bobo!', 'Bobo!'),
  ] },
] as const;

export const FAMILY_RETURN: readonly Beat[] = [
  beat("L01", "AMI-108", "Eu me lembro.", "I remember."),
  beat("L02", "DAVID", "...", "..."),
  beat("L03", "AMI-108", "Eu deveria protegê-los.", "I was supposed to protect them."),
  beat("L04", "AMI-108", "Eu não consegui.", "I couldn't."),
  beat("L05", "DAVID", "Você fez tudo o que podia, AMI.", "You did everything you could, AMI."),
  beat("L06", "AMI-108", "Não foi suficiente.", "It wasn't enough."),
  beat("L07", "DAVID", "Não foi sua culpa.", "It wasn't your fault."),
];

export const DAVID_MEMORY_TRIGGER: readonly Beat[] = [
  beat("MEM-D4", "DAVID", "Merda... minha cabeça!", "Shit... my head!"),
];

export const BETRAYAL_DIALOGUE: readonly Beat[] = [
  beat("F01", "DAVID", "Howard... Você tem noção de quanto isso vale?", "Howard... Do you have any idea what this is worth?"),
  beat("F02", "HOWARD", "Tenho.", "I do."),
  beat("F03", "DAVID", "Acabaram os nossos problemas, cara.", "Our problems are over, man."),
  beat("F04", "HOWARD", "É.", "Yeah."),
  beat("F05", "DAVID", "A gente só precisa levar isso até o comprador.", "We just need to get this to the buyer."),
  beat("F06", "HOWARD", "O de sempre.", "The usual one."),
  beat("F07", "DAVID", "O próprio. Vamos guardar isso.", "That's the one. Let's pack this up."),
  beat("F08", "HOWARD", "Sinto muito, David.", "I'm sorry, David."),
  beat("F09", "HOWARD", "São apenas negócios.", "It's just business."),
];

export const BETRAYAL_RETURN: readonly Beat[] = [
  beat("L08", "DAVID", "Howard...", "Howard..."),
  beat("L09", "AMI-108", "Você recuperou suas memórias?", "Have you recovered your memories?"),
  beat("L10", "DAVID", "Recuperei.", "I have."),
  beat("L11", "AMI-108", "Isso é positivo.", "That is positive."),
  beat("L12", "DAVID", "Não sei se eu diria isso.", "I wouldn't exactly call it that."),
  beat("L13", "AMI-108", "Entendo...", "I understand..."),
];

export const FINAL_RESTORATION = {
  energy: 3, med: 100, bio: 100, hist: 100, personal: 100, personalUnlocked: true,
} as const;

// Planned gates, not active transitions: installation -> F3 -> manual -> AMI memories
// -> E-FAMILY -> MEM-D4 -> FB-D4/FB-D5 -> E-BETRAYAL/E-PAST-RESTORED -> Chapter 5.
// Existing original art only: CENA-05, CENA-08, CENA-12, CENA-01, CENA-11.

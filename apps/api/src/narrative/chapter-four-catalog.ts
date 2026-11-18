// Server-only Chapter 4 catalog, transcribed from private Master v1.13 §6.
// Owner-approved playtest amendments supersede the earlier source here. Do not expose future memories to the client or AI.
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
  beat("L04", "DAVID", "Assistente Modular Infantil?", "Automated Minder for Infants?"),
  beat("L06", "DAVID", "Tipo uma babá?", "Like a nanny?"),
];

export const MANUAL_RECORDS: readonly Localized[] = [
  local("REGISTRO DE FABRICAÇÃO RECUPERADO\nMODELO: AMI / UNIDADE: 108", "MANUFACTURING RECORD RECOVERED\nMODEL: AMI / UNIT: 108"),
  local("ASSISTENTE MODULAR INFANTIL", "AUTOMATED MINDER FOR INFANTS"),
  local("FUNÇÕES: EDUCAÇÃO - CUIDADOS DOMÉSTICOS - SEGURANÇA - ACOMPANHAMENTO FAMILIAR - PRIMEIROS SOCORROS.", "FUNCTIONS: EDUCATION - DOMESTIC CARE - SAFETY - FAMILY ASSISTANCE - FIRST AID."),
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
    beat('FB-A4/01', 'CHILD', 'BOBO, SOCORRO!', 'BOBO, HELP!'),
  ] },
] as const;

export const FAMILY_RETURN: readonly Beat[] = [
  beat("L01", "AMI-108", "Eu me lembro.", "I remember."),
  beat("L02", "DAVID", "...", "..."),
  beat("L03", "AMI-108", "Eu deveria protegê-los.", "I was supposed to protect them."),
  beat("L04", "AMI-108", "Eu não consegui.", "I couldn't."),
  beat("L05", "DAVID", "Você fez tudo o que podia, AMI.", "You did everything you could, AMI."),
  beat("L06", "AMI-108", "Não foi suficiente.", "It wasn't enough."),
  beat("L07", "DAVID", "Eu sinto muito, AMI.", "I’m so sorry, AMI."),
];

export const DAVID_MEMORY_TRIGGER: readonly Beat[] = [
  beat("MEM-D4", "DAVID", "Merda... minha cabeça!", "Shit... my head!"),
];

export const BETRAYAL_DIALOGUE: readonly Beat[] = [
  beat("F01", "DAVID", "Você tem noção de quanto isso vale?", "Do you have any idea what this is worth?"),
  beat("F02", "HOWARD", "Tenho.", "I do."),
  beat("F03", "DAVID", "Acabaram os nossos problemas, cara.", "Our problems are over, man."),
  beat("F04", "HOWARD", "É.", "Yeah."),
  beat("F05", "DAVID", "A gente só precisa levar isso até o comprador.", "We just need to get this to the buyer."),
  beat("F06", "HOWARD", "O de sempre.", "The usual one."),
  beat("F07", "DAVID", "O de sempre. Vamos guardar isso.", "The usual one. Let's pack this up."),
  beat("F08", "HOWARD", "Sinto muito, David.", "I'm sorry, David."),
  beat("F09", "HOWARD", "... São apenas negócios.", "... It's just business."),
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

// Explicit order of future presentation gates, not yet connected to the engine.
// F3 is committed at the component installation boundary, before the manual.
export const CHAPTER_FOUR_GATES = [
  'A04-S01/CHAPTER_CARD', 'A04-S01/L01', 'A04-S01/L02',
  'A04-S01/INSTALL', 'F3', 'A04-S01/L03', 'UI-MANUAL',
  'A04-S01/L04', 'A04-S01/L06',
  'FB-A1', 'FB-A2', 'FB-A3', 'FB-A4', 'FAMILY-RETURN', 'E-FAMILY',
  'MEM-D4', 'FB-D4', 'FB-D5', 'BETRAYAL-RETURN', 'E-BETRAYAL', 'E-PAST-RESTORED',
  'A05-S01/CHAPTER_CARD',
] as const;

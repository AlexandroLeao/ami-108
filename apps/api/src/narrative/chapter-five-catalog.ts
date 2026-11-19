// Server-only Chapter 5 source catalog. Master v1.13 §7.
// Not connected to the campaign, API, or browser yet. Original artwork only.
import { local, type Localized } from './catalog';
import type { EncounterDefinition } from './encounter';

type Beat = Readonly<{ id: string; speaker: 'DAVID' | 'AMI-108'; text: Localized }>;
const beat = (id: string, speaker: Beat['speaker'], pt: string, en: string): Beat => ({ id, speaker, text: local(pt,en) });

export const HANGAR_DIALOGUE: readonly Beat[] = [
  beat("L01", "AMI-108", "Identifiquei uma nave de emergência. O circuito de alimentação necessita de uma célula de reposição.", "I have identified an emergency ship. Its power circuit requires a replacement cell."),
  beat("L02", "DAVID", "Onde encontro uma dessas?", "Where do I find one of those?"),
  beat("L03", "AMI-108", "No compartimento de manutenção, próximo à nave.", "In the maintenance compartment near the ship."),
  beat("L04", "DAVID", "Achei. Acho que ainda sei como instalar isso.", "Found it. I think I still know how to install this."),
  beat("L05", "AMI-108", "Alimentação restaurada. Os sistemas estão disponíveis.", "Power restored. The systems are available."),
  beat("L06", "DAVID", "Ah, não... Mais uma dessas coisas.", "Oh, no... Another one of those things."),
  beat("L07", "AMI-108", "Organismo identificado.", "Organism identified."),
  beat("L08", "DAVID", "AMI, preciso que você acerte essa.", "AMI, I need you to get this one right."),
  beat("L09", "AMI-108", "Meus sistemas estão completamente restaurados.", "My systems are fully restored."),
  beat("L10", "DAVID", "Eu sei. Mas não custa pedir.", "I know. But it doesn't hurt to ask."),
  beat("L11", "AMI-108", "Tecnicamente, custa uma unidade de energia.", "Technically, it costs one unit of energy."),
  beat("L12", "DAVID", "Muito engraçado.", "Very funny."),
];
export const BOAR_QUESTION = beat('Q-BOAR','DAVID',"Como a gente tira essa nave daqui sem ser atacado?","How do we get this ship out of here without being attacked?");
const correct = local("Essa espécie detecta fontes intensas de calor. Abra o portão utilizando o sistema auxiliar antes de ativar os motores. Quando a propulsão entrar em funcionamento, devemos partir imediatamente.","This species detects intense heat sources. Open the gate using the auxiliary system before starting the engines. Once propulsion is active, we must depart immediately.");
export const BOAR: EncounterDefinition = {
  id: 'BOAR', probability: 1, correct, random: correct, randomIsRecipe: false,
  choices: [
    { id: "BOAR-01", label: local("Aquecer os motores antes de abrir o portão.","Warm up the engines before opening the gate."), consequence: local("O calor atrai o javali enquanto a nave está presa. Ele investe pela abertura lateral; David morre.","The heat attracts the boar while the ship is trapped. It charges through the side opening; David dies."), outcome: 'DEAD' },
    { id: "BOAR-02", label: local("Ativar os motores em potência reduzida e iniciar a abertura do portão.","Start the engines at reduced power and begin opening the gate."), consequence: local("Mesmo em potência reduzida, o calor atrai a criatura antes da abertura completa.","Even at reduced power, the heat attracts the creature before the gate fully opens."), outcome: 'DEAD' },
    { id: "BOAR-03", label: local("Utilizar os ventiladores para dispersar o calor durante a partida.","Use the fans to disperse heat during launch."), consequence: local("David liga os motores com os ventiladores e a saída ainda não está livre. A ventilação não oculta a assinatura térmica; a criatura alcança a nave.","David starts the engines with the fans running and the exit still not clear. Ventilation does not conceal the thermal signature; the creature reaches the ship."), outcome: 'DEAD' },
    { id: "BOAR-04", label: local("Abrir o portão pelo sistema auxiliar e ativar os motores somente quando a saída estiver livre.","Open the gate with the auxiliary system and start the engines only when the exit is clear."), consequence: local("Portão abre sem atrair a criatura. David embarca/aciona propulsão; a nave decola imediatamente, antes de o javali alcançá-la.","The gate opens without attracting the creature. David boards/starts propulsion; the ship launches before the boar reaches it."), outcome: 'SUCCESS' },
  ],
};
export const LAUNCH_CONSULTED: readonly Beat[] = [
  beat("B1", "DAVID", "Funcionou.", "It worked."),
  beat("B2", "AMI-108", "Naturalmente.", "Naturally."),
  beat("B3", "DAVID", "Sem receitas de bolo dessa vez.", "No cake recipes this time."),
  beat("B4", "AMI-108", "Deseja uma?", "Would you like one?"),
  beat("B5", "DAVID", "Não, AMI.", "No, AMI."),
  beat("B6", "AMI-108", "Compreendido.", "Understood."),
];
export const LAUNCH_NO_CONSULT: readonly Beat[] = [
  beat("C1", "DAVID", "Conseguimos.", "We made it."),
  beat("C2", "AMI-108", "Partida confirmada.", "Departure confirmed."),
];
export const LAUNCH_NO_RECIPE = local('Sem bananas dessa vez.', 'No bananas this time.');
export const ORBIT_DIALOGUE: readonly Beat[] = [
  beat("L01", "DAVID", "Eu sei onde ele vai estar.", "I know where he'll be."),
  beat("L02", "AMI-108", "O homem que deixou você aqui?", "The man who left you here?"),
  beat("L03", "DAVID", "É. Ele acha que eu estou morto.", "Yeah. He thinks I'm dead."),
  beat("L04", "AMI-108", "Uma conclusão incorreta.", "An incorrect conclusion."),
  beat("L05", "DAVID", "Ele vai descobrir isso em breve.", "He'll find out soon enough."),
  beat("L06", "AMI-108", "Nesse caso, irei com você.", "In that case, I will accompany you."),
  beat("L07", "DAVID", "Tem certeza?", "Are you sure?"),
  beat("L08", "AMI-108", "...", "..."),
  beat("L09", "AMI-108", "Afirmativo.", "Affirmative."),
  beat("L10", "DAVID", "Eu quero me vingar, AMI. Não sei se sou uma boa companhia pra você.", "I want revenge, AMI. I'm not sure I'd be good company."),
  beat("L11", "AMI-108", "Você apresenta diversos defeitos.", "You have several defects."),
  beat("L12", "DAVID", "Obrigado.", "Thanks."),
  beat("L13", "AMI-108", "Entretanto, abandoná-lo não me parece uma solução adequada.", "However, abandoning you does not seem like an appropriate solution."),
  beat("L14", "DAVID", "Obrigado, amigo.", "Thank you, my friend."),
  beat("L15", "AMI-108", "De nada, Bobo.", "You're welcome, Bobo."),
];
export const FINAL_TITLE = local('CONTINUA...', 'TO BE CONTINUED...');
export const CHAPTER_FIVE_ASSETS = ['CENA-09','CENA-10'] as const;
export const BOAR_FACTS = ['INTENSE_HEAT_ATTRACTS','AUXILIARY_GATE_FULLY_OPEN_BEFORE_IGNITION','DEPART_IMMEDIATELY'] as const;

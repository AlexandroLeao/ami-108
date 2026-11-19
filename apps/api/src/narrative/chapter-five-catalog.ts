// Server-only Chapter 5 source catalog. Master v1.13 §7.
// Original artwork only; campaign dispatch and persistence live outside this catalog.
import { local, type Localized } from './catalog';
import type { EncounterDefinition } from './encounter';

type Beat = Readonly<{ id: string; speaker: 'DAVID' | 'AMI-108'; text: Localized }>;
const beat = (id: string, speaker: Beat['speaker'], pt: string, en: string): Beat => ({ id, speaker, text: local(pt,en) });

// Owner-approved Day 4 rewrite: confront the boar before retrieving the cell.
export const HANGAR_DIALOGUE: readonly Beat[] = [
  beat("L01", "AMI-108", "Identifiquei uma nave de emergência. O circuito de alimentação necessita de uma célula de reposição.", "I have identified an emergency ship. Its power circuit requires a replacement cell."),
  beat("L02", "DAVID", "Onde encontro uma dessas?", "Where do I find one of those?"),
  beat("L03", "AMI-108", "No compartimento de manutenção, próximo à nave.", "In the maintenance compartment near the ship."),
  beat("L06", "DAVID", "Meu Deus...", "My God..."),
  beat("L06b", "DAVID", "Olha o tamanho desse bicho, AMI...", "Look at the size of that thing, AMI..."),
  beat("L07", "AMI-108", "Organismo identificado.", "Organism identified."),
  beat("L07b", "AMI-108", "Precisamos passar por ele para pegar a célula de reposição.", "We need to get past it to retrieve the replacement cell."),
  beat("L08", "DAVID", "Perfeito, como a gente passa do porcão mutante então?", "Great, how do we get past the mutant hog, then?"),
  beat("L08b", "DAVID", "Sem maluquices aleatórias dessa vez.", "No random nonsense this time."),
  beat("L09", "AMI-108", "Meus sistemas estão completamente restaurados.", "My systems are fully restored."),
  beat("L10", "DAVID", "Eu sei. Mas não custa pedir.", "I know. But it doesn't hurt to ask."),
  beat("L11", "AMI-108", "Tecnicamente, custa uma unidade de energia.", "Technically, it costs one unit of energy."),
  beat("L12", "DAVID", "Muito engraçado, AMI.", "Very funny, AMI."),
];
export const HANGAR_NARRATION: Readonly<Record<string,Localized>> = {
  ENTRY: local("Você e AMI seguem pela rota de fuga até um amplo hangar militar. Entre equipamentos abandonados, você avista uma nave de emergência.", "You and AMI follow the escape route into a vast military hangar. Among the abandoned equipment, you spot an emergency ship."),
  PANEL: local("Você retira AMI da mochila e o aproxima de um painel de manutenção junto à entrada para que ele examine os sistemas da nave.", "You take AMI out of your backpack and hold him near a maintenance panel by the entrance so he can examine the ship's systems."),
  APPROACH: local("Você coloca AMI de volta na mochila e avança em direção à nave, procurando o compartimento de manutenção.", "You put AMI back in your backpack and head toward the ship, looking for the maintenance compartment."),
  NOISE: local("Porém, um estrondo muito mais forte do que qualquer barulho que você ouviu até agora ecoa pelo hangar.", "But a crash louder than anything you have heard so far echoes through the hangar."),
  LOOK: local("Você ergue lentamente o olhar, das patas enormes até a cabeça de uma criatura que se ergue diante de você. É muito maior do que qualquer organismo que encontrou até agora.", "You slowly raise your eyes from enormous hooves to the head of a creature towering over you. It is far larger than any organism you have encountered so far."),
  FIND: local("Com o caminho livre, você e AMI chegam ao compartimento de manutenção ao lado da nave. Você abre um armário de peças e encontra uma célula de reposição intacta.", "With the path clear, you and AMI reach the maintenance compartment beside the ship. You open a parts cabinet and find an intact replacement cell."),
  CARRY: local("Você leva a célula até o circuito de alimentação da nave e encaixa a peça no suporte vazio.", "You carry the cell to the ship's power circuit and fit it into the empty mount."),
  REPAIR: local("Os controles voltam a funcionar. Você abre o portão do hangar pelo sistema auxiliar e aguarda até que a saída esteja completamente livre.", "The controls come back online. You open the hangar gate using the auxiliary system and wait until the exit is completely clear."),
  LAUNCH: local("Você embarca com AMI, aciona os motores e decola imediatamente. A criatura permanece no outro extremo do hangar enquanto a nave deixa o local.", "You board with AMI, start the engines and take off immediately. The creature remains at the far end of the hangar as the ship leaves."),
};
export const BOAR_QUESTION = beat('Q-BOAR','DAVID',"Como a gente tira essa coisa do caminho?","How do we get that thing out of the way?");
const correct = local("Essa espécie detecta fontes intensas de calor. Acione à distância um aquecedor de manutenção no extremo oposto do hangar. Aguarde a criatura se afastar antes de atravessar. Depois de instalar a célula, abra completamente o portão pelo sistema auxiliar antes de ativar os motores.", "This species detects intense heat sources. Remotely activate a maintenance heater at the far end of the hangar. Wait for the creature to move away before crossing. After installing the cell, fully open the gate using the auxiliary system before starting the engines.");
export const BOAR: EncounterDefinition = {
  id: 'BOAR', probability: 1, correct, random: correct, randomIsRecipe: false,
  choices: [
    { id: "BOAR-01", label: local("Acionar um aquecedor próximo à nave e contornar a criatura enquanto ela se distrai.", "Activate a heater near the ship and circle around the creature while it is distracted."), consequence: local("O calor atrai a criatura para perto da nave. Ela percebe seus movimentos e investe contra você.", "The heat draws the creature toward the ship. It notices your movements and charges at you."), outcome: 'DEAD' },
    { id: "BOAR-02", label: local("Transportar uma fonte de calor portátil até uma passagem lateral para atrair a criatura.", "Carry a portable heat source to a side passage to lure the creature."), consequence: local("A criatura detecta o calor antes que você consiga se afastar. Ela alcança você.", "The creature detects the heat before you can move away. It catches you."), outcome: 'DEAD' },
    { id: "BOAR-03", label: local("Acionar a ventilação para reduzir o calor do seu corpo e atravessar discretamente.", "Activate the ventilation to reduce your body heat and cross unnoticed."), consequence: local("A ventilação não oculta completamente sua assinatura térmica. A criatura detecta você e ataca.", "The ventilation does not completely conceal your thermal signature. The creature detects you and attacks."), outcome: 'DEAD' },
    { id: "BOAR-04", label: local("Acionar à distância um aquecedor no extremo oposto do hangar e esperar a criatura se afastar.", "Remotely activate a heater at the far end of the hangar and wait for the creature to move away."), consequence: local("Você aciona o aquecedor pelo painel de manutenção. A criatura segue a fonte de calor até o outro extremo do hangar, deixando livre o caminho até a nave.", "You activate the heater from the maintenance panel. The creature follows the heat source to the far end of the hangar, clearing the path to the ship."), outcome: 'SUCCESS' },
  ],
};
export const LAUNCH_DIALOGUE: readonly Beat[] = [
  beat("B1", "DAVID", "Funcionou.", "It worked."),
  beat("B2", "AMI-108", "Naturalmente.", "Naturally."),
  beat("B3", "DAVID", "Legal, vamos achar essa célula e dar o fora daqui.", "Great, let's find that cell and get out of here."),
  beat("B4", "DAVID", "Funcionou, AMI!", "It worked, AMI!"),
  beat("B5", "DAVID", "Nada de dicas de casa ou informações aleatórias dessa vez!", "No household tips or random information this time!"),
  beat("B6", "AMI-108", "Deseja uma?", "Would you like one?"),
  beat("B7", "DAVID", "Muito engraçado.", "Very funny."),
];
export const ORBIT_DIALOGUE: readonly Beat[] = [
  beat("L01", "DAVID", "Eu sei onde ele vai estar.", "I know where he'll be."),
  beat("L02", "AMI-108", "O homem que deixou você aqui?", "The man who left you here?"),
  beat("L03", "DAVID", "É. Ele acha que eu estou morto.", "Yeah. He thinks I'm dead."),
  beat("L04", "AMI-108", "Uma conclusão incorreta.", "An incorrect conclusion."),
  beat("L05", "DAVID", "Ele vai descobrir isso em breve.", "He'll find out soon enough."),
  beat("L06", "AMI-108", "Nesse caso, irei com você.", "In that case, I will accompany you."),
  beat("L07", "DAVID", "Tem certeza?", "Are you sure?"),
  beat("L09", "AMI-108", "Afirmativo.", "Affirmative."),
  beat("L10", "DAVID", "Eu quero me vingar, AMI. Não sei se sou uma boa companhia pra você.", "I want revenge, AMI. I'm not sure I'd be good company."),
  beat("L11", "AMI-108", "Você apresenta diversos defeitos.", "You have several defects."),
  beat("L12", "DAVID", "...", "..."),
  beat("L13", "AMI-108", "Entretanto, abandoná-lo não me parece uma solução adequada.", "However, abandoning you does not seem like an appropriate solution."),
  beat("L14", "DAVID", "Obrigado, amigo.", "Thank you, my friend."),
  beat("L15", "AMI-108", "De nada, Bobo.", "You're welcome, Bobo."),
];
export const FINAL_TITLE = local('CONTINUA...', 'TO BE CONTINUED...');
export const CHAPTER_FIVE_ASSETS = ['CENA-09','CENA-10'] as const;
export const BOAR_FACTS = ['INTENSE_HEAT_ATTRACTS','REMOTE_HEAT_DECOY','WAIT_UNTIL_PATH_CLEAR','AUXILIARY_GATE_FULLY_OPEN_BEFORE_IGNITION'] as const;

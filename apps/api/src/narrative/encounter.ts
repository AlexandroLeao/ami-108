// Pure encounter rules. No provider calls, persistence or browser projection.
// The transaction adapter must persist the returned state and receipt together.
import { local, type Localized } from './catalog';

export type Energy = 0 | 1 | 2 | 3;
export type Category = 'CORRECT' | 'RANDOM';
export type EncounterId = 'DOG' | 'RAT' | 'BOAR';
export type Slot = Readonly<{ index: 1 | 2 | 3; category: Category; text: Localized; recipe: boolean }>;
export type Choice = Readonly<{ id: string; label: Localized; consequence: Localized; outcome: 'DEAD' | 'SUCCESS' }>;
export type EncounterDefinition = Readonly<{
  id: EncounterId; probability: number; choices: readonly Choice[];
  correct: Localized; random: Localized; randomIsRecipe: boolean;
}>;
export type EncounterState = Readonly<{
  id: EncounterId; phase: 'ACTIVE' | 'DEAD' | 'SUCCESS'; attempt: number;
  checkpointEnergy: Energy; energy: Energy; slots: readonly Slot[];
  used: readonly Category[]; recipeSeen: boolean; selected: string | null;
}>;
export class EncounterError extends Error {
  constructor(readonly code: 'INVALID_ENCOUNTER' | 'INVALID_PHASE' | 'NO_ENERGY' | 'INVALID_CHOICE' | 'INVALID_RANDOM') { super(code); }
}
export const DOG: EncounterDefinition = {
  id: 'DOG', probability: 0.15,
  correct: local('A mutação comprometeu sua visão, mas ampliou significativamente sua capacidade auditiva. Permaneça imóvel até que ela abandone a área.', 'The mutation impaired its vision but significantly heightened its hearing. Remain still until it leaves the area.'),
  random: local('Três ovos. Duas xícaras de açúcar. Misture até obter uma consistência homogênea.', 'Three eggs. Two cups of sugar. Mix until smooth.'),
  randomIsRecipe: true,
  choices: [
    { id: 'DOG-01', label: local('Atravessar enquanto a criatura estiver de costas.', 'Cross while the creature is facing away.'), consequence: local('Os passos denunciam David; a criatura o alcança.', "David's footsteps give him away; the creature catches him."), outcome: 'DEAD' },
    { id: 'DOG-02', label: local('Avançar usando os veículos como cobertura.', 'Advance using the vehicles as cover.'), consequence: local('Os destroços sob os pés produzem ruído suficiente para revelar sua posição.', 'Debris underfoot makes enough noise to reveal his position.'), outcome: 'DEAD' },
    { id: 'DOG-03', label: local('Distrair a criatura com um objeto.', 'Distract the creature with an object.'), consequence: local('Ela ouve o objeto e também a movimentação de David.', 'It hears the object and David moving as well.'), outcome: 'DEAD' },
    { id: 'DOG-04', label: local('Permanecer escondido e aguardar.', 'Stay hidden and wait.'), consequence: local('A criatura deixa a rua; David atravessa em segurança.', 'The creature leaves the street; David crosses safely.'), outcome: 'SUCCESS' },
  ],
};
function active(state: EncounterState, definition: EncounterDefinition) {
  if (state.id !== definition.id) throw new EncounterError('INVALID_ENCOUNTER');
  if (state.phase !== 'ACTIVE') throw new EncounterError('INVALID_PHASE');
}
export function startEncounter(definition: EncounterDefinition, energy: Energy = 3): EncounterState {
  return { id: definition.id, phase: 'ACTIVE', attempt: 1, checkpointEnergy: energy, energy, slots: [], used: [], recipeSeen: false, selected: null };
}
// RNG is injected; never draw for a previously resolved slot. The fallback is
// intentionally synchronous until the authorized provider reservation flow exists.
export function consultEncounter(state: EncounterState, definition: EncounterDefinition, random: () => number): { state: EncounterState; slot: Slot } {
  active(state, definition);
  if (state.energy === 0 || state.used.length >= 3) throw new EncounterError('NO_ENERGY');
  const index = (state.used.length + 1) as Slot['index'];
  let slot = state.slots.find((item) => item.index === index);
  let slots = state.slots;
  if (!slot) {
    const value = definition.probability === 1 ? 0 : random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new EncounterError('INVALID_RANDOM');
    const category: Category = value < definition.probability ? 'CORRECT' : 'RANDOM';
    slot = { index, category, text: category === 'CORRECT' ? definition.correct : definition.random, recipe: category === 'RANDOM' && definition.randomIsRecipe };
    slots = [...slots, slot];
  }
  return { slot, state: { ...state, slots, energy: (state.energy - 1) as Energy, used: [...state.used, slot.category], recipeSeen: state.recipeSeen || slot.recipe } };
}
export function chooseEncounter(state: EncounterState, definition: EncounterDefinition, choiceId: string): { state: EncounterState; choice: Choice } {
  active(state, definition);
  const choice = definition.choices.find((item) => item.id === choiceId);
  if (!choice) throw new EncounterError('INVALID_CHOICE');
  return { choice, state: { ...state, phase: choice.outcome, selected: choice.id } };
}
export function retryEncounter(state: EncounterState): EncounterState {
  if (state.phase !== 'DEAD') throw new EncounterError('INVALID_PHASE');
  return { ...state, phase: 'ACTIVE', attempt: state.attempt + 1, energy: state.checkpointEnergy, used: [], recipeSeen: false, selected: null };
}
export function successVariant(state: EncounterState): 'A' | 'B' | 'C' {
  if (state.phase !== 'SUCCESS') throw new EncounterError('INVALID_PHASE');
  return state.used.includes('CORRECT') ? 'B' : state.used.length ? 'A' : 'C';
}

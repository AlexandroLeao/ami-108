import {
  ARRIVAL_MEMORY, CHAPTER_THREE_GATES, LAB_AFTER_RECORDS, LAB_ENTRY, LAB_RECORDS,
  LAB_RETURN, RAT, RAT_ENTRY, RAT_QUESTION, RAT_REACTIONS, RAT_SUCCESS,
  SECOND_FRAGMENT,
} from '../src/narrative/chapter-three-catalog';
import { chooseEncounter, consultEncounter, retryEncounter, startEncounter, successVariant } from '../src/narrative/encounter';

describe('Chapter 3 source catalog — not yet integrated', () => {
  it('retains bilingual ordered records, dialogue and separate memory gates', () => {
    expect(LAB_ENTRY.map(beat => beat.id)).toEqual(['L01','L02','L03','L04','L05']);
    expect(LAB_RECORDS.map(beat => beat.id)).toEqual(['LAB-01','LAB-01b','LAB-02','LAB-02b','LAB-03','LAB-04','LAB-04b','LAB-04c','LAB-05','LAB-05b','LAB-05c']);
    expect(LAB_AFTER_RECORDS.at(-1)?.id).toBe('MEM-D3');
    expect(ARRIVAL_MEMORY.map(beat => beat.id)).toEqual(['F01','F01b','F01c','F02','F02b','F03','F04','F05','F05b','F06','F08','F09']);
    expect(ARRIVAL_MEMORY.filter(beat => beat.speaker === 'HOWARD')[0].id).toBe('F09');
    for (const beat of [...ARRIVAL_MEMORY, ...LAB_RETURN.filter(beat => beat.id === 'EXIT-01' || beat.id === 'EXIT-01b')]) {
      expect(beat.text['pt-BR'].length).toBeLessThanOrEqual(56);
      expect(beat.text.en.length).toBeLessThanOrEqual(56);
    }
    expect(SECOND_FRAGMENT.at(-1)?.text).toEqual({ 'pt-BR': 'Ok AMI, vamos nessa.', en: "OK, AMI, let's go." });
    expect(LAB_RETURN.map(beat => beat.id)).toEqual(['RETURN-00','RETURN-01','RETURN-01b','RETURN-01c','RETURN-02','EXIT-01','EXIT-01b','EXIT-02','EXIT-03']);
    const all = [...LAB_ENTRY, ...LAB_RECORDS, ...LAB_AFTER_RECORDS,
      ...ARRIVAL_MEMORY, ...LAB_RETURN, ...RAT_ENTRY, RAT_QUESTION, ...RAT_REACTIONS,
      ...Object.values(RAT_SUCCESS).flat(), ...SECOND_FRAGMENT];
    for (const beat of all) {
      expect(beat.text['pt-BR'].length).toBeGreaterThan(0);
      expect(beat.text.en.length).toBeGreaterThan(0);
    }
    expect(CHAPTER_THREE_GATES.restoredMemory).toEqual({
      med:75, bio:85, hist:78, personal:5, personalUnlocked:false,
    });
    expect(CHAPTER_THREE_GATES.recharge).toBe('F2');
    expect(CHAPTER_THREE_GATES.route).toBe('E-ESCAPE-ROUTE');
  });
  it('keeps biological weakness out of public records and early dialogue', () => {
    const publicText = JSON.stringify([...LAB_ENTRY, ...LAB_RECORDS, ...LAB_AFTER_RECORDS, ...RAT_ENTRY]);
    expect(publicText).not.toMatch(/intolerância à luz intensa|intolerance to intense light|iluminação de contenção|containment lighting/i);
    expect(JSON.stringify(ARRIVAL_MEMORY)).not.toMatch(/traição|betrayal|núcleo|energy core/i);
  });
  it.each([
    ['RAT-01','DEAD'], ['RAT-02','SUCCESS'], ['RAT-03','DEAD'], ['RAT-04','DEAD'],
  ])('uses only the authored outcome for %s', (id, outcome) => {
    const selected = chooseEncounter(startEncounter(RAT), RAT, id);
    expect(selected.choice.outcome).toBe(outcome);
    expect(selected.state.phase).toBe(outcome);
  });
  it('uses 42% and preserves resolved slots across retry, while keeping choices at zero', () => {
    expect(RAT.probability).toBe(0.42);
    let state = startEncounter(RAT);
    state = consultEncounter(state, RAT, () => 0.4199).state;
    state = consultEncounter(state, RAT, () => 0.42).state;
    state = consultEncounter(state, RAT, () => 0.99).state;
    expect(state.used).toEqual(['CORRECT','RANDOM','RANDOM']);
    expect(state.energy).toBe(0);
    expect(() => consultEncounter(state, RAT, () => 0)).toThrow('NO_ENERGY');
    const slots = state.slots;
    state = retryEncounter(chooseEncounter(state, RAT, 'RAT-01').state);
    expect(state.energy).toBe(3);
    const rng = jest.fn(() => 0.99);
    const reused = consultEncounter(state, RAT, rng);
    expect(rng).not.toHaveBeenCalled();
    expect(reused.slot).toEqual(slots[0]);
    expect(reused.state.slots).toEqual(slots);
    expect(successVariant(chooseEncounter(reused.state, RAT, 'RAT-02').state)).toBe('B');
    expect(successVariant(chooseEncounter(startEncounter(RAT), RAT, 'RAT-02').state)).toBe('C');
    expect(successVariant(chooseEncounter(consultEncounter(startEncounter(RAT), RAT, () => 0.9).state, RAT, 'RAT-02').state)).toBe('A');
  });
});

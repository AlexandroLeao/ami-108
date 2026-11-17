import { chooseEncounter, consultEncounter, DOG, retryEncounter, startEncounter, successVariant } from '../src/narrative/encounter';

describe('pure dog encounter rules', () => {
  it.each(['DOG-01', 'DOG-02', 'DOG-03', 'DOG-04'])('uses the authored outcome for %s', (id) => {
    const result = chooseEncounter(startEncounter(DOG), DOG, id);
    expect(result.state.phase).toBe(id === 'DOG-04' ? 'SUCCESS' : 'DEAD');
    expect(result.choice.consequence['pt-BR']).toBeTruthy();
    expect(() => chooseEncounter(result.state, DOG, id)).toThrow('INVALID_PHASE');
  });
  it('uses a strict 15% threshold and charges one bar per consultation', () => {
    let state = startEncounter(DOG);
    const rng = jest.fn().mockReturnValueOnce(0.149999).mockReturnValueOnce(0.15).mockReturnValueOnce(0.99);
    for (const category of ['CORRECT', 'RANDOM', 'RANDOM']) {
      const result = consultEncounter(state, DOG, rng);
      expect(result.slot.category).toBe(category);
      state = result.state;
    }
    expect(state.energy).toBe(0);
    expect(rng).toHaveBeenCalledTimes(3);
    expect(() => consultEncounter(state, DOG, rng)).toThrow('NO_ENERGY');
    expect(successVariant(chooseEncounter(state, DOG, 'DOG-04').state)).toBe('B');
  });
  it('restores only on explicit retry and reuses slots without drawing again', () => {
    const first = consultEncounter(startEncounter(DOG), DOG, () => 0.9);
    const dead = chooseEncounter(first.state, DOG, 'DOG-01').state;
    expect(dead.energy).toBe(2);
    expect(() => consultEncounter(dead, DOG, () => 0)).toThrow('INVALID_PHASE');
    const retried = retryEncounter(dead);
    expect(retried.energy).toBe(3);
    expect(retried.attempt).toBe(2);
    expect(retried.recipeSeen).toBe(false);
    expect(successVariant(chooseEncounter(retried, DOG, 'DOG-04').state)).toBe('C');
    const rng = jest.fn(() => 0);
    const reused = consultEncounter(retried, DOG, rng);
    expect(reused.slot).toEqual(first.slot);
    expect(reused.state.energy).toBe(2);
    expect(reused.state.recipeSeen).toBe(true);
    expect(rng).not.toHaveBeenCalled();
    expect(successVariant(chooseEncounter(reused.state, DOG, 'DOG-04').state)).toBe('A');
  });
  it('rejects unknown choices, invalid RNG and retry before death', () => {
    const state = startEncounter(DOG);
    expect(() => chooseEncounter(state, DOG, 'DOG-99')).toThrow('INVALID_CHOICE');
    expect(() => consultEncounter(state, DOG, () => 1)).toThrow('INVALID_RANDOM');
    expect(() => retryEncounter(state)).toThrow('INVALID_PHASE');
    expect(state.energy).toBe(3);
    expect(state.slots).toHaveLength(0);
  });
  it('guarantees CORRECT without drawing at probability one', () => {
    const guaranteed = { ...DOG, probability: 1 };
    const rng = jest.fn(() => 0.9);
    expect(consultEncounter(startEncounter(guaranteed), guaranteed, rng).slot.category).toBe('CORRECT');
    expect(rng).not.toHaveBeenCalled();
  });
});

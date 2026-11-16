import { createHash } from 'node:crypto';
import { CHAPTERS, CHAPTER_ONE, INTRO_FALLBACK } from '../src/narrative/catalog';
import { advanceNarrative, changeNarrativeLocale, currentAsset, NarrativeError, projectNarrative, startNarrative, type NarrativeState } from '../src/narrative/engine';

function next(state: NarrativeState): NarrativeState {
  return advanceNarrative(state, projectNarrative(state).actions[0].id, state.revision);
}
function reach(id: string, locale: 'pt-BR' | 'en' = 'pt-BR'): NarrativeState {
  let state = startNarrative(locale);
  for (let i = 0; i <= CHAPTER_ONE.length; i++) {
    if (state.stepId === id) return state;
    state = next(state);
  }
  throw new Error('Step not reached');
}

describe('server-only Chapter 1 catalog and transition core', () => {
  it('keeps five titles, twelve distinct scene IDs and localized chapter-one steps', () => {
    expect(CHAPTERS).toHaveLength(5);
    expect(new Set(CHAPTERS.flatMap((chapter) => [...chapter.scenes])).size).toBe(12);
    expect(new Set(CHAPTER_ONE.map((step) => step.id)).size).toBe(CHAPTER_ONE.length);
    for (const step of CHAPTER_ONE) {
      expect(step.text['pt-BR'].length).toBeGreaterThan(0);
      expect(step.text.en.length).toBeGreaterThan(0);
    }
  });
  it('preserves the original 45-beat digest outside approved presentation edits', () => {
    const subdivisions: Record<string, string[]> = {
      L09: ['L09b'], L11: ['L11b'], L12: ['L12b', 'L12c'], L18: ['L18b', 'L18c'], L31: ['L31b'],
    };
    const excluded = new Set(['A01-S02/STREET-REVEAL', 'A01-S03/REVEAL', 'A01-S03/L02b',
      ...Object.values(subdivisions).flat().map((id) => 'A01-S03/' + id)]);
    const tuples = CHAPTER_ONE.flatMap((step) => {
      if (!step.speaker || excluded.has(step.id)) return [];
      const speaker = (value: string) => value === 'AMI-108' ? 'AMI' : value;
      const parts = step.sceneId === 'A01-S03' ? subdivisions[step.id.split('/')[1]] ?? [] : [];
      const lines = [step, ...parts.map((id) => CHAPTER_ONE.find((item) => item.id === 'A01-S03/' + id)!)];
      const pt = step.id === 'A01-S03/L02' ? 'Quem você está chamando de bobo? Meu nome não é bobo. Meu nome é...'
        : step.id === 'A01-S03/L03' ? '... Aliás, qual é o meu nome mesmo?' : lines.map((item) => item.text['pt-BR']).join(' ');
      const en = step.id === 'A01-S03/L02' ? "Bobo? That's not my name. My name is..." : lines.map((item) => item.text.en).join(' ');
      return [[step.id, speaker(step.speaker['pt-BR']), speaker(step.speaker.en), pt, en]];
    });
    expect(tuples).toHaveLength(45);
    expect(createHash('sha256').update(JSON.stringify(tuples), 'utf8').digest('hex'))
      .toBe('d0c281253ba699d61705279cae74a4cf37ffac27133e3b3c95b077c174179c39');
  });
  it('presents the new narration, dark transitions and short Bobo exchange in order', () => {
    const expected = [
      ['A01-S01/EXIT-01', null, null, 'fade-black', true],
      ['A01-S01/EXIT-02', null, null, 'none', true],
      ['A01-S02/STREET-REVEAL', '???', 'CENA-02', 'wake', false],
      ['A01-S02/ENV-02', null, 'CENA-02', 'none', true],
      ['A01-S02/ENV-02b', null, 'CENA-02', 'none', true],
      ['A01-S02/ENV-02c', null, 'CENA-02', 'none', true],
      ['A01-S02/ENV-02d', null, 'CENA-02', 'none', true],
      ['A01-S02/L01', '???', null, 'fade-black', false],
      ['A01-S02/L02', '???', null, 'none', false],
      ['A01-S03/ENTER-01', null, null, 'none', true],
      ['A01-S03/ENTER-02', null, null, 'none', true],
      ['A01-S03/REVEAL', '???', 'CENA-03', 'wake', false],
      ['A01-S03/L01', 'Robô', 'CENA-03', 'none', false],
      ['A01-S03/L02', '???', 'CENA-03', 'none', false],
      ['A01-S03/L02b', '???', 'CENA-03', 'none', false],
      ['A01-S03/L03', '???', 'CENA-03', 'none', false],
    ] as const;
    let state = reach('A01-S01/L04');
    expect(projectNarrative(state).actions[0].kind).toBe('CONTINUE');
    for (const [id, speaker, asset, cue, narration] of expected) {
      state = next(state);
      expect(state.stepId).toBe(id);
      expect(currentAsset(state)).toBe(asset);
      expect(projectNarrative(state)).toMatchObject({ speaker, cue, narration, diagnostics: null });
      expect(projectNarrative(state).actions[0].kind).toBe('CONTINUE');
      expect(projectNarrative(state).actions.some((action) => action.kind === 'PREVIOUS')).toBe(true);
    }
    expect(projectNarrative(reach('A01-S03/L02')).text).toBe('Quem você tá chamando de bobo?!');
    expect(projectNarrative(reach('A01-S03/L02b')).text).toBe('Meu nome é...');
    expect(projectNarrative(state).text).toBe('...Aliás, qual é o meu nome mesmo?');
    expect(projectNarrative(reach('A01-S03/L07')).speaker).toBe('AMI-108');
    expect(projectNarrative(reach('A01-S03/L07', 'en')).speaker).toBe('AMI-108');
  });
  it('reviews reached narration and scene boundaries without undoing progress', () => {
    const original = reach('A01-S03/L01');
    let state = original;
    for (const id of ['A01-S03/REVEAL', 'A01-S03/ENTER-02', 'A01-S03/ENTER-01', 'A01-S02/L02', 'A01-S02/L01', 'A01-S02/ENV-02d']) {
      const previous = projectNarrative(state).actions.find((action) => action.kind === 'PREVIOUS')!;
      state = advanceNarrative(state, previous.id, state.revision);
      expect(state.reviewStepId).toBe(id);
      expect(state.stepId).toBe(original.stepId);
      expect(state.events).toEqual(original.events);
    }
    for (let i = 0; i < 6; i++) state = next(state);
    expect(state.reviewStepId).toBeNull();
    expect(state.stepId).toBe(original.stepId);
  });
  it('preserves the approved dark opening and first reveal', () => {
    let state = next(startNarrative('pt-BR'));
    for (const [text, cue] of [['...', 'ellipsis'], ['Que merda...', 'pain'], ['Minha cabeça...', 'pain']]) {
      expect(projectNarrative(state)).toMatchObject({ text, cue, asset: null, diagnostics: null, speaker: '???' });
      expect(currentAsset(state)).toBeNull();
      state = next(state);
    }
    expect(projectNarrative(state)).toMatchObject({ text: 'Onde eu estou?', cue: 'wake' });
    expect(currentAsset(state)).toBe('CENA-01');
    state = next(state);
    expect(projectNarrative(state)).toMatchObject({ text: 'Sangue...?', cue: 'none' });
    expect(currentAsset(state)).toBe('CENA-01');
  });
  it('rejects arbitrary future actions, stale commands and invalid locale', () => {
    const state = startNarrative('pt-BR');
    expect(() => advanceNarrative(state, 'A01-S03/L33/NEXT', 0)).toThrow(NarrativeError);
    expect(() => advanceNarrative(state, projectNarrative(state).actions[0].id, 1)).toThrow('STALE_REVISION');
    const applied = next(state);
    expect(() => advanceNarrative(applied, projectNarrative(state).actions[0].id, 0)).toThrow('STALE_REVISION');
    expect(() => changeNarrativeLocale(state, 'invalid' as 'en', 0)).toThrow('INVALID_LOCALE');
    expect(state.revision).toBe(0);
  });
  it('initializes diagnostics only at E-JOIN, with canonical values', () => {
    const before = reach('A01-S03/L23');
    expect(projectNarrative(before).diagnostics).toBeNull();
    const joined = next(before);
    expect(joined.events).toEqual(['E-JOIN']);
    expect(projectNarrative(joined).diagnostics).toEqual({ energy: 3, med: 10, bio: 15, hist: 12, personal: 5, personalUnlocked: false });
    expect(projectNarrative(next(joined)).text).toContain('Consultar AMI consome uma barra.');
  });
  it('uses one free fixed RANDOM fallback and keeps it when changing locale', () => {
    const state = reach('A01-S03/L33');
    expect(state.intro).toEqual({ category: 'RANDOM', source: 'fallback', text: INTRO_FALLBACK });
    expect(state.diagnostics?.energy).toBe(3);
    expect(projectNarrative(state).text).toBe(INTRO_FALLBACK['pt-BR']);
    const translated = changeNarrativeLocale(state, 'en', state.revision);
    expect(translated.stepId).toBe(state.stepId);
    expect(translated.events).toEqual(state.events);
    expect(translated.intro).toBe(state.intro);
    expect(projectNarrative(translated).text).toBe(INTRO_FALLBACK.en);
    expect(projectNarrative(next(translated)).text).toBe('Wonderful.');
  });
  it('runs MEM-D1, black FB-D1 and return without consuming energy or changing memory', () => {
    const pain = reach('A01-S03/MEM-D1');
    expect(projectNarrative(pain)).toMatchObject({ text: 'Ah... minha cabeça!', speaker: '???', cue: 'pain' });
    const flashback = next(pain);
    expect(projectNarrative(flashback)).toMatchObject({ phase: 'FLASHBACK', asset: null, cue: 'memory-cut' });
    expect(currentAsset(flashback)).toBeNull();
    const returned = next(flashback);
    expect(projectNarrative(returned).text).toBe('Alguma irregularidade?');
    expect(currentAsset(returned)).toBe('CENA-02');
    expect(returned.diagnostics).toEqual(pain.diagnostics);
    expect(returned.events).toEqual(['E-JOIN', 'INTRO-RANDOM', 'MEM-D1', 'FB-D1']);
  });
  it('reviews only reached dialogue without rewinding authoritative state or replaying events', () => {
    const original = reach('A01-S01/L03');
    const previous = projectNarrative(original).actions.find((action) => action.kind === 'PREVIOUS');
    expect(previous).toBeDefined();
    const reviewed = advanceNarrative(original, previous?.id ?? 'missing', original.revision);
    expect(reviewed.stepId).toBe(original.stepId);
    expect(reviewed.reviewStepId).toBe('A01-S01/L02');
    expect(projectNarrative(reviewed).text).toBe('Onde eu estou?');
    expect(currentAsset(reviewed)).toBe('CENA-01');
    const dark = advanceNarrative(reviewed, projectNarrative(reviewed).actions[1].id, reviewed.revision);
    expect(currentAsset(dark)).toBeNull();
    expect(dark.stepId).toBe(original.stepId);
    const restored = next(next(dark));
    expect(restored.reviewStepId).toBeNull();
    expect(restored.stepId).toBe(original.stepId);
    expect(next(restored).stepId).toBe('A01-S01/L04');
    for (const id of ['A01-S01/SILENCE', 'A01-S03/E-JOIN', 'A01-S03/L33', 'A01-S03/L34', 'A01-S03/MEM-D1', 'A01-S03/FB-D1', 'A01-S03/L35']) {
      const state = reach(id);
      expect(projectNarrative(state).actions.some((action) => action.kind === 'PREVIOUS')).toBe(false);
    }
    const afterIntro = reach('A01-S03/L38');
    const back = advanceNarrative(afterIntro, projectNarrative(afterIntro).actions[1].id, afterIntro.revision);
    expect(back.events).toBe(afterIntro.events);
    expect(back.intro).toBe(afterIntro.intro);
    expect(back.diagnostics).toBe(afterIntro.diagnostics);
    expect(next(back).stepId).toBe(afterIntro.stepId);
  });
  it('traverses Chapter 1 in both locales and stops at the unimplemented Chapter 2 boundary', () => {
    for (const locale of ['pt-BR', 'en'] as const) {
      let state = startNarrative(locale);
      for (const step of CHAPTER_ONE) {
        expect(state.stepId).toBe(step.id);
        const view = projectNarrative(state);
        expect(view.actions.filter((action) => action.kind !== 'PREVIOUS')).toHaveLength(1);
        expect(view.text).toBe(step.text[locale]);
        expect(view).not.toHaveProperty('events');
        expect(view).not.toHaveProperty('intro');
        expect(view).not.toHaveProperty('stepId');
        expect(view).not.toHaveProperty('reviewStepId');
        state = next(state);
      }
      expect(projectNarrative(state)).toMatchObject({ chapter: 2, sceneId: 'A02-S01', phase: 'CHAPTER_CARD', actions: [], asset: null });
      expect(state.events).toEqual(['E-JOIN', 'INTRO-RANDOM', 'MEM-D1', 'FB-D1']);
      expect(() => advanceNarrative(state, 'A02-S01/L01/NEXT', state.revision)).toThrow('ACTION_NOT_ALLOWED');
    }
  });
});

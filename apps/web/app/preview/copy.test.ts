import { describe, expect, it } from 'vitest';
import { copy } from './copy';
import { davidMemoryCue, initialPreview, openingVisual, previewReducer } from './preview-state';

describe('approved cinematic opening', () => {
  it('adds the approved silent beat, splits the initial line and preserves subsequent dialogue', () => {
    expect(copy['pt-BR'].lines).toEqual([
      '...', 'Que merda...', 'Minha cabeça...', 'Onde eu estou?', 'Sangue...?', 'Que diabos aconteceu aqui?',
    ]);
    expect(copy.en.lines).toEqual([
      '...', 'Shit...', 'My head...', 'Where am I?', 'Blood...?', 'What the hell happened here?',
    ]);
    expect(copy.en.speaker).toBe('???');
    expect(copy['pt-BR'].speaker).toBe('???');
    expect(Object.keys(copy['pt-BR']).sort()).toEqual(Object.keys(copy.en).sort());
    expect(copy.en.extrasPages.length).toBe(copy['pt-BR'].extrasPages.length);
  });

  it('blinks and trembles for the four waking beats, then stabilizes at Blood', () => {
    expect(openingVisual(0)).toEqual({ reveal: true, cue: 'wake', wakePhase: 'silence' });
    expect(openingVisual(1)).toEqual({ reveal: true, cue: 'wake', wakePhase: 'shock' });
    expect(openingVisual(2)).toEqual({ reveal: true, cue: 'wake', wakePhase: 'pain' });
    expect(openingVisual(3)).toEqual({ reveal: true, cue: 'wake', wakePhase: 'focus' });
    expect(openingVisual(4)).toEqual({ reveal: true, cue: 'none', wakePhase: 'none' });
    expect(openingVisual(5)).toEqual({ reveal: true, cue: 'none', wakePhase: 'none' });
    expect(openingVisual(-1)).toEqual({ reveal: false, cue: 'none', wakePhase: 'none' });
  });

  it('resumes from the same line after pause and language selection', () => {
    let state = previewReducer(initialPreview, { type: 'START' });
    state = previewReducer(state, { type: 'CHAPTER_READY' });
    state = previewReducer(state, { type: 'ADVANCE' });
    state = previewReducer(state, { type: 'ADVANCE' });
    state = previewReducer(state, { type: 'PAUSE' });
    state = previewReducer(state, { type: 'LANGUAGE' });
    expect(previewReducer(state, { type: 'ADVANCE' })).toEqual(state);
    state = previewReducer(state, { type: 'BACK' });
    expect(state.overlay).toBe('pause');
    state = previewReducer(state, { type: 'BACK' });
    expect(state).toMatchObject({ stage: 'scene', line: 1, overlay: 'none' });
    expect(previewReducer(state, { type: 'MAIN_MENU' })).toEqual(initialPreview);
  });

  it('keeps the chapter on screen until the player advances after the reveal', () => {
    const chapter = previewReducer(initialPreview, { type: 'START' });
    expect(previewReducer(chapter, { type: 'ADVANCE' })).toEqual(chapter);
    const ready = previewReducer(chapter, { type: 'CHAPTER_READY' });
    expect(ready).toMatchObject({ stage: 'chapter', chapterReady: true, line: 0 });
    expect(previewReducer(ready, { type: 'CHAPTER_READY' })).toEqual(ready);
    const scene = previewReducer(ready, { type: 'ADVANCE' });
    expect(scene).toMatchObject({ stage: 'scene', line: 0 });
    expect(previewReducer(scene, { type: 'CHAPTER_READY' })).toEqual(scene);
  });

  it('ends the preview after all six lines without pretending to save progress', () => {
    let state = previewReducer(initialPreview, { type: 'START' });
    state = previewReducer(state, { type: 'CHAPTER_READY' });
    state = previewReducer(state, { type: 'ADVANCE' });
    for (let n = 0; n < 6; n++) state = previewReducer(state, { type: 'ADVANCE' });
    expect(state.stage).toBe('end');
  });

  it('allows previous dialogue only within the current opening and never while paused', () => {
    const chapter = previewReducer(initialPreview, { type: 'START' });
    expect(previewReducer(chapter, { type: 'PREVIOUS' })).toEqual(chapter);
    let state = previewReducer(previewReducer(chapter, { type: 'CHAPTER_READY' }), { type: 'ADVANCE' });
    expect(previewReducer(state, { type: 'PREVIOUS' })).toEqual(state);
    for (let n = 0; n < 4; n++) state = previewReducer(state, { type: 'ADVANCE' });
    expect(state.line).toBe(4);
    state = previewReducer(state, { type: 'PREVIOUS' });
    expect(state.line).toBe(3);
    expect(openingVisual(state.line).reveal).toBe(true);
    state = previewReducer(state, { type: 'PREVIOUS' });
    expect(state.line).toBe(2);
    expect(openingVisual(state.line)).toEqual({ reveal: true, cue: 'wake', wakePhase: 'pain' });
    const paused = previewReducer(state, { type: 'PAUSE' });
    expect(previewReducer(paused, { type: 'PREVIOUS' })).toEqual(paused);
  });

  it('keeps credits concise and includes horror influences in both languages', () => {
    expect(copy['pt-BR'].extrasPages[1].paragraphs).toHaveLength(2);
    expect(copy.en.extrasPages[1].paragraphs).toHaveLength(2);
    expect(copy['pt-BR'].extrasPages[2].paragraphs[0]).toContain('terror');
    expect(copy.en.extrasPages[2].paragraphs[0]).toContain('horror');
  });

  it('bounds the extras pages and returns to the menu', () => {
    let state = previewReducer(initialPreview, { type: 'EXTRAS' });
    state = previewReducer(state, { type: 'EXTRAS_PAGE', page: 9 });
    expect(state.extrasPage).toBe(2);
    state = previewReducer(state, { type: 'BACK' });
    expect(state.overlay).toBe('none');
  });

  it('reserves the pain and dark-cut cues for the four canonical David memories only', () => {
    for (const id of ['MEM-D1', 'MEM-D2', 'MEM-D3', 'MEM-D4']) {
      expect(davidMemoryCue(id, 'pain')).toBe('pain');
      expect(davidMemoryCue(id, 'cut')).toBe('memory-cut');
    }
    expect(davidMemoryCue('AMI-MEMORY', 'cut')).toBe('none');
  });
});

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

  it('keeps the scene dark until the fourth line and reveals it once', () => {
    expect(openingVisual(0)).toEqual({ reveal: false, cue: 'none' });
    expect(openingVisual(1)).toEqual({ reveal: false, cue: 'none' });
    expect(openingVisual(2)).toEqual({ reveal: false, cue: 'pain' });
    expect(openingVisual(3)).toEqual({ reveal: true, cue: 'wake' });
    expect(openingVisual(4)).toEqual({ reveal: true, cue: 'none' });
    expect(openingVisual(5)).toEqual({ reveal: true, cue: 'none' });
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

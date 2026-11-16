export type VisualCue = 'none' | 'pain' | 'wake' | 'memory-cut';
export type Stage = 'menu' | 'chapter' | 'scene' | 'end';
export type Overlay = 'none' | 'pause' | 'language' | 'extras';
export type PreviewState = { stage: Stage; line: number; overlay: Overlay; extrasPage: number };
export type PreviewAction =
  | { type: 'START' | 'ADVANCE' | 'PAUSE' | 'LANGUAGE' | 'EXTRAS' | 'BACK' | 'MAIN_MENU' }
  | { type: 'EXTRAS_PAGE'; page: number };

export const initialPreview: PreviewState = { stage: 'menu', line: 0, overlay: 'none', extrasPage: 0 };
export const OPENING_LINE_COUNT = 5;
export const CHAPTER_DURATION_MS = 2400;

export function previewReducer(state: PreviewState, action: PreviewAction): PreviewState {
  switch (action.type) {
    case 'START':
      return state.stage === 'menu' && state.overlay === 'none'
        ? { ...initialPreview, stage: 'chapter' }
        : state;
    case 'ADVANCE':
      if (state.overlay !== 'none') return state;
      if (state.stage === 'chapter') return { ...state, stage: 'scene' };
      if (state.stage !== 'scene') return state;
      return state.line === OPENING_LINE_COUNT - 1
        ? { ...state, stage: 'end' }
        : { ...state, line: state.line + 1 };
    case 'PAUSE':
      return (state.stage === 'chapter' || state.stage === 'scene') && state.overlay === 'none'
        ? { ...state, overlay: 'pause' }
        : state;
    case 'LANGUAGE':
      return state.stage === 'menu' || state.overlay === 'pause'
        ? { ...state, overlay: 'language' }
        : state;
    case 'EXTRAS':
      return state.stage === 'menu' && state.overlay === 'none'
        ? { ...state, overlay: 'extras', extrasPage: 0 }
        : state;
    case 'EXTRAS_PAGE':
      return state.overlay === 'extras'
        ? { ...state, extrasPage: Math.max(0, Math.min(2, action.page)) }
        : state;
    case 'BACK':
      return { ...state, overlay: state.overlay === 'language' && state.stage !== 'menu' ? 'pause' : 'none' };
    case 'MAIN_MENU':
      return initialPreview;
  }
}

export function openingVisual(line: number): { reveal: boolean; cue: VisualCue } {
  if (line === 1) return { reveal: false, cue: 'pain' };
  if (line === 2) return { reveal: true, cue: 'wake' };
  return { reveal: line > 2, cue: 'none' };
}

// Only David's canonical memory events use this visual transition.
// The narrative engine will schedule the cut after the authored pain line.
export function davidMemoryCue(eventId: string, phase: 'pain' | 'cut'): VisualCue {
  if (!['MEM-D1', 'MEM-D2', 'MEM-D3', 'MEM-D4'].includes(eventId)) return 'none';
  return phase === 'pain' ? 'pain' : 'memory-cut';
}

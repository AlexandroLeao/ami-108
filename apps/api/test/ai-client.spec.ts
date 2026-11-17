import { callGeneration, expectedText, generationRequest } from '../src/game/ai-client';
import { advanceNarrative, projectNarrative, startNarrative } from '../src/narrative/engine';
import { randomUUID } from 'node:crypto';

describe('internal AI request authorization', () => {
  it('reserves a new intro and new dog slot only, preserving the existing wording', () => {
    let state = startNarrative('pt-BR');
    let introCount = 0;
    for (let i = 0; i < 120 && projectNarrative(state).phase !== 'ENCOUNTER'; i++) {
      const next = advanceNarrative(state, projectNarrative(state).actions[0].id, state.revision);
      const request = generationRequest(state, next, randomUUID());
      if (request) {
        introCount++;
        expect(request.questionId).toBe('INTRO-RANDOM');
        expect(expectedText(request, next)).toBe('Os polvos têm três corações.');
      }
      state = next;
    }
    expect(introCount).toBe(1);
    const action = projectNarrative(state).actions.find(x => x.kind === 'CONSULT')!;
    const next = advanceNarrative(state, action.id, state.revision, () => 0);
    const req = generationRequest(state, next, randomUUID())!;
    expect(req).toMatchObject({ questionId: 'Q-DOG', category: 'CORRECT', factIds: ['DOG-VISION','DOG-HEARING','DOG-WAIT'] });
    expect(expectedText(req, next)).toContain('Permaneça imóvel');
    expect(generationRequest(next, advanceNarrative(next, projectNarrative(next).actions[0].id, next.revision), randomUUID())).toBeNull();
  });
  it('falls back without configuration and never sends a request', async () => {
    const token = process.env.AMI_AI_INTERNAL_TOKEN;
    delete process.env.AMI_AI_INTERNAL_TOKEN;
    try {
      expect(await callGeneration({requestId:randomUUID(),questionId:'INTRO-RANDOM',category:'RANDOM',locale:'en',factIds:['INTRO-OCTOPUS'],deadlineMs:2500},'Octopuses have three hearts.',new Date(Date.now()+200))).toEqual({generationStatus:'FALLBACK_REQUIRED',generationReason:'UNAVAILABLE'});
    } finally { if (token !== undefined) process.env.AMI_AI_INTERNAL_TOKEN = token; }
  });
});

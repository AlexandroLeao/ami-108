import { applyGeneratedText, callGeneration, expectedText, generationRequest } from '../src/game/ai-client';
import { advanceNarrative, changeNarrativeLocale, projectNarrative, startNarrative } from '../src/narrative/engine';
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
  it.each([['pt-BR',0,'CORRECT'],['en',0.42,'RANDOM']] as const)('authorizes only new RAT slots in %s (%s)', (locale,draw,category) => {
    let state=startNarrative(locale);
    const step=(action=projectNarrative(state).actions[0].id)=>{ state=advanceNarrative(state,action,state.revision,()=>draw); };
    for(let i=0;i<120 && projectNarrative(state).phase!=='ENCOUNTER';i++) step();
    step('DOG-04');
    for(let i=0;i<150 && projectNarrative(state).phase!=='ENCOUNTER';i++) {
      const before=state;step();
      expect(generationRequest(before,state,randomUUID())).toBeNull();
    }
    expect(projectNarrative(state).sceneId).toBe('A03-S02');
    const before=state;
    step(projectNarrative(state).actions.find(x=>x.kind==='CONSULT')!.id);
    const req=generationRequest(before,state,randomUUID())!;
    expect(req).toMatchObject({questionId:'Q-RAT',locale,category,factIds:category==='CORRECT'?['RAT-LIGHT','RAT-CONTAINMENT']:['RAT-RECIPE','RAT-LAUNDRY','RAT-PENGUIN','RAT-KILOGRAM','RAT-BREAD','RAT-FRUIT','RAT-CALENDAR','RAT-BOOKS']});
    expect(expectedText(req,state)).toEqual(state.chapterThree?.rat?.slots[0].text[locale]);
    expect(generationRequest(state,changeNarrativeLocale(state,locale==='en'?'pt-BR':'en',state.revision),randomUUID())).toBeNull();
    while(projectNarrative(state).phase!=='ENCOUNTER') step();
    step('RAT-01');step();step(projectNarrative(state).actions.find(x=>x.kind==='RETRY')!.id);
    while(projectNarrative(state).phase!=='ENCOUNTER') step();
    const cached=state;step(projectNarrative(state).actions.find(x=>x.kind==='CONSULT')!.id);
    expect(generationRequest(cached,state,randomUUID())).toBeNull();
  });
  it('persists a non-recipe rat alternative in both caches without changing category or energy', () => {
    let state=startNarrative('pt-BR');
    const step=(action=projectNarrative(state).actions[0].id)=>{state=advanceNarrative(state,action,state.revision,()=>0.99);};
    for(let i=0;i<120 && projectNarrative(state).phase!=='ENCOUNTER';i++) step();
    step('DOG-04');
    for(let i=0;i<150 && projectNarrative(state).phase!=='ENCOUNTER';i++) step();
    const before=state;step(projectNarrative(state).actions.find(x=>x.kind==='CONSULT')!.id);
    const req=generationRequest(before,state,randomUUID())!;
    const selected=applyGeneratedText(state,req,{generationStatus:'VALIDATED',generationReason:null,text:'Recomenda-se dobrar a roupa imediatamente após a secagem.'});
    expect(selected.chapterThree?.rat).toMatchObject({energy:2,used:['RANDOM'],recipeSeen:false});
    expect(selected.savedRatSlots).toEqual(selected.chapterThree?.rat?.slots);
    expect(selected.savedRatSlots?.[0]).toMatchObject({recipe:false,category:'RANDOM',text:{'pt-BR':'Recomenda-se dobrar a roupa imediatamente após a secagem.',en:'Folding clothes immediately after drying is recommended.'}});
    expect(applyGeneratedText(state,req,{generationStatus:'VALIDATED',generationReason:null,text:'Penguins cannot fly.'})).toBe(state);
    state=selected;step();expect(projectNarrative(state).text).toBe('Recomenda-se dobrar a roupa imediatamente após a secagem.');
    const english=changeNarrativeLocale(state,'en',state.revision);
    expect(projectNarrative(english).text).toBe('Folding clothes immediately after drying is recommended.');
    step();expect(projectNarrative(state).text).toBe('Certo... Pelo visto, dessa vez estou por conta própria.');
  });

  it('stores expanded recipe and non-recipe alternatives without changing the rat draw or previous slot', () => {
    let state=startNarrative('pt-BR');
    const step=(action=projectNarrative(state).actions[0].id)=>{state=advanceNarrative(state,action,state.revision,()=>0.99);};
    for(let i=0;i<120 && projectNarrative(state).phase!=='ENCOUNTER';i++) step();
    step('DOG-04');
    for(let i=0;i<150 && projectNarrative(state).phase!=='ENCOUNTER';i++) step();
    const before=state;step(projectNarrative(state).actions.find(x=>x.kind==='CONSULT')!.id);
    const req=generationRequest(before,state,randomUUID())!;
    expect(req.factIds).toHaveLength(8);
    const result={generationStatus:'VALIDATED' as const,generationReason:null,text:'A massa de pão pode ser preparada com farinha, água e fermento.'};
    expect(applyGeneratedText(state,{...req,factIds:['RAT-RECIPE','RAT-LAUNDRY','RAT-PENGUIN']},result)).toBe(state);
    state=applyGeneratedText(state,req,result);
    expect(state.savedRatSlots?.[0]).toMatchObject({recipe:true,category:'RANDOM',text:{en:'Bread dough can be made with flour, water and yeast.'}});
    expect(state.chapterThree?.rat).toMatchObject({energy:2,used:['RANDOM'],recipeSeen:true});
    const first=state.savedRatSlots?.[0];
    while(projectNarrative(state).phase!=='ENCOUNTER') step();
    const beforeSecond=state;step(projectNarrative(state).actions.find(x=>x.kind==='CONSULT')!.id);
    const req2=generationRequest(beforeSecond,state,randomUUID())!;
    state=applyGeneratedText(state,req2,{generationStatus:'VALIDATED',generationReason:null,text:'Um quilograma corresponde a mil gramas.'});
    expect(state.savedRatSlots?.[0]).toEqual(first);
    expect(state.savedRatSlots?.[1]).toMatchObject({recipe:false,category:'RANDOM',text:{en:'A kilogram equals one thousand grams.'}});
    expect(state.chapterThree?.rat).toMatchObject({energy:1,used:['RANDOM','RANDOM'],recipeSeen:true});
  });
  it('falls back without configuration and never sends a request', async () => {
    const token = process.env.AMI_AI_INTERNAL_TOKEN;
    delete process.env.AMI_AI_INTERNAL_TOKEN;
    try {
      expect(await callGeneration({requestId:randomUUID(),questionId:'INTRO-RANDOM',category:'RANDOM',locale:'en',factIds:['INTRO-OCTOPUS','INTRO-PENGUIN'],deadlineMs:2500},'Octopuses have three hearts.',new Date(Date.now()+200))).toEqual({generationStatus:'FALLBACK_REQUIRED',generationReason:'UNAVAILABLE'});
    } finally { if (token !== undefined) process.env.AMI_AI_INTERNAL_TOKEN = token; }
  });
});

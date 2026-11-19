// AMI-009: isolated Chapter 5 progression, grounded in Master v1.13 §7.
// Engine owns shared revision, locale, events and diagnostics; this domain owns the ship and encounter.
import { local, type Locale, type Localized } from './catalog';
import type { Diagnostics, NarrativeAction } from './engine';
import { BOAR, BOAR_QUESTION, HANGAR_DIALOGUE, LAUNCH_CONSULTED, LAUNCH_NO_CONSULT, LAUNCH_NO_RECIPE, ORBIT_DIALOGUE, FINAL_TITLE } from './chapter-five-catalog';
import { startEncounter, consultEncounter, chooseEncounter, retryEncounter, type EncounterState, type Slot } from './encounter';

const hangar = (id:string) => 'A05-S01/'+id;
const orbit = (id:string) => 'A05-S02/'+id;
export const FIVE_CARD = hangar('CHAPTER_CARD');
const checkpointId = hangar('L06');
const decision = (n:number) => hangar('DECISION-'+n);
const DEAD = hangar('DEATH'), DEAD_CARD = hangar('DEAD-CARD'), SUCCESS = hangar('SUCCESS');
const TITLE = orbit('ENDING'), CREDITS = orbit('CREDITS');
type Event = 'E-SHIP'|'CP-BOAR'|'E-LAUNCH'|'E-COMPLETE';
type Ship = Readonly<{powered:boolean; gateOpen:boolean; enginesOn:boolean; launched:boolean}>;
const unpowered:Ship={powered:false,gateOpen:false,enginesOn:false,launched:false};
const prepared:Ship={...unpowered,powered:true};
const launched:Ship={powered:true,gateOpen:true,enginesOn:true,launched:true};
type Checkpoint=Readonly<{stepId:string;diagnostics:Diagnostics;ship:Ship;events:readonly Event[]}>;
export type ChapterFiveProgress=Readonly<{
  stepId:string;reviewStepId:string|null;revision:number;locale:Locale;
  diagnostics:Diagnostics;events:readonly Event[];trail:readonly string[];
  ship:Ship;recipeSeenInJourney:boolean;retainedSlots:readonly Slot[];
  boar?:EncounterState;checkpoint?:Checkpoint;
}>;
const invalid=():never=>{throw Error('INVALID_CHAPTER_FIVE_STATE');};
const noDraw=():never=>{throw Error('BOAR_MUST_NOT_DRAW_RANDOM');};
const restored=(d:Diagnostics)=>d.energy===3&&d.med===100&&d.bio===100&&d.hist===100&&d.personal===100&&d.personalUnlocked;
export function beginFive(diagnostics:Diagnostics,previousEvents:readonly string[],locale:Locale,revision:number,recipeSeenInJourney:boolean,retainedSlots:readonly Slot[]=[]):ChapterFiveProgress {
  if(!restored(diagnostics)||!['F3','E-FAMILY','E-PAST-RESTORED','E-ESCAPE-ROUTE'].every(e=>previousEvents.includes(e))) throw Error('CHAPTER_FIVE_NOT_READY');
  if(retainedSlots.length>3 || retainedSlots.some((s,i)=>s.index!==i+1||s.category!=='CORRECT'||s.recipe||s.text['pt-BR']!==BOAR.correct['pt-BR']||s.text.en!==BOAR.correct.en)) return invalid();
  return {stepId:FIVE_CARD,reviewStepId:null,revision,locale,diagnostics,events:[],trail:[FIVE_CARD],ship:unpowered,recipeSeenInJourney,retainedSlots};
}
const hangarSteps=[FIVE_CARD,...HANGAR_DIALOGUE.slice(0,4).map(b=>hangar(b.id)),hangar('REPAIR'),...HANGAR_DIALOGUE.slice(4).map(b=>hangar(b.id))];
const orbitSteps=[orbit('NAVIGATION'),...ORBIT_DIALOGUE.map(b=>orbit(b.id)),orbit('DEPARTURE'),TITLE,CREDITS];
const barrier=(id:string)=>id.startsWith(hangar('DECISION-'))||[DEAD,DEAD_CARD,SUCCESS,CREDITS].includes(id);
function visible(s:ChapterFiveProgress) {
  const id=s.reviewStepId??s.stepId;
  const index=s.trail.indexOf(id);
  if(index<0||s.trail.at(-1)!==s.stepId||(s.reviewStepId&&id===s.stepId))return invalid();
  return {id,index};
}
function actions(s:ChapterFiveProgress):NarrativeAction[]{
  const {id,index}=visible(s);
  const a=(suffix:string,kind:NarrativeAction['kind'],label:Localized):NarrativeAction=>({id:suffix,kind,label:label[s.locale]});
  const next=(kind:NarrativeAction['kind']='CONTINUE',label=local('Continuar','Continue'))=>a(id+'/NEXT',kind,label);
  const back=index>0&&!barrier(id)&&!barrier(s.trail[index-1])?[a(id+'/PREVIOUS','PREVIOUS',local('Fala anterior','Previous dialogue'))]:[];
  if(s.reviewStepId)return [next(),...back];
  if(id===CREDITS)return [];
  if(id===DEAD_CARD)return [a(id+'/RETRY','RETRY',local('Retornar ao checkpoint','Return to checkpoint'))];
  if(id.startsWith(hangar('DECISION-'))){
    const e=s.boar??invalid();
    if(e.phase!=='ACTIVE')return invalid();
    const choices=BOAR.choices.map(c=>a(c.id,'CHOOSE',c.label));
    if(e.energy>0&&e.used.length<3)choices.unshift(a(id+'/CONSULT','CONSULT',local('Consultar AMI (−1 energia)','Consult AMI (−1 energy)')));
    return choices;
  }
  if(id===hangar('L04'))return [next('INTERACT',local('Instalar célula','Install cell')),...back];
  return [next(),...back];
}
export function viewFive(s:ChapterFiveProgress){
  const {id}=visible(s);
  let phase:'CHAPTER_CARD'|'NARRATIVE'|'ENCOUNTER'|'DEAD'='NARRATIVE';
  let asset:'CENA-09'|'CENA-10'|null=null;
  let speaker:string|null=null;
  let text:Localized;
  let narration=false;
  if(id===FIVE_CARD){phase='CHAPTER_CARD';text=local('CAPÍTULO 5 — DE NADA, BOBO','CHAPTER 5 — YOU’RE WELCOME, BOBO');}
  else if(id===hangar('REPAIR')){text=local('Você instala a célula de reposição na nave. Os controles voltam a funcionar.','You install the replacement cell in the ship. The controls come back online.');narration=true;}
  else if(id.startsWith(hangar('DECISION-'))){phase='ENCOUNTER';text=local('Escolha uma ação.','Choose an action.');asset='CENA-09';}
  else if(id===DEAD||id===SUCCESS){text=(BOAR.choices.find(c=>c.id===s.boar?.selected)??invalid()).consequence;narration=true;if(id===DEAD)phase='DEAD';}
  else if(id===DEAD_CARD){phase='DEAD';text=local('VOCÊ NÃO SOBREVIVEU','YOU DID NOT SURVIVE');}
  else if(id===orbit('NAVIGATION')){text=local('Em órbita, você examina as informações de navegação. Agora se lembra do contato comercial e define a rota.','In orbit, you examine the navigation data. You now remember the commercial contact and set the course.');asset='CENA-10';narration=true;}
  else if(id===orbit('DEPARTURE')){text=local('AMI sorri em sua tela. A nave se afasta do planeta enquanto ele volta a cantar aquela melodia. Você não o interrompe.','AMI smiles on his screen. The ship moves away from the planet as he begins singing that melody again. You do not interrupt him.');asset='CENA-10';narration=true;}
  else if(id===TITLE){text=FINAL_TITLE;}
  else if(id===CREDITS){text=local('AMI-108 — Créditos','AMI-108 — Credits');}
  else {
    const key=id.split('/')[1];
    const slotBeat=id.match(/^A05-S01\/(Q|ANSWER)-(\d)$/);
    if(slotBeat){
      const slot=s.boar?.slots.find(x=>x.index===Number(slotBeat[2]))??invalid();
      const beat=slotBeat[1]==='Q'?BOAR_QUESTION:{speaker:'AMI-108',text:slot.text};
      speaker=beat.speaker;text=beat.text;asset='CENA-09';
    }else{
      const beat=(id.startsWith('A05-S02/')?ORBIT_DIALOGUE:[...HANGAR_DIALOGUE,...LAUNCH_CONSULTED,...LAUNCH_NO_CONSULT]).find(b=>b.id===key)??invalid();
      speaker=beat.speaker;text=key==='B3'&&!s.recipeSeenInJourney?LAUNCH_NO_RECIPE:beat.text;
      if(id.startsWith('A05-S02/'))asset='CENA-10';
      else if(/^L(06|07|08|09|10|11|12)$/.test(key))asset='CENA-09';
    }
  }
  return {stepId:id,revision:s.revision,locale:s.locale,phase,speaker,text:text[s.locale],asset,narration,diagnostics:s.diagnostics,actions:actions(s),complete:s.events.includes('E-COMPLETE')};
}
function move(s:ChapterFiveProgress,id:string,patch:Partial<Pick<ChapterFiveProgress,'boar'|'checkpoint'|'ship'|'diagnostics'|'events'|'retainedSlots'>>={}):ChapterFiveProgress{
  return {...s,...patch,stepId:id,reviewStepId:null,revision:s.revision+1,trail:[...s.trail,id]};
}
function append(s:ChapterFiveProgress,...events:Event[]):readonly Event[]{return [...new Set([...s.events,...events])];}
export function advanceFive(s:ChapterFiveProgress,actionId:string,revision:number):ChapterFiveProgress{
  if(revision!==s.revision)throw Error('STALE_REVISION');
  const {id,index}=visible(s);
  const a=actions(s).find(x=>x.id===actionId);
  if(!a)throw Error('ACTION_NOT_ALLOWED');
  if(a.kind==='PREVIOUS')return {...s,reviewStepId:s.trail[index-1],revision:revision+1};
  if(s.reviewStepId){const target=s.trail[index+1];return {...s,reviewStepId:target===s.stepId?null:target,revision:revision+1};}
  if(a.kind==='RETRY'){
    const cp=s.checkpoint??invalid(),boar=retryEncounter(s.boar??invalid());
    return {...s,stepId:cp.stepId,reviewStepId:null,revision:revision+1,trail:[cp.stepId],diagnostics:cp.diagnostics,events:cp.events,ship:cp.ship,boar,retainedSlots:boar.slots};
  }
  if(a.kind==='CONSULT'){
    const r=consultEncounter(s.boar??invalid(),BOAR,noDraw);
    return move(s,hangar('Q-'+r.slot.index),{boar:r.state,retainedSlots:r.state.slots,diagnostics:{...s.diagnostics,energy:r.state.energy}});
  }
  if(a.kind==='CHOOSE'){
    const r=chooseEncounter(s.boar??invalid(),BOAR,actionId);
    return r.state.phase==='SUCCESS'?move(s,SUCCESS,{boar:r.state,ship:launched,events:append(s,'E-LAUNCH')}):move(s,DEAD,{boar:r.state});
  }
  if(id===DEAD)return move(s,DEAD_CARD);
  if(id===SUCCESS)return move(s,hangar((s.boar??invalid()).used.length?'B1':'C1'));
  const slotBeat=id.match(/^A05-S01\/(Q|ANSWER)-(\d)$/);
  if(slotBeat)return move(s,slotBeat[1]==='Q'?hangar('ANSWER-'+slotBeat[2]):decision(Number(slotBeat[2])));
  if(id===hangar('L04'))return move(s,hangar('REPAIR'),{ship:prepared,events:append(s,'E-SHIP')});
  if(id===hangar('L05')){
    if(!restored(s.diagnostics)||!s.events.includes('E-SHIP')||!s.ship.powered||s.ship.enginesOn||s.ship.gateOpen)return invalid();
    const events=append(s,'CP-BOAR');
    const boar={...startEncounter(BOAR,s.diagnostics.energy),slots:s.retainedSlots};
    return move(s,checkpointId,{boar,events,checkpoint:{stepId:checkpointId,diagnostics:s.diagnostics,ship:s.ship,events}});
  }
  if(id===hangar('L12'))return move(s,decision(0));
  const h=hangarSteps.indexOf(id);
  if(h>=0&&h<hangarSteps.length-1)return move(s,hangarSteps[h+1]);
  const branch=id.match(/^A05-S01\/([BC])(\d)$/);
  if(branch){const end=branch[1]==='B'?6:2;return move(s,Number(branch[2])===end?orbitSteps[0]:hangar(branch[1]+(Number(branch[2])+1)));}
  const o=orbitSteps.indexOf(id);
  if(o>=0&&o<orbitSteps.length-1){
    const target=orbitSteps[o+1];
    return move(s,target,target===TITLE?{events:append(s,'E-COMPLETE')}:{});
  }
  return invalid();
}

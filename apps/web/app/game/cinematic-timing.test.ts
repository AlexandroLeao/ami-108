import { describe, expect, it } from 'vitest';
import { beatKey, countF3, energyMotion, imageGateMs, hasMemorySignal, hasDavidMemoryShiver, showEnergyIndicator } from './cinematic-timing';
import type { CampaignView } from './client';

const view = (id:string,cue:CampaignView['cue'],asset=true):CampaignView => ({
  revision:0,locale:'pt-BR',phase:'NARRATIVE',chapter:1,chapterTitle:'',sceneId:id.split('/')[0],
  speaker:null,text:'',asset:asset?{url:'/api/game/asset?key=CENA-01',alt:''}:null,
  diagnostics:null,actions:[{id:id+'/NEXT',kind:'CONTINUE',label:'Continue'}],pending:false,cue,narration:false,information:false,
});
describe('owner-requested cinematic timing',()=>{
  it.each(['A01-S01/L02','A01-S02/STREET-REVEAL','A01-S03/REVEAL','A01-S03/MEM-D1-RETURN','A02-S02/L15','A03-S01/RETURN-00'])('gates wake only on %s',id=>{
    expect(imageGateMs(view(id,'wake'))).toBe(1450);
  });
  it('keeps unrelated fades and dialogue unchanged and never gates an absent image',()=>{
    expect(imageGateMs(view('A02-S02/L01','fade-in'))).toBe(0);
    expect(imageGateMs(view('A03-S01/L06a','fade-in'))).toBe(0);
    expect(imageGateMs(view('A03-S01/L01','fade-in'))).toBe(750);
    expect(imageGateMs(view('A03-S01/L01','fade-in',false))).toBe(0);
    expect(imageGateMs(view('A02-S01/L01','startle'))).toBe(1000);
    expect(imageGateMs(view('A03-S02/L01','startle'))).toBe(1350);
    expect(imageGateMs(view('A04-S02/FB-A1/02','crt-reveal'))).toBe(1800);
    expect(imageGateMs(view('A04-S02/FB-A3-IMAGE','crt-startle'))).toBe(1800);
    expect(imageGateMs(view('A04-S02/F09','disoriented'))).toBe(1450);
    expect(beatKey(view('A04-S02/F09','disoriented'))).toBe('A04-S02/F09/NEXT');
  });
  it('gates only the original boar reveal until the artwork and startle finish',()=>{
    expect(imageGateMs(view('A05-S01/L06','startle'))).toBe(1350);
    expect(imageGateMs(view('A05-S01/L06','startle',false))).toBe(0);
    expect(imageGateMs(view('A05-S01/L06b','none'))).toBe(0);
    expect(imageGateMs(view('A05-S01/LOOK','none',false))).toBe(0);
  });
  it('pulses exactly the three tutorial beats and settles only on return',()=>{
    for(const id of ['TUTORIAL','TUTORIAL-b','TUTORIAL-c']) expect(energyMotion(view('A01-S03/'+id,'none',false))).toBe('tutorial');
    expect(energyMotion(view('A01-S03/RETURN-STREET','none',false))).toBe('settle');
    expect(energyMotion(view('A01-S03/L38','none'))).toBe('none');
  });
  it('retains CRT signal only on the two Chapter 4 AMI memory images',()=>{
    const memory={...view('A04-S02/FB-A1/02','crt-reveal'),chapter:4,phase:'FLASHBACK' as const};
    for(const key of ['CENA-08','CENA-12']) {
      const asset={url:'/api/game/asset?key='+key,alt:''};
      expect(hasMemorySignal({...memory,asset})).toBe(true);
      expect(hasMemorySignal({...memory,asset,cue:'none'})).toBe(true);
      expect(hasMemorySignal({...memory,asset,chapter:3})).toBe(false);
    }
    expect(hasMemorySignal({...memory,asset:null})).toBe(false);
    expect(hasMemorySignal({...memory,asset:{url:'/api/game/asset?key=CENA-11',alt:''}})).toBe(false);
  });
  it('shivers only the requested David memory range, without changing scene cues or gates',()=>{
    const memory=(id:string,cue:CampaignView['cue']='none')=>({...view('A04-S02/'+id,cue,false),chapter:4,phase:'FLASHBACK' as const});
    for(const id of ['FB-D4','FB-D4-SEARCH','FB-D4-FIND','F00a','F00b','F01','F02','F03','F04','F05','F06','F07','F07b','F08','FB-D5','F09','FB-D5-END','FB-D5-RESTORED','FB-D1-RECALL']) expect(hasDavidMemoryShiver(memory(id))).toBe(true);
    for(const id of ['MEM-D4','MEM-D4-APPROACH','FB-A1/02','FAMILY-END','L08','L09','PAST-RESTORED','DEPART']) expect(hasDavidMemoryShiver(memory(id))).toBe(false);
    expect(hasDavidMemoryShiver({...memory('FB-D4'),chapter:3})).toBe(false);
    expect(hasDavidMemoryShiver({...memory('FB-D4'),phase:'NARRATIVE'})).toBe(false);
    expect(hasDavidMemoryShiver(memory('FB-D5-END','fade-black'))).toBe(true);
    expect(imageGateMs(memory('FB-D5-END','fade-black'))).toBe(0);
    const betrayal={...memory('F09','disoriented'),asset:{url:'/api/game/asset?key=CENA-11',alt:''}};
    expect(imageGateMs(betrayal)).toBe(1450);
  });
  it('hides energy throughout Chapter 4 while preserving existing HUD conditions elsewhere',()=>{
    for(const id of ['FB-A1/02','FB-A3-IMAGE','F09']) {
      expect(showEnergyIndicator({...view('A04-S02/'+id,'none'),chapter:4,phase:'FLASHBACK'})).toBe(false);
    }
    expect(showEnergyIndicator({...view('A04-S01/F3-INDEXES','f3-count',false),chapter:4,information:true})).toBe(false);
    for(const chapter of [1,2,3,5]) {
      expect(showEnergyIndicator({...view('A01-S01/L02','wake'),chapter})).toBe(true);
      expect(showEnergyIndicator({...view('A01-S01/L02','none',false),chapter})).toBe(false);
    }
    expect(showEnergyIndicator({...view('A01-S03/TUTORIAL','energy-reveal',false),information:true})).toBe(true);
    expect(showEnergyIndicator(view('A01-S03/RETURN-STREET','none',false))).toBe(true);
  });
  it('counts from the actual F2 indexes to precisely 100 without modifying saved state',()=>{
    const text='MED-01 — 100%\nBIO-02 — 100%\nHIST-03 — 100%';
    expect(countF3(text,0)).toBe('MED-01 — 75%\nBIO-02 — 85%\nHIST-03 — 78%');
    expect(countF3(text,.5)).toBe('MED-01 — 87%\nBIO-02 — 92%\nHIST-03 — 89%');
    expect(countF3(text,1)).toBe(text);
    expect(countF3(text,2)).toBe(text);
  });
});

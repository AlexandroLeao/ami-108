import { CHAPTER_FOUR_GATES, AMI_MEMORY_FRAGMENTS, BETRAYAL_DIALOGUE, BETRAYAL_RETURN, DAVID_MEMORY_TRIGGER, FAMILY_RETURN, FINAL_RESTORATION, MANUAL_RECORDS, RESTORATION_DIALOGUE } from '../src/narrative/chapter-four-catalog';

describe('Chapter 4 server-only source catalog', () => {
  it('preserves the canonical dialogue and manual sequence in both languages', () => {
    expect(RESTORATION_DIALOGUE.map(x => x.id)).toEqual(['L01', 'L02', 'L04', 'L06']);
    expect(MANUAL_RECORDS).toHaveLength(3);
    expect(MANUAL_RECORDS[1]).toEqual({ 'pt-BR': 'ASSISTENTE MODULAR INFANTIL', en: 'AUTOMATED MINDER FOR INFANTS' });
    expect(FAMILY_RETURN.map(x => x.id)).toEqual(['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07']);
    expect(DAVID_MEMORY_TRIGGER[0].id).toBe('MEM-D4');
    expect(BETRAYAL_DIALOGUE.map(x => x.id)).toEqual(['F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08', 'F09']);
    expect(BETRAYAL_DIALOGUE[8].text).toEqual({ 'pt-BR': '... São apenas negócios.', en: "... It's just business." });
    expect(BETRAYAL_RETURN.map(x => x.id)).toEqual(['L08', 'L09', 'L10', 'L11', 'L12', 'L13']);
    for (const beat of [...RESTORATION_DIALOGUE, ...FAMILY_RETURN, ...DAVID_MEMORY_TRIGGER, ...BETRAYAL_DIALOGUE, ...BETRAYAL_RETURN]) {
      expect(beat.text['pt-BR'].trim()).not.toBe('');
      expect(beat.text.en.trim()).not.toBe('');
    }
  });

  it('retains the four family fragments, approved art and interrupted final record', () => {
    expect(AMI_MEMORY_FRAGMENTS.map(x => [x.id, x.asset])).toEqual([
      ['FB-A1', 'CENA-08'], ['FB-A2', 'CENA-08'], ['FB-A3', 'CENA-12'], ['FB-A4', null],
    ]);
    expect(AMI_MEMORY_FRAGMENTS[0].dialogue.map(x => x.text['pt-BR'])).toEqual(['Bobo!', 'Robô.', 'Bobo!']);
    expect(AMI_MEMORY_FRAGMENTS[3].dialogue.map(x => x.text.en)).toEqual(['BOBO, HELP!']);
  });

  it('orders the restoration, manual, family and David memory gates without premature reveals', () => {
    const index = (gate: typeof CHAPTER_FOUR_GATES[number]) => CHAPTER_FOUR_GATES.indexOf(gate);
    expect(index('A04-S01/INSTALL')).toBeLessThan(index('F3'));
    expect(index('F3')).toBeLessThan(index('UI-MANUAL'));
    expect(index('UI-MANUAL')).toBeLessThan(index('FB-A1'));
    expect(index('FB-A4')).toBeLessThan(index('E-FAMILY'));
    expect(index('E-FAMILY')).toBeLessThan(index('MEM-D4'));
    expect(index('MEM-D4')).toBeLessThan(index('FB-D4'));
    expect(index('FB-D5')).toBeLessThan(index('E-BETRAYAL'));
    expect(index('E-PAST-RESTORED')).toBeLessThan(index('A05-S01/CHAPTER_CARD'));
    expect(new Set(CHAPTER_FOUR_GATES).size).toBe(CHAPTER_FOUR_GATES.length);
  });

  it('defines F3 with restored energy and all personal memory unlocked', () => {
    expect(FINAL_RESTORATION).toEqual({ energy: 3, med: 100, bio: 100, hist: 100, personal: 100, personalUnlocked: true });
  });
});

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OPENING_ASSETS } from '../src/narrative/catalog';
import { readSceneArtwork } from '../src/game/scene-assets';

describe('approved private scene artwork', () => {
  const sceneIds = Object.keys(OPENING_ASSETS);

  it('covers the exact frozen twelve-scene inventory', () => {
    expect(sceneIds).toEqual(Array.from({ length: 12 }, (_, i) => `CENA-${String(i + 1).padStart(2, '0')}`));
  });

  it.each(sceneIds)('reads %s without cwd dependency or changing its bytes', async (id) => {
    const expected = await readFile(join(__dirname, '..', 'assets', 'scenes', id + '.png'));
    const actual = await readSceneArtwork(id);
    expect(actual).toEqual(expected);
    expect(actual.subarray(0, 8)).toEqual(Buffer.from('89504e470d0a1a0a', 'hex'));
  });

  it.each(['CENA-00', 'CENA-13', '../CENA-01', '__proto__', ''])('rejects unapproved key %s', async (id) => {
    await expect(readSceneArtwork(id)).rejects.toThrow('Unknown scene artwork');
  });
});

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { OpeningAsset } from '../narrative/catalog';

// Literal, module-relative paths are discoverable by Node File Trace on Vercel.
// The game controller authorizes the current asset before calling this loader.
// Keep each of the 12 approved images private to the API function.
const readers: Readonly<Record<OpeningAsset, () => Promise<Buffer>>> = {
  'CENA-01': () => readFile(join(__dirname, '../../assets/scenes/CENA-01.png')),
  'CENA-02': () => readFile(join(__dirname, '../../assets/scenes/CENA-02.png')),
  'CENA-03': () => readFile(join(__dirname, '../../assets/scenes/CENA-03.png')),
  'CENA-04': () => readFile(join(__dirname, '../../assets/scenes/CENA-04.png')),
  'CENA-05': () => readFile(join(__dirname, '../../assets/scenes/CENA-05.png')),
  'CENA-06': () => readFile(join(__dirname, '../../assets/scenes/CENA-06.png')),
  'CENA-07': () => readFile(join(__dirname, '../../assets/scenes/CENA-07.png')),
  'CENA-08': () => readFile(join(__dirname, '../../assets/scenes/CENA-08.png')),
  'CENA-09': () => readFile(join(__dirname, '../../assets/scenes/CENA-09.png')),
  'CENA-10': () => readFile(join(__dirname, '../../assets/scenes/CENA-10.png')),
  'CENA-11': () => readFile(join(__dirname, '../../assets/scenes/CENA-11.png')),
  'CENA-12': () => readFile(join(__dirname, '../../assets/scenes/CENA-12.png')),
};

export function readSceneArtwork(id: string): Promise<Buffer> {
  if (!Object.hasOwn(readers, id)) {
    return Promise.reject(new Error('Unknown scene artwork'));
  }
  return readers[id as OpeningAsset]();
}

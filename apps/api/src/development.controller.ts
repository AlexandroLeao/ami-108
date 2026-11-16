import { Controller, Get, Header, NotFoundException, StreamableFile } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

@Controller('development')
export class DevelopmentController {
  @Get('scene')
  @Header('Cache-Control', 'private, no-store')
  async getOpeningScene(): Promise<StreamableFile> {
    // This isolated preview exposes only the already-approved opening artwork.
    // The actual game asset endpoint will authorize the current session and step.
    if (process.env.AMI_DEV_PREVIEW !== '1') {
      throw new NotFoundException();
    }

    try {
      const bytes = await readFile(join(process.cwd(), 'assets', 'scenes', 'CENA-01.png'));
      return new StreamableFile(bytes, { type: 'image/png' });
    } catch {
      throw new NotFoundException();
    }
  }
}

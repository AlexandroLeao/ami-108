import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  live() {
    return { status: 'ok', service: 'api' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const origin = process.env.AI_SERVICE_URL ?? 'http://localhost:8000';
      const response = await fetch(new URL('/health', origin), { signal: AbortSignal.timeout(2500) });
      if (!response.ok) throw new Error('AI service unavailable');
      return { status: 'ready', service: 'api', database: 'ok', ai: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Dependencies not ready');
    }
  }
}

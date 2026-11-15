import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from '../src/health.controller';
import { PrismaService } from '../src/prisma.service';

describe('API health', () => {
  let app: INestApplication;
  const query = jest.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [HealthController], providers: [{ provide: PrismaService, useValue: { $queryRaw: query } }] }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  afterEach(() => { jest.restoreAllMocks(); query.mockReset(); });

  it('reports liveness independently of dependencies', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok', service: 'api' });
  });
  it('reports readiness when dependencies are reachable', async () => {
    query.mockResolvedValue([{ result: 1 }]);
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'));
    await request(app.getHttpServer()).get('/health/ready').expect(200, { status: 'ready', service: 'api', database: 'ok', ai: 'ok' });
  });
  it('returns unavailable when the database is down', async () => {
    query.mockRejectedValue(new Error('unavailable'));
    await request(app.getHttpServer()).get('/health/ready').expect(503);
  });
  it('returns unavailable when the AI service is down', async () => {
    query.mockResolvedValue([{ result: 1 }]);
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('unavailable'));
    await request(app.getHttpServer()).get('/health/ready').expect(503);
  });
});

import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DevelopmentController } from '../src/development.controller';

describe('development preview guard', () => {
  let app: INestApplication;
  const original = process.env.AMI_DEV_PREVIEW;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [DevelopmentController] }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (original === undefined) delete process.env.AMI_DEV_PREVIEW;
    else process.env.AMI_DEV_PREVIEW = original;
    await app.close();
  });

  it('is unavailable when the explicit local preview flag is absent', async () => {
    delete process.env.AMI_DEV_PREVIEW;
    await request(app.getHttpServer()).get('/development/scene').expect(404);
  });

  it('does not expose arbitrary scene identifiers', async () => {
    process.env.AMI_DEV_PREVIEW = '1';
    await request(app.getHttpServer()).get('/development/scene/CENA-12').expect(404);
  });
});

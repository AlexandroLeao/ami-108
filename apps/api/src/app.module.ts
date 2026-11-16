import { Module } from '@nestjs/common';
import { DevelopmentController } from './development.controller';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';

@Module({ controllers: [HealthController, DevelopmentController], providers: [PrismaService] })
export class AppModule {}

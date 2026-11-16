import { Module } from '@nestjs/common';
import { DevelopmentController } from './development.controller';
import { GameController } from './game/game.controller';
import { SessionService } from './game/session.service';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';

@Module({ controllers: [HealthController, DevelopmentController, GameController], providers: [PrismaService, SessionService] })
export class AppModule {}

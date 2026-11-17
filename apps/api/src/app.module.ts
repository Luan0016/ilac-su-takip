import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class AppModule {}

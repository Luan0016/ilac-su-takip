import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard, type AuthUser } from '../auth/jwt.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('me')
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { id: true, email: true, locale: true } });
  }
}

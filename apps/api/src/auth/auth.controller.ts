import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { loginSchema, registerSchema } from '@ilac/shared';
import { z } from 'zod';
import { AuthService, Session } from './auth.service.js';

const refreshSchema = z.object({ refreshToken: z.string().min(1).max(200) });
const jsonSchema = (s: z.ZodType) =>
  z.toJSONSchema(s, { io: 'input' }) as Record<string, unknown>;
const publicSession = ({ refreshTokenId: _, ...session }: Session) => session;

@ApiTags('auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiBody({ schema: jsonSchema(registerSchema) })
  async register(
    @Body({ schema: registerSchema }) body: z.output<typeof registerSchema>,
  ) {
    return publicSession(await this.auth.register(body.email, body.password));
  }

  @Post('login')
  @HttpCode(200)
  @ApiBody({ schema: jsonSchema(loginSchema) })
  async login(
    @Body({ schema: loginSchema }) body: z.output<typeof loginSchema>,
  ) {
    return publicSession(await this.auth.login(body.email, body.password));
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiBody({ schema: jsonSchema(refreshSchema) })
  async refresh(
    @Body({ schema: refreshSchema }) body: z.output<typeof refreshSchema>,
  ) {
    return publicSession(await this.auth.refresh(body.refreshToken));
  }

  @Post('logout')
  @HttpCode(204)
  @ApiBody({ schema: jsonSchema(refreshSchema) })
  async logout(
    @Body({ schema: refreshSchema }) body: z.output<typeof refreshSchema>,
  ) {
    await this.auth.logout(body.refreshToken);
  }
}

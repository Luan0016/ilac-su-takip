import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtGuard } from './jwt.guard.js';
import { ACCESS_TOKEN_TTL } from './tokens.js';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: ACCESS_TOKEN_TTL },
      }),
    }),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: Number(process.env.AUTH_THROTTLE_LIMIT ?? 10) },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard],
  exports: [JwtGuard, JwtModule],
})
export class AuthModule {}

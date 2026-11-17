import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashToken, newRefreshToken, REFRESH_TOKEN_TTL_MS } from './tokens.js';

const INVALID_LOGIN = 'Invalid email or password';
const INVALID_REFRESH = 'Invalid refresh token';
const EMAIL_TAKEN = 'Email already registered';

export type Session = {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  user: { id: string; email: string };
};

@Injectable()
export class AuthService {
  // Verified when the email is unknown so both login failure paths take similar time.
  private readonly dummyHash = argon2.hash('timing-equaliser');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string): Promise<Session> {
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException(EMAIL_TAKEN);
    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({ data: { email, passwordHash, consentAt: new Date() } }).catch((e: { code?: string }) => {
      if (e.code === 'P2002') throw new ConflictException(EMAIL_TAKEN); // concurrent register of the same email
      throw e;
    });
    return this.issue(user);
  }

  async login(email: string, password: string): Promise<Session> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await argon2.verify(await this.dummyHash, password);
      throw new UnauthorizedException(INVALID_LOGIN);
    }
    if (!(await argon2.verify(user.passwordHash, password))) throw new UnauthorizedException(INVALID_LOGIN);
    return this.issue(user);
  }

  async refresh(refreshToken: string): Promise<Session> {
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) }, include: { user: true } });
    if (!row) throw new UnauthorizedException(INVALID_REFRESH);
    // Claim the token atomically; an already revoked token means reuse → revoke every token of that user.
    const claimed = await this.prisma.refreshToken.updateMany({ where: { id: row.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (claimed.count === 0) {
      await this.prisma.refreshToken.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    if (row.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException(INVALID_REFRESH);
    const session = await this.issue(row.user);
    await this.prisma.refreshToken.update({ where: { id: row.id }, data: { replacedById: session.refreshTokenId } });
    return session;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
  }

  private async issue(user: { id: string; email: string }): Promise<Session> {
    const { token, hash } = newRefreshToken();
    const row = await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) },
    });
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id }),
      refreshToken: token,
      refreshTokenId: row.id,
      user: { id: user.id, email: user.email },
    };
  }
}

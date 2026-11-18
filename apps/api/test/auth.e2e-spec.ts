import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './test-app.js';

describe('auth', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  const uniqueEmail = () =>
    `user-${Math.random().toString(36).slice(2)}@example.com`;
  const register = (
    email: string,
    password = 'correct-horse',
    consent: unknown = true,
  ) => http().post('/auth/register').send({ email, password, consent });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('register returns tokens and stores argon2 hash, not plaintext', async () => {
    const email = uniqueEmail();
    const res = await register(email).expect(201);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: { id: expect.any(String), email },
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user.passwordHash).not.toContain('correct-horse');
    expect(user.consentAt).toBeInstanceOf(Date);
  });

  it('register duplicate email (case-insensitive) → 409', async () => {
    const email = uniqueEmail();
    await register(email).expect(201);
    await register(email.toUpperCase()).expect(409);
  });

  it('register without consent:true → 400', async () => {
    await register(uniqueEmail(), 'correct-horse', false).expect(400);
  });

  it('register with short password → 400', async () => {
    await register(uniqueEmail(), 'short').expect(400);
  });

  it('login returns tokens; wrong password → 401 with same message as unknown email', async () => {
    const email = uniqueEmail();
    await register(email).expect(201);
    const ok = await http()
      .post('/auth/login')
      .send({ email: email.toUpperCase(), password: 'correct-horse' })
      .expect(200);
    expect(ok.body.user.email).toBe(email);
    const wrong = await http()
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
    const unknown = await http()
      .post('/auth/login')
      .send({ email: uniqueEmail(), password: 'wrong-password' })
      .expect(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('GET /me without token → 401; with token → user', async () => {
    await http().get('/me').expect(401);
    await http()
      .get('/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
    const email = uniqueEmail();
    const { body } = await register(email).expect(201);
    const me = await http()
      .get('/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200);
    expect(me.body).toEqual({ id: body.user.id, email, locale: 'tr' });
  });

  it('refresh rotates: old refresh token then → 401', async () => {
    const { body } = await register(uniqueEmail()).expect(201);
    const next = await http()
      .post('/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(200);
    expect(next.body.refreshToken).not.toBe(body.refreshToken);
    await http()
      .get('/me')
      .set('Authorization', `Bearer ${next.body.accessToken}`)
      .expect(200);
    await http()
      .post('/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(401);
  });

  it('reusing a revoked refresh token revokes all user tokens', async () => {
    const { body } = await register(uniqueEmail()).expect(201);
    const next = await http()
      .post('/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(200);
    await http()
      .post('/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(401); // reuse
    await http()
      .post('/auth/refresh')
      .send({ refreshToken: next.body.refreshToken })
      .expect(401);
  });

  it('logout then refresh → 401', async () => {
    const { body } = await register(uniqueEmail()).expect(201);
    await http()
      .post('/auth/logout')
      .send({ refreshToken: body.refreshToken })
      .expect(204);
    await http()
      .post('/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(401);
  });

  it('swagger document lists the auth endpoints', async () => {
    const { body } = await http().get('/docs-json').expect(200);
    expect(Object.keys(body.paths)).toEqual(
      expect.arrayContaining([
        '/auth/register',
        '/auth/login',
        '/auth/refresh',
        '/auth/logout',
        '/me',
      ]),
    );
  });

  it('unknown refresh token → 401', async () => {
    await http()
      .post('/auth/refresh')
      .send({ refreshToken: 'nope' })
      .expect(401);
  });
});

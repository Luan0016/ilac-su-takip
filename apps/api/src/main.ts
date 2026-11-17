import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');

const app = await NestFactory.create(AppModule);
configureApp(app);
await app.listen(process.env.PORT ?? 3000);

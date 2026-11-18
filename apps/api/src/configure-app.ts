import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

/** Shared by main.ts and the e2e tests so both run the same middleware. */
export function configureApp(app: INestApplication) {
  app.use(helmet());
  app.useGlobalPipes(new StandardSchemaValidationPipe({ transform: true }));
  const config = new DocumentBuilder()
    .setTitle('İlaç ve Su Takip API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    () => SwaggerModule.createDocument(app, config),
    { jsonDocumentUrl: 'docs-json' },
  );
}

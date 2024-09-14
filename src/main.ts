import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { type StatelessUser } from './auth/user.factory';
import { TypeORMErrorsFilter } from './common/typeorm-errors.filter';
import helmet from 'helmet';
import { HelmetConfig } from './config/helmet.config';
import { ConfigService } from '@nestjs/config';
import { CorsConfig } from './config/cors.config';
import { NestExpressApplication } from '@nestjs/platform-express';

declare module 'express' {
  export interface Request {
    user?: StatelessUser;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get config service.
  const configService = app.get(ConfigService);

  // Cors.
  app.enableCors(configService.getOrThrow<CorsConfig>('cors'));

  // Configure Helmet, for CSP and other headers.
  app.use(helmet(configService.getOrThrow<HelmetConfig>('helmet')));

  // Filter and translate TypeORM errors.
  app.useGlobalFilters(new TypeORMErrorsFilter());

  // Starts listening for shutdown hooks.
  app.enableShutdownHooks();

  // Set global prefix.
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

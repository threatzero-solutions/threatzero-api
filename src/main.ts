import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { type StatelessUser } from './auth/user.factory';
import { TypeORMErrorsFilter } from './common/typeorm-errors.filter';

declare global {
  namespace Express {
    export interface Request {
      user?: StatelessUser;
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new TypeORMErrorsFilter());
  await app.listen(3000);
}
bootstrap();

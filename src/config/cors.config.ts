import { registerAs } from '@nestjs/config';
import { validate } from './env.validation';
import { IsOptional, IsString } from 'class-validator';

export class CorsConfig {
  @IsOptional()
  @IsString({ each: true })
  origin: string[];
}

export default registerAs('cors', () =>
  validate(CorsConfig, {
    origin: [
      ...(process.env.CORS_ALLOWED_ORIGINS?.split(',') || []),
      'http://localhost:3000',
    ],
  }),
);

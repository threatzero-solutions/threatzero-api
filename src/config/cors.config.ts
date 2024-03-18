import { registerAs } from '@nestjs/config';
import { validate } from './env.validation';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CorsConfig {
  @IsOptional()
  @Transform(({ value }) => value.map((s: string) => new RegExp(s)))
  origin: RegExp[];
}

export default registerAs('cors', () =>
  validate(CorsConfig, {
    origin: [
      ...(process.env.CORS_ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) ||
        []),
      'http://localhost(:d+)?',
    ],
  }),
);

import { registerAs } from '@nestjs/config';
import {
  IsOptional,
  IsPort,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';
import { validate } from './env.validation';

export class GeneralConfig {
  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsPositive()
  port?: number;

  @IsUrl()
  @IsOptional()
  threatzeroLogoUrl?: string;
}

export default registerAs('general', () =>
  validate(GeneralConfig, {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT ?? '3000') || 3000,
    threatzeroLogoUrl: process.env.THREATZERO_LOGO_URL,
  }),
);

import { registerAs } from '@nestjs/config';
import { IsOptional, IsPositive, IsString, IsUrl } from 'class-validator';
import { validate } from './env.validation';

export class GeneralConfig {
  @IsOptional()
  @IsString()
  host: string = 'localhost';

  @IsOptional()
  @IsPositive()
  port: number = 3000;

  @IsUrl()
  @IsOptional()
  threatzeroLogoUrl: string =
    'https://content.threatzero.org/TZ_logo_final.png';

  @IsOptional()
  @IsUrl()
  appHost: string = 'https://app.threatzero.org';
}

export default registerAs('general', () =>
  validate(GeneralConfig, {
    host: process.env.HOST,
    port: process.env.PORT,
    threatzeroLogoUrl: process.env.THREATZERO_LOGO_URL,
    appHost: process.env.APP_HOST,
  }),
);

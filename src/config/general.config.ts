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
  @IsUrl({ require_tld: false })
  appHost: string = 'https://app.threatzero.org';

  @IsOptional()
  @IsUrl({ require_tld: false })
  apiHost: string = 'https://api.threatzero.org/api/';
}

export default registerAs('general', () =>
  validate(GeneralConfig, {
    host: process.env.HOST,
    port: process.env.PORT,
    threatzeroLogoUrl: process.env.THREATZERO_LOGO_URL,
    appHost: process.env.APP_HOST,
    apiHost: process.env.API_HOST,
  }),
);

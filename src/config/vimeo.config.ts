import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

class VimeoAuthConfig {
  @IsString()
  accessToken: string;
}

export class VimeoConfig {
  @ValidateNested()
  @Type(() => VimeoAuthConfig)
  auth: VimeoAuthConfig;

  @IsString()
  apiBaseUrl: string;
}

export default registerAs('vimeo', () => ({
  auth: {
    accessToken: process.env.VIMEO_ACCESS_TOKEN,
  },
  apiBaseUrl: process.env.VIMEO_API_BASE_URL ?? 'https://api.vimeo.com/',
}));

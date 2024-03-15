import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { validate } from './env.validation';

class VimeoAuthConfig {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

export class VimeoConfig {
  @ValidateNested()
  @Type(() => VimeoAuthConfig)
  @IsNotEmpty()
  auth: VimeoAuthConfig;

  @IsString()
  @IsOptional()
  apiBaseUrl: string = 'https://api.vimeo.com/';
}

export default registerAs('vimeo', () =>
  validate(VimeoConfig, {
    auth: {
      accessToken: process.env.VIMEO_ACCESS_TOKEN,
    },
    apiBaseUrl: process.env.VIMEO_API_BASE_URL,
  }),
);

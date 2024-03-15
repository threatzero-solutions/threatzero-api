import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsString } from 'class-validator';
import { validate } from './env.validation';

export class MediaConfig {
  @IsString()
  @IsNotEmpty()
  signingKey: string;
}

export default registerAs('media', () =>
  validate(MediaConfig, {
    signingKey: process.env.MEDIA_SIGNING_KEY,
  }),
);

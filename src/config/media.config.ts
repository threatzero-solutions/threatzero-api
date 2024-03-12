import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';

export class MediaConfig {
  @IsString()
  signingKey: string;
}

export default registerAs('media', () => ({
  signingKey: process.env.MEDIA_SIGNING_KEY,
}));

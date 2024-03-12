import { registerAs } from '@nestjs/config';
import { IsString, IsUrl } from 'class-validator';

export class AuthConfig {
  @IsUrl()
  issuer: string;

  @IsString()
  audience: string;

  @IsUrl()
  jwksUri: string;
}

export default registerAs('auth', () => ({
  issuer: process.env.AUTH_ISSUER,
  audience: process.env.AUTH_AUDIENCE,
  jwksUri: process.env.AUTH_JWKS_URI,
}));

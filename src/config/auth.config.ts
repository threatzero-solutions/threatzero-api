import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { validate } from './env.validation';

export class AuthConfig {
  @IsUrl()
  @IsNotEmpty()
  issuer: string;

  @IsString()
  @IsNotEmpty()
  audience: string;

  @IsUrl()
  @IsNotEmpty()
  jwksUri: string;
}

export default registerAs('auth', () =>
  validate(AuthConfig, {
    issuer: process.env.AUTH_ISSUER,
    audience: process.env.AUTH_AUDIENCE,
    jwksUri: process.env.AUTH_JWKS_URI,
  }),
);

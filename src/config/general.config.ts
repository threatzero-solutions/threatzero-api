import { registerAs } from '@nestjs/config';
import { envToJson } from './utils';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsPort,
  IsString,
  IsUrl,
} from 'class-validator';

export class GeneralConfig {
  @IsArray({
    each: true,
  })
  contentSecurityPolicyDirectives: Record<string, string[]>;

  @IsIn([
    'no-referrer',
    'no-referrer-when-downgrade',
    'same-origin',
    'origin',
    'strict-origin',
    'origin-when-cross-origin',
    'strict-origin-when-cross-origin',
    'unsafe-url',
    '',
  ])
  referrerPolicy:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'same-origin'
    | 'origin'
    | 'strict-origin'
    | 'origin-when-cross-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
    | '';

  @IsString()
  host: string;

  @IsPort()
  port: number | string;

  @IsUrl()
  @IsOptional()
  threatzeroLogoUrl?: string;
}

export default registerAs('general', () => {
  const authSrc = process.env.AUTH_ISSUER
    ? new URL(process.env.AUTH_ISSUER).hostname
    : null;

  const cloudfrontSrc = process.env.AWS_CLOUDFRONT_DOMAIN;
  return {
    contentSecurityPolicyDirectives: {
      'connect-src': [
        "'self'",
        'data:',
        'vimeo.com',
        ...(authSrc ? [authSrc] : []),
        ...(cloudfrontSrc ? [cloudfrontSrc] : []),
        ...envToJson(process.env.CONTENT_SECURITY_POLICY_CONNECT_SRC, []),
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        ...(cloudfrontSrc ? [cloudfrontSrc] : []),
        ...envToJson(process.env.CONTENT_SECURITY_POLICY_IMG_SRC, []),
      ],
      'media-src': [
        "'self'",
        'data:',
        'blob:',
        ...(cloudfrontSrc ? [cloudfrontSrc] : []),
        ...envToJson(process.env.CONTENT_SECURITY_POLICY_MEDIA_SRC, []),
      ],
      'default-src': [
        "'self'",
        ...envToJson(process.env.CONTENT_SECURITY_POLICY_DEFAULT_SRC, []),
      ],
      'script-src': [
        "'self'",
        'blob:',
        'cdnjs.cloudflare.com',
        'cdn.jsdelivr.net',
        'player.vimeo.com',
        ...envToJson(process.env.CONTENT_SECURITY_POLICY_SCRIPT_SRC, []),
      ],
    },
    referrerPolicy: process.env.REFERRER_POLICY ?? 'no-referrer',
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT ?? '3000') || 3000,
    threatzeroLogoUrl: process.env.THREATZERO_LOGO_URL,
  };
});

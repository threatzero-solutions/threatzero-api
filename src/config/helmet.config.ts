import * as dotenv from 'dotenv';
import { HelmetOptions } from 'helmet';
import { envToJson } from './utils';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { registerAs } from '@nestjs/config';
import { validate } from './env.validation';
dotenv.config();

// NOTE: Not meant to be inject into config service since Helmet
// must be instantiated early on in the bootstrap process.

const referrerPolicyOptions = [
  'no-referrer',
  'no-referrer-when-downgrade',
  'origin',
  'origin-when-cross-origin',
  'same-origin',
  'strict-origin',
  'strict-origin-when-cross-origin',
  'unsafe-url',
] as const;

type ReferrerPolicyOptions = (typeof referrerPolicyOptions)[number];

export class ContentSecurityPolicyConfig {
  @IsOptional()
  @IsArray({
    each: true,
  })
  directives: Record<string, string[]>;
}

export class ReferrerPolicyConfig {
  @IsOptional()
  @IsIn(referrerPolicyOptions, {
    each: true,
  })
  policy: ReferrerPolicyOptions[] = ['no-referrer'];
}

export class HelmetConfig {
  @IsOptional()
  @Type(() => ContentSecurityPolicyConfig)
  @ValidateNested()
  contentSecurityPolicy: ContentSecurityPolicyConfig;

  @IsOptional()
  @Type(() => ReferrerPolicyConfig)
  @ValidateNested()
  referrerPolicy: ReferrerPolicyConfig;
}

// TODO: If this isn't hosting the frontend, does CSP do anything?
const authSrc = process.env.AUTH_ISSUER
  ? new URL(process.env.AUTH_ISSUER).hostname
  : null;

const cloudfrontSrcs = [
  process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_APPFILES_DOMAIN,
].filter((s) => !!s) as string[];

export default registerAs(
  'helmet',
  () =>
    validate(HelmetConfig, {
      contentSecurityPolicy: {
        directives: {
          'connect-src': [
            "'self'",
            'data:',
            'vimeo.com',
            ...(authSrc ? [authSrc] : []),
            ...cloudfrontSrcs,
            ...envToJson(process.env.CONTENT_SECURITY_POLICY_CONNECT_SRC, []),
          ],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            ...cloudfrontSrcs,
            ...envToJson(process.env.CONTENT_SECURITY_POLICY_IMG_SRC, []),
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            ...cloudfrontSrcs,
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
      },
      referrerPolicy: {
        policy: envToJson(process.env.REFERRER_POLICY, ['no-referrer']),
      },
    }) as HelmetOptions,
);

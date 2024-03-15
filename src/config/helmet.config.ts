import * as dotenv from 'dotenv';
import { HelmetOptions } from 'helmet';
import { envToJson } from './utils';
dotenv.config();

// NOTE: Not meant to be inject into config service since Helmet
// must be instantiated early on in the bootstrap process.

const authSrc = process.env.AUTH_ISSUER
  ? new URL(process.env.AUTH_ISSUER).hostname
  : null;

const cloudfrontSrcs = [
  process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_APPFILES_DOMAIN,
].filter((s) => !!s) as string[];

const helmetOptions: HelmetOptions = {
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
    policy: [(process.env.REFERRER_POLICY as any) ?? 'no-referrer'],
  },
};

export default helmetOptions;

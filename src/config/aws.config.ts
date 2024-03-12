import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import { IsFQDN, IsPositive, IsString, ValidateNested } from 'class-validator';
import fs from 'fs';

export class CloudFrontDistributionConfig {
  @IsFQDN()
  domain: string;

  @IsString()
  privateKey: string;

  @IsString()
  keyPairId: string;

  @IsPositive()
  defaultPolicyExpirationSeconds: number;
}

export class CloudFrontDistrubtions {
  @ValidateNested()
  @Type(() => CloudFrontDistributionConfig)
  trainingContent: CloudFrontDistributionConfig;

  @ValidateNested()
  @Type(() => CloudFrontDistributionConfig)
  uploadedMedia: CloudFrontDistributionConfig;
}

export class CloudFrontConfig {
  @ValidateNested()
  @Type(() => CloudFrontDistrubtions)
  distributions: CloudFrontDistrubtions;
}

export class S3BucketConfig {
  @IsString()
  name: string;
}

export class S3Buckets {
  @ValidateNested()
  @Type(() => S3BucketConfig)
  trainingContent: S3BucketConfig;

  @ValidateNested()
  @Type(() => S3BucketConfig)
  uploadedMedia: S3BucketConfig;

  @ValidateNested()
  @Type(() => S3BucketConfig)
  resources: S3BucketConfig;
}

export class S3Config {
  @ValidateNested()
  @Type(() => S3Buckets)
  buckets: S3Buckets;
}

export class AWSConfig {
  @IsString()
  region: string;

  @ValidateNested()
  @Type(() => CloudFrontConfig)
  cloudfront: CloudFrontConfig;

  @ValidateNested()
  @Type(() => S3Config)
  s3: S3Config;
}

const readFileToString = (path: string | null | undefined) =>
  path ? fs.readFileSync(path, 'utf-8') : '';

export default registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'us-west-2',
  cloudfront: {
    distributions: {
      trainingContent: {
        domain:
          process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_TRAINING_DOMAIN ??
          'd1wnq16r468u3y.cloudfront.net',
        privateKey:
          process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_TRAINING_PRIVATEKEY ??
          readFileToString(
            process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_TRAINING_PRIVATEKEYPATH,
          ),
        keyPairId: process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_TRAINING_KEYPAIRID,
        defaultPolicyExpirationSeconds:
          parseInt(
            process.env
              .AWS_CLOUDFRONT_DISTRIBUTIONS_TRAINING_DEFAULTPOLICYEXPIRATIONSECONDS ??
              '3600',
          ) ?? 3600,
      },
      uploadedMedia: {
        domain:
          process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_UPLOADED_MEDIA_DOMAIN ??
          'd1wnq16r468u3y.cloudfront.net',
        privateKey:
          process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_UPLOADED_MEDIA_PRIVATEKEY ??
          readFileToString(
            process.env
              .AWS_CLOUDFRONT_DISTRIBUTIONS_UPLOADED_MEDIA_PRIVATEKEYPATH,
          ),
        keyPairId:
          process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_UPLOADED_MEDIA_KEYPAIRID,
        defaultPolicyExpirationSeconds:
          parseInt(
            process.env
              .AWS_CLOUDFRONT_DISTRIBUTIONS_UPLOADED_MEDIA_DEFAULTPOLICYEXPIRATIONSECONDS ??
              '3600',
          ) ?? 3600,
      },
    },
  },
  s3: {
    buckets: {
      trainingContent: {
        name:
          process.env.AWS_S3_BUCKETS_TRAINING_CONTENT_NAME ??
          'tz-training-content',
      },
      uploadedMedia: {
        name:
          process.env.AWS_S3_BUCKETS_UPLOADED_MEDIA_NAME ?? 'tz-uploaded-media',
      },
      resources: {
        name: process.env.AWS_S3_BUCKETS_RESOURCES_NAME ?? 'tz-resource-files',
      },
    },
  },
}));

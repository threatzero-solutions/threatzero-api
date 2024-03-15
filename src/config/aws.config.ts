import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import {
  IsFQDN,
  IsNotEmpty,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { readFileToString } from './utils';
import { validate } from './env.validation';

export class CloudFrontDistributionConfig {
  @IsFQDN()
  @IsNotEmpty()
  domain: string;

  @IsString()
  @IsNotEmpty()
  privateKey: string;

  @IsString()
  @IsNotEmpty()
  keyPairId: string;

  @IsPositive()
  @IsNotEmpty()
  defaultPolicyExpirationSeconds: number;
}

export class CloudFrontDistrubtions {
  @ValidateNested()
  @Type(() => CloudFrontDistributionConfig)
  appfiles: CloudFrontDistributionConfig;
}

export class CloudFrontConfig {
  @ValidateNested()
  @Type(() => CloudFrontDistrubtions)
  distributions: CloudFrontDistrubtions;
}

export class S3BucketConfig {
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  region: string;

  @ValidateNested()
  @Type(() => CloudFrontConfig)
  cloudfront: CloudFrontConfig;

  @ValidateNested()
  @Type(() => S3Config)
  s3: S3Config;
}

export default registerAs('aws', () =>
  validate(AWSConfig, {
    region: process.env.AWS_REGION || 'us-west-2',
    cloudfront: {
      distributions: {
        appfiles: {
          domain:
            process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_APPFILES_DOMAIN ??
            'd1wnq16r468u3y.cloudfront.net',
          privateKey:
            process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_APPFILES_PRIVATEKEY ??
            readFileToString(
              process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_APPFILES_PRIVATEKEYPATH,
            ),
          keyPairId:
            process.env.AWS_CLOUDFRONT_DISTRIBUTIONS_APPFILES_KEYPAIRID,
          defaultPolicyExpirationSeconds:
            parseInt(
              process.env
                .AWS_CLOUDFRONT_DISTRIBUTIONS_APPFILES_DEFAULTPOLICYEXPIRATIONSECONDS ??
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
            process.env.AWS_S3_BUCKETS_UPLOADED_MEDIA_NAME ??
            'tz-uploaded-media',
        },
        resources: {
          name:
            process.env.AWS_S3_BUCKETS_RESOURCES_NAME ?? 'tz-resource-files',
        },
      },
    },
  }),
);

import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import path from 'path';
import { CloudFrontDistributionConfig } from 'src/config/aws.config';

@Injectable()
export class MediaService {
  getCloudFrontUrlSigner(options: CloudFrontDistributionConfig) {
    return (key: string) => {
      const expires = dayjs().add(
        options.defaultPolicyExpirationSeconds,
        'seconds',
      );

      return getSignedUrl({
        url: path.join(options.domain, key),
        keyPairId: options.keyPairId,
        privateKey: options.privateKey,
        dateLessThan: expires.toISOString(),
      });
    };
  }
}

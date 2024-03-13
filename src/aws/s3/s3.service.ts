import { S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  client: S3Client;

  constructor(private config: ConfigService) {
    this.client = new S3Client({
      region: this.config.getOrThrow<string>('aws.region'),
    });
  }
}

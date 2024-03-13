import { SESv2Client } from '@aws-sdk/client-sesv2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SesService {
  client: SESv2Client;

  constructor(private config: ConfigService) {
    this.client = new SESv2Client({
      region: this.config.getOrThrow<string>('aws.region'),
    });
  }
}

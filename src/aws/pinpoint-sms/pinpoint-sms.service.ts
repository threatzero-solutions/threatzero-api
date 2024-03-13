import { PinpointSMSVoiceV2Client } from '@aws-sdk/client-pinpoint-sms-voice-v2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PinpointSmsService {
  client: PinpointSMSVoiceV2Client;

  constructor(private config: ConfigService) {
    this.client = new PinpointSMSVoiceV2Client({
      region: this.config.getOrThrow<string>('aws.region'),
    });
  }
}

import { Module } from '@nestjs/common';
import { S3Service } from './s3/s3.service';
import { SesService } from './ses/ses.service';
import { PinpointSmsService } from './pinpoint-sms/pinpoint-sms.service';

@Module({
  providers: [S3Service, SesService, PinpointSmsService],
  exports: [S3Service, SesService, PinpointSmsService],
})
export class AwsModule {}

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import {
  NOTIFICATIONS_QUEUE_NAME,
  NOTIFICATIONS_QUEUE_PREFIX,
} from 'src/common/constants/queue.constants';
import { NotificationsProcessor } from './notifications.processor';
import { SesService } from 'src/aws/ses/ses.service';
import { PinpointSmsService } from 'src/aws/pinpoint-sms/pinpoint-sms.service';
import { AuthModule } from 'src/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from 'src/common/cache-config/cache-config.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE_NAME,
      prefix: NOTIFICATIONS_QUEUE_PREFIX,
    }),
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    AuthModule,
  ],
  providers: [NotificationsProcessor, SesService, PinpointSmsService],
})
export class NotificationsModule {}

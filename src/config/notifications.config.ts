import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { validate } from './env.validation';

export class EmailTemplatesConfig {
  @IsOptional()
  @IsString()
  newTip: string = 'tz-new-tip-notification';

  @IsOptional()
  @IsString()
  trainingLink: string = 'tz-training-link-notification';
}

export class EmailNotificationsConfig {
  @IsOptional()
  @IsString()
  defaultFrom: string = 'ThreatZero <support@threatzero.org>';

  @ValidateNested()
  @Type(() => EmailTemplatesConfig)
  @IsNotEmpty()
  templates: EmailTemplatesConfig;
}

export class SmsNotificationsConfig {
  @IsNotEmpty()
  @IsString()
  originationPhoneNumber: string;
}

export class NotificationsConfig {
  @ValidateNested()
  @Type(() => EmailNotificationsConfig)
  @IsNotEmpty()
  email: EmailNotificationsConfig;

  @ValidateNested()
  @Type(() => SmsNotificationsConfig)
  @IsNotEmpty()
  sms: SmsNotificationsConfig;
}

export default registerAs('notifications', () =>
  validate(NotificationsConfig, {
    email: {
      defaultFrom: process.env.NOTIFICATIONS_EMAIL_DEFAULT_FROM,
      templates: {
        newTip: process.env.NOTIFICATIONS_EMAIL_TEMPLATES_NEW_TIP,
      },
    },
    sms: {
      originationPhoneNumber:
        process.env.NOTIFICATIONS_SMS_ORIGINATION_PHONE_NUMBER,
    },
  }),
);

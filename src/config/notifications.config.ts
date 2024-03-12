import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

class EmailTemplatesConfig {
  newTip: string;
}

class EmailNotificationsConfig {
  defaultFrom: string;

  @ValidateNested()
  @Type(() => EmailTemplatesConfig)
  templates: EmailTemplatesConfig;
}

class SmsNotificationsConfig {
  originationPhoneNumber: string;
}

export class NotificationsConfig {
  @ValidateNested()
  @Type(() => EmailNotificationsConfig)
  email: EmailNotificationsConfig;

  @ValidateNested()
  @Type(() => SmsNotificationsConfig)
  sms: SmsNotificationsConfig;
}

export default registerAs('notifications', () => ({
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
}));

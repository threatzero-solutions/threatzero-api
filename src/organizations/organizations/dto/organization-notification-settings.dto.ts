import { IsBoolean, IsOptional } from 'class-validator';

export class OrganizationNotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  initialReminderEmailsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  followUpReminderEmailsEnabled?: boolean;
}

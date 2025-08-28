import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendTestTrainingReminderEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  @IsString()
  @IsNotEmpty()
  itemId: string;
}

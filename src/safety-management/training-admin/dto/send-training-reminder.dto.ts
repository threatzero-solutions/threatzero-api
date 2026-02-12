import { IsNotEmpty, IsUUID } from 'class-validator';

export class SendTrainingReminderDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  courseEnrollmentId: string;

  @IsNotEmpty()
  @IsUUID()
  trainingItemId: string;
}

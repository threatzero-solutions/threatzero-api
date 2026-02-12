import { IsNotEmpty, IsUUID } from 'class-validator';

export class MarkCompletionDto {
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

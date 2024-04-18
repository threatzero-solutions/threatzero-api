import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateWorkplaceViolencePreventionPlanDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  pdfS3Key: string;
}

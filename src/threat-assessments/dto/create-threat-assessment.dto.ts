import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { AssessmentStatus } from '../entities/threat-assessment.entity';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { Type } from 'class-transformer';

export class CreateThreatAssessmentDto {
  @IsOptional()
  @IsEnum(AssessmentStatus)
  status: AssessmentStatus;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateFormSubmissionDto)
  submission: CreateFormSubmissionDto;
}

import { IsEnum, IsOptional } from 'class-validator';
import { FormSubmissionState } from '../entities/form-submission.entity';
import { CreateFieldResponseDto } from 'src/forms/fields/dto/create-field-response.dto';

export class CreateFormSubmissionDto {
  fieldResponses: CreateFieldResponseDto[];

  @IsOptional()
  @IsEnum(FormSubmissionState)
  status: FormSubmissionState;
}

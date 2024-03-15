import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { FormSubmissionState } from '../entities/form-submission.entity';
import { CreateFieldResponseDto } from 'src/forms/fields/dto/create-field-response.dto';
import { Type } from 'class-transformer';

export class CreateFormSubmissionDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateFieldResponseDto)
  fieldResponses: CreateFieldResponseDto[];

  @IsOptional()
  @IsEnum(FormSubmissionState)
  status: FormSubmissionState;
}

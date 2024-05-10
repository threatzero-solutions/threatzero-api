import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FormSubmissionState } from '../entities/form-submission.entity';
import { CreateFieldResponseDto } from 'src/forms/fields/dto/create-field-response.dto';
import { Type } from 'class-transformer';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Form } from '../entities/form.entity';

export class CreateFormSubmissionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateFieldResponseDto)
  fieldResponses: CreateFieldResponseDto[];

  @IsOptional()
  @IsEnum(FormSubmissionState)
  status: FormSubmissionState;

  @IsOptional()
  @IsString()
  formId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveByIdDto<Form>)
  form?: SaveByIdDto<Form>;
}

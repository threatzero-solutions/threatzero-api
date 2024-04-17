import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { Transform, Type } from 'class-transformer';

export class CreateSafetyResourceBaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Transform(({ value }) => (value === '' ? null : value))
  tag?: string | null;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateFormSubmissionDto)
  submission: CreateFormSubmissionDto;
}

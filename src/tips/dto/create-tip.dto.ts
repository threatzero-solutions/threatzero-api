import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateTipSubmissionDto } from './create-tip-submission.dto';

export class CreateTipDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateTipSubmissionDto)
  submission: CreateTipSubmissionDto;
}

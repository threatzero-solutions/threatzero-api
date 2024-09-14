import { Transform } from 'class-transformer';
import { CreateFormSubmissionDto } from 'src/forms/forms/dto/create-form-submission.dto';
import { FormSubmissionState } from 'src/forms/forms/entities/form-submission.entity';

export class CreateTipSubmissionDto extends CreateFormSubmissionDto {
  @Transform(() => FormSubmissionState.COMPLETE)
  status: FormSubmissionState = FormSubmissionState.COMPLETE;
}

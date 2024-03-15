import { ObjectLiteral } from 'typeorm';
import { FormSubmission } from '../entities/form-submission.entity';

export interface SubmittableEntity extends ObjectLiteral {
  submission: FormSubmission;
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkplaceViolencePreventionPlanDto } from './create-workplace-violence-prevention-plan.dto';

export class UpdateWorkplaceViolencePreventionPlanDto extends PartialType(
  CreateWorkplaceViolencePreventionPlanDto,
) {}

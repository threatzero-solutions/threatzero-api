import { IsEnum, IsOptional } from 'class-validator';
import { AssessmentStatus } from '../entities/threat-assessment.entity';
import { CreateSafetyResourceBaseDto } from 'src/safety-management/common/create-safety-resource-base.dto';

export class CreateThreatAssessmentDto extends CreateSafetyResourceBaseDto {
  @IsOptional()
  @IsEnum(AssessmentStatus)
  status: AssessmentStatus;
}

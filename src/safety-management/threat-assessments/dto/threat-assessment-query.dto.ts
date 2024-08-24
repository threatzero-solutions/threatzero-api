import { IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ThreatAssessmentQueryOrderDto } from './threat-assessment-query-order.dto';
import { AssessmentStatus } from '../entities/threat-assessment.entity';
import { SafetyResourceBaseQueryDto } from 'src/safety-management/common/safety-resource-base-query';

export class ThreatAssessmentQueryDto extends SafetyResourceBaseQueryDto {
  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => ThreatAssessmentQueryOrderDto)
  order: ThreatAssessmentQueryOrderDto = new ThreatAssessmentQueryOrderDto();
}

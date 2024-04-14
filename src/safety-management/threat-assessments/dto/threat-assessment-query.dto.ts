import { IsOptional, IsEnum, ValidateNested, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Type } from 'class-transformer';
import { ThreatAssessmentQueryOrderDto } from './threat-assessment-query-order.dto';
import { AssessmentStatus } from '../entities/threat-assessment.entity';

export class ThreatAssessmentQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;

  @IsOptional()
  @IsString()
  unitSlug?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ThreatAssessmentQueryOrderDto)
  order: ThreatAssessmentQueryOrderDto = new ThreatAssessmentQueryOrderDto();

  protected getSearchFields(): string[] {
    return ['tag'];
  }
}

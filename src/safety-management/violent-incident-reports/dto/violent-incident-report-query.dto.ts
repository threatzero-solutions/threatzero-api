import { IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ViolentIncidentReportQueryOrderDto } from './violent-incident-report-query-order.dto';
import { ViolentIncidentReportStatus } from '../entities/violent-incident-report.entity';
import { SafetyResourceBaseQueryDto } from 'src/safety-management/common/safety-resource-base-query';

export class ViolentIncidentReportQueryDto extends SafetyResourceBaseQueryDto {
  @IsOptional()
  @IsEnum(ViolentIncidentReportStatus)
  status?: ViolentIncidentReportStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => ViolentIncidentReportQueryOrderDto)
  order: ViolentIncidentReportQueryOrderDto =
    new ViolentIncidentReportQueryOrderDto();
}

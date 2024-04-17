import { IsEnum, IsOptional } from 'class-validator';
import { CreateSafetyResourceBaseDto } from 'src/safety-management/common/create-safety-resource-base.dto';
import { ViolentIncidentReportStatus } from '../entities/violent-incident-report.entity';

export class CreateViolentIncidentReportDto extends CreateSafetyResourceBaseDto {
  @IsOptional()
  @IsEnum(ViolentIncidentReportStatus)
  status?: ViolentIncidentReportStatus;
}

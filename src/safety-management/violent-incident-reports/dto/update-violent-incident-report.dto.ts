import { PartialType } from '@nestjs/mapped-types';
import { CreateViolentIncidentReportDto } from './create-violent-incident-report.dto';

export class UpdateViolentIncidentReportDto extends PartialType(
  CreateViolentIncidentReportDto,
) {}

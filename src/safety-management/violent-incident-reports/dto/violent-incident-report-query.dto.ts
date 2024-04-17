import { IsOptional, IsEnum, ValidateNested, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Type } from 'class-transformer';
import { ViolentIncidentReportQueryOrderDto } from './violent-incident-report-query-order.dto';
import { ViolentIncidentReportStatus } from '../entities/violent-incident-report.entity';

export class ViolentIncidentReportQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(ViolentIncidentReportStatus)
  status?: ViolentIncidentReportStatus;

  @IsOptional()
  @IsString()
  unitSlug?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ViolentIncidentReportQueryOrderDto)
  order: ViolentIncidentReportQueryOrderDto =
    new ViolentIncidentReportQueryOrderDto();

  protected getSearchFields(): string[] {
    return ['tag'];
  }
}

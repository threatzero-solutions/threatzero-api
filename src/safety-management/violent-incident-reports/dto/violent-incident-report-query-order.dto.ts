import { IsIn, IsOptional } from 'class-validator';
import {
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';
import { SafetyResourceBaseQueryOrderDto } from 'src/safety-management/common/safety-resource-base-query';

export class ViolentIncidentReportQueryOrderDto extends SafetyResourceBaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  status: QueryOrder;
}

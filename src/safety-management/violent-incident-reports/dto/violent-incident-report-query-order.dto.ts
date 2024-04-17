import { IsIn, IsOptional } from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';

export class ViolentIncidentReportQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  tag: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['unit.name']: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  status: QueryOrder;
}

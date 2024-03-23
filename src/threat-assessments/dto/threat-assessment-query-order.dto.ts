import { IsIn, IsOptional } from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';

export class ThreatAssessmentQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['unit.name']: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  status: QueryOrder;
}

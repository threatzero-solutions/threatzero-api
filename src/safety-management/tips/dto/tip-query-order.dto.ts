import { IsIn, IsOptional } from 'class-validator';
import {
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';
import { SafetyResourceBaseQueryOrderDto } from 'src/safety-management/common/safety-resource-base-query';

export class TipQueryOrderDto extends SafetyResourceBaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['location.name']: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  status: QueryOrder;
}

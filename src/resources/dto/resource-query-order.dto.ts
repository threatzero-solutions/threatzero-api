import { IsIn, IsOptional } from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';

export class ResourceQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  title: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  type: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  category: QueryOrder;
}

import { IsIn, IsOptional } from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';

export class BaseOrganizationsQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  name: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  slug: QueryOrder;
}

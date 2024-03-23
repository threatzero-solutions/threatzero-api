import { IsOptional, IsIn } from 'class-validator';
import {
  QueryOrderOptions,
  QueryOrder,
  BaseQueryOrderDto,
} from 'src/common/dto/base-query-order.dto';

export class LocationsQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  name: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  locationId: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['unit.name']: QueryOrder;
}

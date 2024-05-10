import { IsIn, IsOptional } from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';

export class LanguageQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  code: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  name: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  nativeName: QueryOrder;
}

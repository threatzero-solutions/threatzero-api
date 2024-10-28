import { IsIn, IsOptional } from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';

export class CourseQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['metadata.title']: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['audiences.slug']: QueryOrder;
}

import { IsOptional, IsIn } from 'class-validator';

export const QueryOrderOptions = ['ASC', 'DESC'] as const;
export type QueryOrder = (typeof QueryOrderOptions)[number];

export class BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  createdOn: QueryOrder = 'DESC';

  @IsOptional()
  @IsIn(QueryOrderOptions)
  updatedOn: QueryOrder;
}

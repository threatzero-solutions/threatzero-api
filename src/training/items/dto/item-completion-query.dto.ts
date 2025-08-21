import { Type } from 'class-transformer';
import { IsIn, IsOptional, ValidateNested } from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';
import { ItemCompletionsSummaryQueryDto } from './item-completions-summary-query.dto';

export class ItemCompletionQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  completed?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  progress?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  completedOn?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['user.givenName']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['user.familyName']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['user.email']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['enrollment.startDate']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['enrollment.endDate']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['enrollment.course.metadata.title']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['section.metadata.title']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['item.metadata.title']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['user.organization.name']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['user.unit.name']?: QueryOrder;
}

const defaultOrder = new ItemCompletionQueryOrderDto();
defaultOrder.createdOn = 'DESC';

export class ItemCompletionQueryDto extends ItemCompletionsSummaryQueryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ItemCompletionQueryOrderDto)
  order: ItemCompletionQueryOrderDto = defaultOrder;

  protected getSearchFields(): string[] {
    return ['user.givenName', 'user.familyName', 'user.email'];
  }
}

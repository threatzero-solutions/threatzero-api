import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

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
  ['organization.name']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['unit.name']?: QueryOrder;
}

const defaultOrder = new ItemCompletionQueryOrderDto();
defaultOrder.createdOn = 'DESC';

export class ItemCompletionQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString({ each: true })
  ['enrollment.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['enrollment.course.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['section.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['item.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  @Expose({ groups: ['admin'] })
  ['organization.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  @Expose({ groups: ['admin'] })
  ['organization.slug']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  @Expose({ groups: ['organization'] })
  ['unit.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  @Expose({ groups: ['organization'] })
  ['unit.slug']?: string | string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ItemCompletionQueryOrderDto)
  order: ItemCompletionQueryOrderDto = defaultOrder;

  protected getSearchFields(): string[] {
    return ['user.givenName', 'user.familyName', 'user.email'];
  }
}

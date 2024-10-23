import { Expose } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
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
  ['course.metadataTitle']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['section.metadataTitle']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['item.metadataTitle']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['organization.name']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['unit.name']?: QueryOrder;
}

export class ItemCompletionQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString({ each: true })
  ['course.id']?: string | string[];

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
}

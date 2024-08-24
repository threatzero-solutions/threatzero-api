import { IsOptional, ValidateNested, IsString, IsIn } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Type } from 'class-transformer';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';

export class SafetyResourceBaseQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  tag?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['unit.name']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['unit.organization.name']?: QueryOrder;
}

export class SafetyResourceBaseQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString({ each: true })
  unitSlug?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['unit.slug']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['unit.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['unit.organization.slug']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['unit.organization.id']?: string | string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SafetyResourceBaseQueryOrderDto)
  order: SafetyResourceBaseQueryOrderDto =
    new SafetyResourceBaseQueryOrderDto();

  protected getSearchFields(): string[] {
    return ['tag'];
  }
}

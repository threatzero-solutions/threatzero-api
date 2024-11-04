import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { OpaqueTokenQueryDto } from 'src/auth/dto/opaque-token-query.dto';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';

export class ViewingUserTokenQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['value.userId']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['value.email']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['value.lastName']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['value.firstName']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['value.unitSlug']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['value.organizationSlug']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  expiresOn?: QueryOrder;
}

export class ViewingUserTokenQueryDto extends OpaqueTokenQueryDto {
  @IsOptional()
  @IsString({ each: true })
  ['value.userId']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['value.email']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['value.unitSlug']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['value.organizationSlug']?: string | string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ViewingUserTokenQueryOrderDto)
  order: ViewingUserTokenQueryOrderDto = new ViewingUserTokenQueryOrderDto();

  getSearchFields(): string[] {
    return [
      ...super.getSearchFields(),
      'value.email',
      'value.firstName',
      'value.lastName',
    ];
  }
}

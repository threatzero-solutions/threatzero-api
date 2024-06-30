import { Transform, Type } from 'class-transformer';
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
  userId?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  email?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  unitSlug?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  organizationSlug?: QueryOrder;
}

export class ViewingUserTokenQueryDto extends OpaqueTokenQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  unitSlug?: string[];

  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  organizationSlug?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ViewingUserTokenQueryOrderDto)
  order: ViewingUserTokenQueryOrderDto = new ViewingUserTokenQueryOrderDto();
}

import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
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
  lastName?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  firstName?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  unitSlug?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  organizationSlug?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  expiresOn?: QueryOrder;
}

export class ViewingUserTokenQueryDto extends OpaqueTokenQueryDto {
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  userId?: string[];

  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  email?: string[];

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

  getValueFields(): string[] {
    return [
      ...super.getValueFields(),
      'userId',
      'email',
      'firstName',
      'lastName',
      'unitSlug',
      'organizationSlug',
      'expiresOn',
    ];
  }
}

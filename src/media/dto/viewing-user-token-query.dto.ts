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
  userId?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  email?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  unitSlug?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  organizationSlug?: string | string[];

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

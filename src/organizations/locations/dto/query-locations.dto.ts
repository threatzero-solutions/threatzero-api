import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

export class LocationsQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['unit.name']: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  name: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  locationId: QueryOrder;
}

export class QueryLocationsDto extends BaseQueryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationsQueryOrderDto)
  order: LocationsQueryOrderDto = new LocationsQueryOrderDto();

  @IsOptional()
  @IsUUID('4', { each: true })
  ['unit.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['unit.slug']?: string | string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  ['unit.organization.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['unit.organization.slug']?: string | string[];

  protected getSearchFields() {
    return ['name', 'locationId'];
  }
}

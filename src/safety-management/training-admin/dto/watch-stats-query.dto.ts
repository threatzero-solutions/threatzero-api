import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

export class WatchStatsQueryOrderDto extends BaseQueryOrderDto {
  @Transform(() => undefined)
  createdOn?: QueryOrder = undefined;

  @Transform(() => undefined)
  updatedOn?: QueryOrder = undefined;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  unitName?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  organizationName?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  trainingItemTitle?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  percentWatched?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  lastName?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  firstName?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  email?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  year?: QueryOrder;
}

const defaultOrder = new WatchStatsQueryOrderDto();

export class WatchStatsQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString({ each: true })
  unitSlug?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  organizationSlug?: string | string[];

  @IsOptional()
  @IsString()
  @IsUUID()
  trainingItemId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  trainingCourseId?: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WatchStatsQueryOrderDto)
  order: WatchStatsQueryOrderDto = defaultOrder;
}

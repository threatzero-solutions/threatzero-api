import { IsOptional, IsEnum, ValidateNested, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Type } from 'class-transformer';
import { TipQueryOrderDto } from './tip-query-order.dto';
import { TipStatus } from '../entities/tip.entity';

export class TipQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(TipStatus)
  status?: TipStatus;

  @IsOptional()
  @IsString()
  unitSlug?: string;

  @IsOptional()
  @IsString()
  ['location.id']?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TipQueryOrderDto)
  order: TipQueryOrderDto = new TipQueryOrderDto();
}

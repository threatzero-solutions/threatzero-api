import {
  IsOptional,
  IsEnum,
  ValidateNested,
  IsString,
  IsUUID,
} from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Type } from 'class-transformer';
import { TipQueryOrderDto } from './tip-query-order.dto';
import { TipStatus } from '../entities/tip.entity';

export class TipQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(TipStatus)
  status?: TipStatus;

  @IsOptional()
  @IsString({ each: true })
  unitSlug?: string | string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  ['location.id']?: string | string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TipQueryOrderDto)
  order: TipQueryOrderDto = new TipQueryOrderDto();

  protected getSearchFields(): string[] {
    return ['tag'];
  }
}

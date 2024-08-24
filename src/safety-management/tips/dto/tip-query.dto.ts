import { IsOptional, IsEnum, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TipQueryOrderDto } from './tip-query-order.dto';
import { TipStatus } from '../entities/tip.entity';
import { SafetyResourceBaseQueryDto } from 'src/safety-management/common/safety-resource-base-query';

export class TipQueryDto extends SafetyResourceBaseQueryDto {
  @IsOptional()
  @IsEnum(TipStatus)
  status?: TipStatus;

  @IsOptional()
  @IsUUID('4', { each: true })
  ['location.id']?: string | string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TipQueryOrderDto)
  order: TipQueryOrderDto = new TipQueryOrderDto();
}

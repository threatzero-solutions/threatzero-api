import { IsOptional, IsEnum, IsNumber, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { FormState } from '../entities/form.entity';

export class QueryFormDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(FormState)
  state?: FormState;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  version?: number;
}

import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { FormState } from '../entities/form.entity';

export class CreateFormDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(FormState)
  @IsOptional()
  state?: FormState;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  version = 0;
}

import { IsOptional, IsEnum, IsString } from 'class-validator';
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
}

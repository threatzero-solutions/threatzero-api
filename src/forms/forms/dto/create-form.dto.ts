import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { FormState } from '../entities/form.entity';
import { Type } from 'class-transformer';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Language } from 'src/languages/entities/language.entity';

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

  @ValidateNested()
  @Type(() => SaveByIdDto<Language>)
  @IsNotEmpty()
  language: SaveByIdDto<Language>;
}

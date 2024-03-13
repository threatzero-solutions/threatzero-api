import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Form } from 'src/forms/forms/entities/form.entity';
import { FieldGroup } from '../entities/field-group.entity';

export class CreateFieldGroupDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsPositive()
  order?: number;

  @ValidateIf((o) => !o.parentGroup)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SaveByIdDto<Form>)
  form: SaveByIdDto<Form>;

  @ValidateIf((o) => !o.form)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SaveByIdDto<FieldGroup>)
  parentGroup: SaveByIdDto<FieldGroup>;
}

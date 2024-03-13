import {
  Length,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsString,
  ValidateIf,
} from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { FieldGroup } from 'src/forms/field-groups/entities/field-group.entity';
import { Form } from 'src/forms/forms/entities/form.entity';
import { FieldType } from '../entities/field.entity';
import { Type } from 'class-transformer';

export class CreateFieldDto {
  @IsNotEmpty()
  @Length(4, 128)
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsEnum(FieldType)
  @IsOptional()
  type?: FieldType;

  @IsOptional()
  elementProperties?: any;

  @IsOptional()
  typeParams?: any;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  order?: number;

  @IsOptional()
  hidden?: boolean;

  @ValidateIf((o) => !o.group)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SaveByIdDto<Form>)
  form?: SaveByIdDto<Form>;

  @ValidateIf((o) => !o.form)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SaveByIdDto<FieldGroup>)
  group?: SaveByIdDto<FieldGroup>;
}

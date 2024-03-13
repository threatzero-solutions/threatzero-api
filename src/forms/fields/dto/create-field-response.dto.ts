import { SaveByIdDto } from 'src/common/dto.utils';
import Field from '../entities/field.entity';
import { IsOptional, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFieldResponseDto {
  @IsOptional()
  value: any;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SaveByIdDto<Field>)
  field: SaveByIdDto<Field>;
}

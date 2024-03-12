import { Type } from 'class-transformer';
import {
  ValidateNested,
  MaxLength,
  IsString,
  IsOptional,
} from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Unit } from 'src/organizations/units/entities/unit.entity';

export class CreateLocationDto {
  @ValidateNested()
  @Type(() => SaveByIdDto<Unit>)
  unit: SaveByIdDto<Unit>;

  @MaxLength(100)
  @IsString()
  @IsOptional()
  name: string | null;
}

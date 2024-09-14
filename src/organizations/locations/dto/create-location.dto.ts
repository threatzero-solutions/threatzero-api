import { Transform, Type } from 'class-transformer';
import {
  ValidateNested,
  MaxLength,
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import crypto from 'crypto';

const newLocationId = () =>
  crypto
    .randomBytes(6)
    .toString('base64')
    .replace(/[^a-z0-9]/gi, '');

export class CreateLocationDto {
  @ValidateNested()
  @Type(() => SaveByIdDto<Unit>)
  @IsNotEmpty()
  unit: SaveByIdDto<Unit>;

  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(() => newLocationId())
  @IsOptional()
  locationId = newLocationId();
}

import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Unit } from 'src/organizations/units/entities/unit.entity';

export class CreatePOCFileDto {
  @Type(() => SaveByIdDto<Unit>)
  @IsOptional()
  unit?: SaveByIdDto<Unit>;

  @IsString()
  @IsNotEmpty()
  pocFirstName: string;

  @IsString()
  @IsNotEmpty()
  pocLastName: string;
}

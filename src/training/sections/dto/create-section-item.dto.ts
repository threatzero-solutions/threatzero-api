import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { TrainingItem } from 'src/training/items/entities/item.entity';

export class CreateTrainingSectionItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsNumber()
  order: number;

  @IsOptional()
  sectionId: string | null;

  @ValidateNested()
  @Type(() => SaveByIdDto<TrainingItem>)
  item: SaveByIdDto<TrainingItem>;
}

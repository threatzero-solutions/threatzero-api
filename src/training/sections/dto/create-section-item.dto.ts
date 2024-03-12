import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Item } from 'src/training/items/entities/item.entity';

export class CreateTrainingSectionItemDto {
  @IsOptional()
  @IsNumber()
  order: number;

  @IsOptional()
  sectionId: string | null;

  @ValidateNested()
  @Type(() => SaveByIdDto<Item>)
  item: SaveByIdDto<Item>;
}

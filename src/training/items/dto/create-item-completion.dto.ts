import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { TrainingItem } from '../entities/item.entity';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';

export class CreateItemCompletionDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SaveByIdDto<TrainingItem>)
  item: SaveByIdDto<TrainingItem>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveByIdDto<TrainingSection>)
  section: SaveByIdDto<TrainingSection>;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SaveByIdDto<TrainingCourse>)
  course: SaveByIdDto<TrainingCourse>;

  @IsNotEmpty()
  @IsString()
  url: string;
}

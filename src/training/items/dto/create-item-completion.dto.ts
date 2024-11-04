import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OptionalSaveByIdDto, SaveByIdDto } from 'src/common/dto.utils';
import { TrainingItem } from '../entities/item.entity';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';

export class CreateItemCompletionDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SaveByIdDto<TrainingItem>)
  item: SaveByIdDto<TrainingItem>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveByIdDto<TrainingSection>)
  section: SaveByIdDto<TrainingSection>;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalSaveByIdDto<CourseEnrollment>)
  enrollment?: OptionalSaveByIdDto<CourseEnrollment>;

  @IsNotEmpty()
  @IsString()
  url: string;
}

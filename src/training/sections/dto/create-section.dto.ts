import {
  ValidateNested,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDate,
} from 'class-validator';
import { CreateTrainingMetadataDto } from 'src/training/common/dto/create-training-metadata.dto';
import { TrainingRepeats } from '../entities/section.entity';
import { CreateTrainingSectionItemDto } from './create-section-item.dto';
import { Type } from 'class-transformer';
import { SaveByIdDto } from 'src/common/dto.utils';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';

export class CreateSectionDto {
  @ValidateNested()
  @Type(() => CreateTrainingMetadataDto)
  @IsOptional()
  metadata: CreateTrainingMetadataDto;

  @IsOptional()
  @IsNumber()
  order: number;

  @IsDate()
  @IsOptional()
  availableOn: Date;

  @IsOptional()
  @IsDate()
  expiresOn: Date;

  @IsEnum(TrainingRepeats)
  @IsOptional()
  repeats: TrainingRepeats;

  @ValidateNested()
  @Type(() => CreateTrainingSectionItemDto)
  items: CreateTrainingSectionItemDto[];

  @ValidateNested()
  @Type(() => SaveByIdDto<TrainingCourse>)
  courseId: SaveByIdDto<TrainingCourse>;
}

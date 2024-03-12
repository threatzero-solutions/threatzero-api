import {
  ValidateNested,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { CreateTrainingMetadataDto } from 'src/training/common/dto/create-training-metadata.dto';
import { TrainingRepeats } from '../entities/section.entity';
import { CreateTrainingSectionItemDto } from './create-section-item.dto';
import { Type } from 'class-transformer';

export class CreateSectionDto {
  @ValidateNested()
  @Type(() => CreateTrainingMetadataDto)
  @IsOptional()
  metadata: CreateTrainingMetadataDto;

  @IsOptional()
  @IsNumber()
  order: number;

  @IsDateString()
  @IsOptional()
  availableOn: Date;

  @IsOptional()
  @IsDateString()
  expiresOn: Date;

  @IsEnum(TrainingRepeats)
  @IsOptional()
  repeats: TrainingRepeats;

  @IsOptional()
  courseId: string | null;

  @Type(() => CreateTrainingSectionItemDto)
  items: CreateTrainingSectionItemDto[];
}

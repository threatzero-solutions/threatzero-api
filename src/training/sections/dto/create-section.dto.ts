import {
  ValidateNested,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDate,
  IsString,
} from 'class-validator';
import { CreateTrainingMetadataDto } from 'src/training/common/dto/create-training-metadata.dto';
import { TrainingRepeats } from '../entities/section.entity';
import { CreateTrainingSectionItemDto } from './create-section-item.dto';
import { Type } from 'class-transformer';

export class CreateSectionDto {
  @IsOptional()
  @IsString()
  id?: string;

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

  @IsString()
  courseId: string;
}

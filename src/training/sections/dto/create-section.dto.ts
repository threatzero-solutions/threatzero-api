import {
  ValidateNested,
  IsOptional,
  IsNumber,
  IsString,
} from 'class-validator';
import { CreateTrainingMetadataDto } from 'src/training/common/dto/create-training-metadata.dto';
import { CreateTrainingSectionItemDto } from './create-section-item.dto';
import { Type } from 'class-transformer';
import { DurationDto } from 'src/common/dto/duration.dto';

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

  @ValidateNested()
  @Type(() => DurationDto)
  duration: DurationDto;

  @ValidateNested()
  @Type(() => CreateTrainingSectionItemDto)
  items: CreateTrainingSectionItemDto[];

  @IsString()
  courseId: string;
}

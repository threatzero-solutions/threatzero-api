import {
  ValidateNested,
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
} from 'class-validator';
import { CreateTrainingMetadataDto } from 'src/training/common/dto/create-training-metadata.dto';
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

  @IsOptional()
  @IsDateString()
  availableOn?: string;

  @IsOptional()
  @IsDateString()
  expiresOn?: string;

  @ValidateNested()
  @Type(() => CreateTrainingSectionItemDto)
  items: CreateTrainingSectionItemDto[];

  @IsString()
  courseId: string;
}

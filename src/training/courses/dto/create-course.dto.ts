import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateTrainingMetadataDto } from 'src/training/common/dto/create-training-metadata.dto';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Audience } from 'src/training/audiences/entities/audience.entity';
import { Type } from 'class-transformer';
import { CreateSectionDto } from 'src/training/sections/dto/create-section.dto';
import { TrainingVisibility } from 'src/training/common/training.types';

export class CreateCourseDto {
  @ValidateNested()
  @Type(() => CreateTrainingMetadataDto)
  @IsNotEmpty()
  metadata: CreateTrainingMetadataDto;

  @IsOptional()
  @IsEnum(TrainingVisibility)
  visibility: TrainingVisibility;

  @Type(() => SaveByIdDto<Audience>)
  @IsOptional()
  audiences: SaveByIdDto<Audience>[];

  @Type(() => SaveByIdDto<Audience>)
  @IsOptional()
  presentableBy: SaveByIdDto<Audience>[];

  @Type(() => CreateSectionDto)
  @ValidateNested()
  @IsOptional()
  sections: CreateSectionDto[];
}

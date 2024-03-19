import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateTrainingMetadataDto } from 'src/training/common/dto/create-training-metadata.dto';
import { TrainingVisibility } from '../entities/course.entity';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Audience } from 'src/training/audiences/entities/audience.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Type } from 'class-transformer';

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

  @Type(() => SaveByIdDto<Organization>)
  @IsOptional()
  organizations: SaveByIdDto<Organization>[];
}

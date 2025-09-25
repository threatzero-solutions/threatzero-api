import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { OptionalSaveByIdDto, SaveByIdDto } from 'src/common/dto.utils';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { TrainingItem } from '../entities/item.entity';

export class UpdateOrCreateItemCompletionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

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

  @IsNotEmpty()
  @IsBoolean()
  completed: boolean;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => Math.ceil(value * 10000) / 10000, {})
  progress: number;
}

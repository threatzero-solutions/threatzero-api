import { Expose, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { TrainingVisibility } from 'src/training/common/training.types';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { Organization } from '../entities/organization.entity';

export class CreateCourseEnrollmentDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @Type(() => SaveByIdDto<Organization>)
  @ValidateNested()
  @Expose({ groups: ['admin'] })
  organization?: SaveByIdDto<Organization>;

  @ValidateNested()
  @Type(() => SaveByIdDto<TrainingCourse>)
  course: SaveByIdDto<TrainingCourse>;

  @IsOptional()
  @IsEnum(TrainingVisibility)
  visibility: TrainingVisibility;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}

import {
  IsOptional,
  IsEnum,
  ValidateNested,
  IsUUID,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourseQueryOrderDto } from './course-query-order.dto';
import { BaseQueryTrainingDto } from 'src/training/common/dto/base-query-training.dto';
import { TrainingVisibility } from 'src/training/common/training.types';

export class CourseQueryDto extends BaseQueryTrainingDto {
  @IsOptional()
  @IsEnum(TrainingVisibility)
  visibility?: TrainingVisibility;

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseQueryOrderDto)
  order: CourseQueryOrderDto = new CourseQueryOrderDto();

  @IsOptional()
  @IsUUID('4', { each: true })
  ['organizations.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['organizations.slug']?: string | string[];
}

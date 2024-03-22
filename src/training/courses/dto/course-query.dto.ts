import { IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { TrainingVisibility } from '../entities/course.entity';
import { Type } from 'class-transformer';
import { CourseQueryOrderDto } from './course-query-order.dto';
import { BaseQueryTrainingDto } from 'src/training/common/dto/base-query-training.dto';

export class CourseQueryDto extends BaseQueryTrainingDto {
  @IsOptional()
  @IsEnum(TrainingVisibility)
  visibility?: TrainingVisibility;

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseQueryOrderDto)
  order: CourseQueryOrderDto = new CourseQueryOrderDto();
}

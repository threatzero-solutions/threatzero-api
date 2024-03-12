import { IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { TrainingVisibility } from '../entities/course.entity';
import { Type } from 'class-transformer';
import { CourseQueryOrderDto } from './course-query-order.dto';

export class CourseQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(TrainingVisibility)
  visibility?: TrainingVisibility;

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseQueryOrderDto)
  order: CourseQueryOrderDto = new CourseQueryOrderDto();
}

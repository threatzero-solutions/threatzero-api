import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  BaseQueryOrderDto,
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { TrainingVisibility } from 'src/training/common/training.types';

export class CourseEnrollmentQueryOrderDto extends BaseQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  visibility?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  endDate?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  startDate?: QueryOrder;
}

export class CourseEnrollmentQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsUUID('4', { each: true })
  ['organization.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['organization.slug']?: string | string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  ['course.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  @IsEnum(TrainingVisibility)
  visibility?: TrainingVisibility;
}

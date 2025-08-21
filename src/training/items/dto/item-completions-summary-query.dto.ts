import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

export class ItemCompletionsSummaryQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsUUID('4', { each: true })
  ['enrollment.id']?: string | string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  ['enrollment.course.id']?: string | string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  ['section.id']?: string | string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  ['item.id']?: string | string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  @Expose({ groups: ['admin'] })
  ['user.organization.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  @Expose({ groups: ['admin'] })
  ['user.organization.slug']?: string | string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  ['user.unit.id']?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  ['user.unit.slug']?: string | string[];
}

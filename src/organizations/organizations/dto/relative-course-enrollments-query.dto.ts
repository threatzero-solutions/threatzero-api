import { IsBoolean, IsOptional } from 'class-validator';

export class RelativeCourseEnrollmentsQueryDto {
  @IsOptional()
  @IsBoolean()
  includeHidden: boolean = false;
}

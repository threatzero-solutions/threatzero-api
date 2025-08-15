import { IsBoolean, IsOptional } from 'class-validator';

export class LatestCourseEnrollmentsQueryDto {
  @IsOptional()
  @IsBoolean()
  onlyCurrent: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeHidden: boolean = false;
}

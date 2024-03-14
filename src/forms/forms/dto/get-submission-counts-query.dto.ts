import { IsIn, IsOptional } from 'class-validator';

export class GetSubmissionCountsQueryDto {
  @IsOptional()
  @IsIn([1, 7, 30, 90, 365], {
    each: true,
    message: 'Must be one of: 1, 7, 30, 90, 365 days',
  })
  thresholds: number[] = [7, 30, 90];
}

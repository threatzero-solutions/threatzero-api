import { IsOptional, IsNumber, Min } from 'class-validator';

export class OrganizationUserQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset: number = 0;
}

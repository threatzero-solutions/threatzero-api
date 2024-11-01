import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LmsViewershipTokenValueDto {
  @IsNotEmpty()
  @IsString()
  enrollmentId: string;

  @IsNotEmpty()
  @IsString()
  trainingItemId: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @IsOptional()
  @IsString()
  lmsName?: string;
}

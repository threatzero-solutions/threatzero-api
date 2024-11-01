import { Exclude } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { OpaqueTokenQueryDto } from 'src/auth/dto/opaque-token-query.dto';

export class LmsViewershipTokenQueryDto extends OpaqueTokenQueryDto {
  @IsOptional()
  @IsString()
  ['value.organizationId']?: string;

  @IsOptional()
  @IsString()
  ['value.enrollmentId']?: string;

  @IsOptional()
  @IsString()
  ['value.trainingItemId']?: string;

  @Exclude()
  type = 'lms-training';
}

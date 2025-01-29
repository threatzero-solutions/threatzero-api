import { Type } from 'class-transformer';
import {
  IsMimeType,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class GetPresignedUploadUrlDto {
  @IsNotEmpty()
  @IsString()
  filename: string;

  @IsNotEmpty()
  @IsString()
  fileId: string;

  @IsOptional()
  @IsMimeType()
  mimetype?: string;
}

export class GetPresignedUploadUrlsDto {
  @IsNotEmpty()
  @Type(() => GetPresignedUploadUrlDto)
  @ValidateNested()
  files: GetPresignedUploadUrlDto[];
}

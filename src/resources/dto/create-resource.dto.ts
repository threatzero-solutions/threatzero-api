import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { ResourceType } from '../entities/resource.entity';

export class CreateResourceDto {
  @IsOptional()
  @IsString()
  fileKey?: string;

  @IsOptional()
  @IsString()
  thumbnailKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vimeoUrl?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string | null;

  @IsEnum(ResourceType)
  type: ResourceType;

  @IsNotEmpty()
  @IsString()
  category: string;
}

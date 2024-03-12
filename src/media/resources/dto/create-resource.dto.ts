import { IsNotEmpty, IsOptional, IsEnum, IsString } from 'class-validator';
import { ResourceType } from '../entities/resource.entity';

export class CreateResourceDto {
  @IsNotEmpty()
  @IsString()
  fileKey: string;

  @IsOptional()
  @IsString()
  thumbnailKey?: string;

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

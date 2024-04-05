import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTrainingMetadataDto {
  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @MaxLength(100)
  @IsString()
  @IsOptional()
  tag?: string;
}

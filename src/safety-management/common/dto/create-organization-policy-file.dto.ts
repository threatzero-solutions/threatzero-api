import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrganizationPolicyFileDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  pdfS3Key: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;
}

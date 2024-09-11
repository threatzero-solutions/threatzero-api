import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BaseMatcherDto {
  @IsString()
  @IsOptional()
  attributeId?: string;

  @IsString()
  @IsNotEmpty()
  externalName: string;

  @IsString()
  @IsNotEmpty()
  pattern: string;
}

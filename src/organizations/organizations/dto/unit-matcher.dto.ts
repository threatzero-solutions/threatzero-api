import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UnitMatcherDto {
  @IsString()
  @IsOptional()
  attributeId?: string;

  @IsString()
  @IsNotEmpty()
  externalName: string;

  @IsString()
  @IsNotEmpty()
  pattern: string;

  @IsString()
  @IsNotEmpty()
  unitSlug: string;
}

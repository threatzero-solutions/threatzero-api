import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ViewingUserRepresentationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().replace(/\s+/g, ''))
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  unitSlug: string;

  @IsString()
  @IsOptional()
  organizationSlug?: string;

  @IsString({ each: true })
  @IsOptional()
  audiences?: string[];
}

import { Matches, Length, IsString, IsOptional } from 'class-validator';

export class CreateOrganizationBaseDto {
  @Matches(/^[a-z0-9-]+$/)
  @Length(4, 64)
  slug: string;

  @IsString()
  @Length(4, 128)
  name: string;

  @IsOptional()
  @IsString()
  address: string | null;
}

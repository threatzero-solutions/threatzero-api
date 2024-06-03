import { Type } from 'class-transformer';
import {
  Matches,
  Length,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateSafetyContactDto } from 'src/safety-management/common/dto/create-safety-contact.dto';
import { CreateOrganizationPolicyFileDto } from 'src/safety-management/common/dto/create-organization-policy-file.dto';

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

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSafetyContactDto)
  safetyContact?: CreateSafetyContactDto;

  @Type(() => CreateOrganizationPolicyFileDto)
  @ValidateNested()
  @IsOptional()
  policiesAndProcedures?: CreateOrganizationPolicyFileDto[];
}

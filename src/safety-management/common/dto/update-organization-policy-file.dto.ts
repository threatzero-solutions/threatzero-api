import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizationPolicyFileDto } from './create-organization-policy-file.dto';

export class UpdateOrganizationPolicyFileDto extends PartialType(
  CreateOrganizationPolicyFileDto,
) {}

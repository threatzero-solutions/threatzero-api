import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import {
  Attributes,
  CreateOrganizationUserDto,
} from './create-organization-user.dto';

export class PartialAttributes extends PartialType(Attributes) {}

export class UpdateOrganizationUserDto extends PartialType(
  OmitType(CreateOrganizationUserDto, ['attributes'] as const),
) {
  @Type(() => PartialAttributes)
  @ValidateNested()
  @IsNotEmpty()
  attributes: PartialAttributes;
}

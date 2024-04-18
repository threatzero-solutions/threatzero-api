import { PartialType } from '@nestjs/mapped-types';
import { CreateSafetyContactDto } from './create-safety-contact.dto';

export class UpdateSafetyContactDto extends PartialType(
  CreateSafetyContactDto,
) {}

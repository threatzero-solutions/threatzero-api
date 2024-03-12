import { PartialType } from '@nestjs/mapped-types';
import { CreateFieldGroupDto } from './create-field-group.dto';

export class UpdateFieldGroupDto extends PartialType(CreateFieldGroupDto) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreatePOCFileDto } from './create-poc-file.dto';

export class UpdatePOCFileDto extends PartialType(CreatePOCFileDto) {}

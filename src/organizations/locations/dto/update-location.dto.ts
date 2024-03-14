import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create-location.dto';
import { IsEmpty } from 'class-validator';
import { Exclude } from 'class-transformer';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @Exclude()
  locationId = undefined;
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create-location.dto';
import { Exclude } from 'class-transformer';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @Exclude()
  locationId = undefined;
}

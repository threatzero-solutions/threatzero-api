import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseMatcherDto } from './base-matcher.dto';

export class UnitMatcherDto extends BaseMatcherDto {
  @IsString()
  @IsNotEmpty()
  unitSlug: string;
}

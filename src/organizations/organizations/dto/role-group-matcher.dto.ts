import { IsNotEmpty, IsString } from 'class-validator';
import { BaseMatcherDto } from './base-matcher.dto';

export class RoleGroupMatcherDto extends BaseMatcherDto {
  @IsString()
  @IsNotEmpty()
  roleGroup: string;
}

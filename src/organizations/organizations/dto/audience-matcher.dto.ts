import { IsNotEmpty, IsString } from 'class-validator';
import { BaseMatcherDto } from './base-matcher.dto';

export class AudienceMatcherDto extends BaseMatcherDto {
  @IsString()
  @IsNotEmpty()
  audience: string;
}

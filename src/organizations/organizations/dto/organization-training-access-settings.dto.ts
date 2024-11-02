import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AllowedOrigin {
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class OrganizationTrainingAccessSettingsDto {
  @Type(() => AllowedOrigin)
  @IsOptional()
  @ValidateNested({ each: true })
  allowedOrigins?: AllowedOrigin[];
}

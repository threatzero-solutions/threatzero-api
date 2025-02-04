import { Exclude, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Attributes {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  unit: string[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  audience: string[];

  @Exclude()
  organization: string[];
}

export class CreateOrganizationUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @Type(() => Attributes)
  @ValidateNested()
  @IsNotEmpty()
  attributes: Attributes;

  @IsBoolean()
  @IsOptional()
  canAccessTraining?: boolean;
}

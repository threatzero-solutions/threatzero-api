import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
export function IsNotExpired(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotExpired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value > new Date();
        },
      },
    });
  };
}

export class ViewingUserRepresentationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  unitSlug: string;

  @IsString()
  @IsOptional()
  organizationSlug?: string;

  @IsString({ each: true })
  @IsOptional()
  audiences?: string[];

  @IsDate()
  @IsOptional()
  @IsNotExpired({ message: 'Expired viewing session' })
  expiresOn?: Date;
}

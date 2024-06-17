import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
export function IsNotExpired(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotExpired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
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
  @IsOptional()
  unitSlug?: string;

  @IsString({ each: true })
  @IsOptional()
  audiences?: string[];

  @IsDate()
  @IsOptional()
  @IsNotExpired({ message: 'Expired viewing session' })
  expiresOn?: Date;
}

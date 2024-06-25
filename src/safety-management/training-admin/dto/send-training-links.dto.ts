import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ViewingUserRepresentationDto } from 'src/media/dto/viewing-user-representation.dto';

@ValidatorConstraint({ name: 'ContainsTokenPlaceholder', async: false })
class ContainsTokenPlaceholder implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    return text.includes('{token}');
  }

  defaultMessage(args: ValidationArguments) {
    return "Missing token placeholder '{token}' in training link template.";
  }
}

export class SendTrainingLinksDto {
  @ValidateNested()
  @Type(() => ViewingUserRepresentationDto)
  trainingTokenValues: ViewingUserRepresentationDto[];

  @IsNotEmpty()
  @IsString()
  @Validate(ContainsTokenPlaceholder)
  trainingUrlTemplate: string;

  @IsNotEmpty()
  @IsUUID()
  trainingItemId: string;
}

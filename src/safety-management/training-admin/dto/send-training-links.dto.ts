import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ViewingUserRepresentationDto } from 'src/media/dto/viewing-user-representation.dto';

@ValidatorConstraint({ name: 'ContainsTokenPlaceholder', async: false })
export class ContainsTokenPlaceholder implements ValidatorConstraintInterface {
  validate(text: string) {
    return text.includes('{trainingItemId}') && text.includes('{token}');
  }

  defaultMessage() {
    return "Missing either training item placeholder '{trainingItemId}' or token placeholder '{token}' in training link template.";
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
  trainingCourseId: string;

  @IsNotEmpty()
  @IsUUID()
  trainingItemId: string;
}

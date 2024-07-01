import { IsNotEmpty, IsString, IsUUID, Validate } from 'class-validator';
import { ContainsTokenPlaceholder } from './send-training-links.dto';

export class ResendTrainingLinksDto {
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  trainingTokenIds: string[];

  @IsNotEmpty()
  @IsString()
  @Validate(ContainsTokenPlaceholder)
  trainingUrlTemplate: string;
}

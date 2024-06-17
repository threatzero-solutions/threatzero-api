import { IsNotEmpty, IsString } from 'class-validator';
import { ViewingUserRepresentationDto } from 'src/media/dto/viewing-user-representation.dto';

export class TrainingParticipantRepresentationDto extends ViewingUserRepresentationDto {
  @IsNotEmpty()
  @IsString()
  trainingItemId: string;
}

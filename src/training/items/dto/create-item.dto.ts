import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DurationDto } from 'src/common/dto/duration.dto';
import { CreateTrainingMetadataDto } from 'src/training/common/dto/create-training-metadata.dto';

export class CreateItemDto {
  @IsNotEmpty()
  @IsIn(['Video'])
  type: string;

  @ValidateNested()
  @Type(() => CreateTrainingMetadataDto)
  metadata: CreateTrainingMetadataDto;

  @Length(4, 128)
  @IsOptional()
  thumbnailKey: string | null;
  thumbnailUrl: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => DurationDto)
  estCompletionTime?: DurationDto;

  // Video item properties
  @ValidateIf((item) => item.type === 'video')
  @IsNotEmpty()
  @IsString()
  vimeoUrl: string;
}

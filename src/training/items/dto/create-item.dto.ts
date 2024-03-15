import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IPostgresInterval } from 'postgres-interval';
import { CreateTrainingMetadataDto } from 'src/training/common/dto/create-training-metadata.dto';

export class CreateTrainingEstimatedCompletionTimeDto
  implements IPostgresInterval
{
  @IsOptional()
  @IsNumber()
  years: number;

  @IsOptional()
  @IsNumber()
  months: number;

  @IsOptional()
  @IsNumber()
  days: number;

  @IsOptional()
  @IsNumber()
  hours: number;

  @IsOptional()
  @IsNumber()
  minutes: number;

  @IsOptional()
  @IsNumber()
  seconds: number;

  @IsOptional()
  @IsNumber()
  milliseconds: number;

  toPostgres(): string {
    throw new Error('Method not implemented.');
  }
  toISO(): string {
    throw new Error('Method not implemented.');
  }
  toISOString(): string {
    throw new Error('Method not implemented.');
  }
  toISOStringShort(): string {
    throw new Error('Method not implemented.');
  }
}

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
  @Type(() => CreateTrainingEstimatedCompletionTimeDto)
  estCompletionTime?: CreateTrainingEstimatedCompletionTimeDto;

  // Video item properties
  @ValidateIf((item) => item.type === 'video')
  @IsNotEmpty()
  @IsString()
  vimeoUrl: string;
}

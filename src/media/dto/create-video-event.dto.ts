import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VideoEventType } from '../entities/video-event.entity';

export class CreateVideoEventDto {
  @IsEnum(VideoEventType)
  @IsNotEmpty()
  type: VideoEventType;

  @IsOptional()
  @MaxLength(50)
  itemId?: string | null;

  @IsOptional()
  @MaxLength(50)
  sectionId?: string | null;

  @IsOptional()
  @MaxLength(50)
  videoId?: string | null;

  @IsObject()
  @IsOptional()
  eventData?: unknown;

  @IsNotEmpty()
  @IsString()
  url: string;
}

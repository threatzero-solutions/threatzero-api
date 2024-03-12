import { PartialType } from '@nestjs/mapped-types';
import { CreateVideoItemDto } from './create-video-item.dto';

export class UpdateVideoItemDto extends PartialType(CreateVideoItemDto) {}

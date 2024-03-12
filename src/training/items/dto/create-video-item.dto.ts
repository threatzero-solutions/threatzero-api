import { Length, IsOptional, IsString } from 'class-validator';
import { CreateItemDto } from './create-item.dto';

export class CreateVideoItemDto extends CreateItemDto {
  // TODO: This exists for backwards compatibility. Remove it in a future release.
  @Length(4, 128)
  @IsOptional()
  mediaKey: string | null;

  @IsString({ each: true })
  mediaKeys: string[] | null = [];
  mediaUrls: string[] | null;

  @IsOptional()
  @IsString()
  embeddedHtml: string | null;

  @IsOptional()
  @IsString()
  vimeoUrl: string | null;
}

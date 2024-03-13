import { ChildEntity, Column } from 'typeorm';
import { Item } from './item.entity';

@ChildEntity()
export class VideoItem extends Item {
  // TODO: This exists for backwards compatibility. Remove it in a future release.
  @Column({ type: 'varchar', length: 128 })
  mediaKey: string | null;

  @Column({ type: 'jsonb' })
  mediaKeys: string[] | null = [];
  mediaUrls: string[] | null;

  @Column({ type: 'text' })
  embeddedHtml: string | null;

  @Column({ type: 'varchar', length: 1024 })
  vimeoUrl: string | null;

  @Column({ type: 'varchar', length: 32 })
  encodingJobId: string | null;

  @Column({ type: 'boolean', default: false })
  abrEnabled: boolean;

  async loadThumbnailUrl(
    getVimeoThumbnail: (url: string) => Promise<string | null>,
  ) {
    if (this.vimeoUrl) {
      this.thumbnailUrl = await getVimeoThumbnail(this.vimeoUrl);
    }
  }
}

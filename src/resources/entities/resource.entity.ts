import { Base } from 'src/common/base.entity';
import { Column, Entity, Index } from 'typeorm';

export enum ResourceType {
  DOCUMENT = 'document',
  VIDEO = 'video',
}

@Entity()
export class ResourceItem extends Base {
  @Column()
  fileKey: string;
  resourceUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  thumbnailKey: string | null;
  thumbnailUrl?: string | null;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ResourceType })
  type: ResourceType;

  @Index()
  @Column({ length: 64 })
  category: string;

  sign(signer: (k: string) => string) {
    this.resourceUrl = signer(this.fileKey);

    if (this.thumbnailKey) {
      this.thumbnailUrl = signer(this.thumbnailKey);
    }

    return this;
  }
}

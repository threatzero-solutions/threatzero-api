import { Base } from 'src/common/base.entity';
import { Column, Entity, Index } from 'typeorm';

export enum ResourceType {
  DOCUMENT = 'document',
  VIDEO = 'video',
}

@Entity()
export class Resource extends Base {
  @Column()
  fileKey: string;
  fileKeyToken?: string | null;

  @Column({ type: 'text', nullable: true })
  thumbnailKey: string | null;
  thumbnailKeyToken?: string | null;

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
    this.fileKeyToken = signer(this.fileKey);

    if (this.thumbnailKey) {
      this.thumbnailKeyToken = signer(this.thumbnailKey);
    }

    return this;
  }
}

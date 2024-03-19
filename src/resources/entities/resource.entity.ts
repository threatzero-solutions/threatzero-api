import { Base } from 'src/common/base.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  Relation,
} from 'typeorm';

export enum ResourceType {
  DOCUMENT = 'document',
  VIDEO = 'video',
}

@Entity()
export class ResourceItem extends Base {
  @Column({ type: 'text', nullable: true })
  fileKey: string | null;
  resourceUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  thumbnailKey: string | null;
  thumbnailUrl?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vimeoUrl: string | null;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ResourceType })
  type: ResourceType;

  @Index()
  @Column({ length: 64 })
  category: string;

  @ManyToMany(() => Organization, (organization) => organization.resources, {
    eager: true,
  })
  @JoinTable()
  organizations: Relation<Organization>[];

  sign(signer: (k: string) => string) {
    if (!this.vimeoUrl && this.fileKey) {
      this.resourceUrl = signer(this.fileKey);
    }

    if (!this.vimeoUrl && this.thumbnailKey) {
      this.thumbnailUrl = signer(this.thumbnailKey);
    }

    return this;
  }

  async loadThumbnailUrl(
    getVimeoThumbnail: (url: string) => Promise<string | null>,
  ) {
    if (this.vimeoUrl) {
      this.thumbnailUrl = await getVimeoThumbnail(this.vimeoUrl);
    }
    return this;
  }
}

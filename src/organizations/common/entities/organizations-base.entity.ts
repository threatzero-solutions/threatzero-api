import { Base } from 'src/common/base.entity';
import { Entity, Index, Column } from 'typeorm';

export class OrganizationBase extends Base {
  @Index()
  @Column({ length: 64, unique: true })
  slug: string;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;
}

import { Base } from 'src/common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class UserRepresentation extends Base {
  @Column({ type: 'varchar', length: 100, unique: true })
  externalId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  givenName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  familyName: string | null;

  @Column({ type: 'text', nullable: true })
  picture: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  organizationSlug: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unitSlug: string | null;
}

import { Base } from 'src/common/base.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { Column, Entity, Index, ManyToOne, Relation } from 'typeorm';

@Entity()
@Index(['organization', 'unit'])
export class UserRepresentation extends Base {
  @Index()
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  externalId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  idpId: string | null;

  @Index()
  @Column({ type: 'varchar', unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  givenName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  familyName: string | null;

  @Column({ type: 'text', nullable: true })
  picture: string | null;

  @Column({ nullable: true })
  organizationId: string | null;

  @ManyToOne(() => Organization, { nullable: true })
  organization: Relation<Organization> | null;

  @Column({ nullable: true })
  unitId: string | null;

  @ManyToOne(() => Unit, { nullable: true })
  unit: Relation<Unit> | null;
}

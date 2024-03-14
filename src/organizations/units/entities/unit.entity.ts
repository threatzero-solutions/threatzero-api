import { OrganizationBase } from 'src/organizations/common/entities/organizations-base.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Entity, Column, ManyToOne, Relation } from 'typeorm';

@Entity()
export class Unit extends OrganizationBase {
  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  groupId: string | null;

  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  tatGroupId: string | null;

  @ManyToOne(() => Organization, (organization) => organization.units)
  organization: Relation<Organization>;
}

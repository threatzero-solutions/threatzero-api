import { OrganizationBase } from 'src/organizations/common/entities/organizations-base.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { OrganizationPolicyFile } from 'src/safety-management/common/entities/organization-policy-file.entity';
import {
  Entity,
  Column,
  ManyToOne,
  Relation,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';

@Entity()
@Unique(['slug', 'organization'])
export class Unit extends OrganizationBase {
  @Column({ default: false })
  isDefault: boolean;

  @Index()
  @Column({ length: 64 })
  slug: string;

  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  tatGroupId: string | null;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.units)
  organization: Relation<Organization>;

  @Column({ nullable: true })
  parentUnitId: string | null;

  @ManyToOne(() => Unit, (unit) => unit.subUnits, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parentUnit: Relation<Unit> | null;

  @OneToMany(() => Unit, (unit) => unit.parentUnit)
  subUnits: Relation<Unit>[];

  path?: string;

  @OneToMany(() => OrganizationPolicyFile, (p) => p.unit, {
    cascade: true,
  })
  policiesAndProcedures: Relation<OrganizationPolicyFile>[];

  sign(signer: (k: string) => string) {
    if (this.policiesAndProcedures?.length) {
      this.policiesAndProcedures = this.policiesAndProcedures.map((p) => {
        p.pdfUrl = signer(p.pdfS3Key);
        return p;
      });
    }

    return this;
  }
}

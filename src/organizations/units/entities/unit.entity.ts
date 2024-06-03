import { OrganizationBase } from 'src/organizations/common/entities/organizations-base.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { OrganizationPolicyFile } from 'src/safety-management/common/entities/organization-policy-file.entity';
import { Entity, Column, ManyToOne, Relation, OneToMany } from 'typeorm';

@Entity()
export class Unit extends OrganizationBase {
  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  groupId: string | null;

  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  tatGroupId: string | null;

  @ManyToOne(() => Organization, (organization) => organization.units)
  organization: Relation<Organization>;

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

import { Base } from 'src/common/base.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { Column, Entity, ManyToOne, Relation } from 'typeorm';

@Entity()
export class OrganizationPolicyFile extends Base {
  @Column({ type: 'varchar', length: 255 })
  pdfS3Key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  pdfUrl?: string;

  @ManyToOne(
    () => Organization,
    (organization) => organization.policiesAndProcedures,
    {
      onDelete: 'CASCADE',
    },
  )
  organization: Relation<Organization> | null;

  @ManyToOne(() => Unit, (unit) => unit.policiesAndProcedures, {
    onDelete: 'CASCADE',
  })
  unit: Relation<Unit> | null;
}

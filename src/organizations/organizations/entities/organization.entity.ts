import { Expose } from 'class-transformer';
import { OrganizationBase } from 'src/organizations/common/entities/organizations-base.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { ResourceItem } from 'src/resources/entities/resource.entity';
import { OrganizationPolicyFile } from 'src/safety-management/common/entities/organization-policy-file.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { Entity, Column, OneToMany, Relation, ManyToMany } from 'typeorm';

@Entity()
export class Organization extends OrganizationBase {
  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  groupId: string | null;

  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  tatGroupId: string | null;

  @OneToMany(() => Unit, (unit) => unit.organization)
  units: Relation<Unit>[];

  @ManyToMany(() => TrainingCourse, (course) => course.organizations)
  courses: Relation<TrainingCourse>[];

  @ManyToMany(() => ResourceItem, (resource) => resource.organizations)
  resources: Relation<ResourceItem>[];

  @OneToMany(() => OrganizationPolicyFile, (p) => p.organization, {
    cascade: true,
  })
  policiesAndProcedures: Relation<OrganizationPolicyFile>[];

  @Column({ nullable: true, type: 'jsonb' })
  idpSlugs: string[] | null;

  // TODO: This is not being used yet. Could be used to control which role groups
  // organizations can access.
  @Column({ nullable: true, type: 'jsonb' })
  allowedRoleGroups: string[] | null;

  sign(signer: (k: string) => string) {
    if (this.policiesAndProcedures?.length) {
      this.policiesAndProcedures = this.policiesAndProcedures.map((p) => {
        p.pdfUrl = signer(p.pdfS3Key);
        return p;
      });
    }

    return this;
  }

  @Expose()
  get allowedAudiences() {
    return (
      this.courses?.reduce((acc, course) => {
        course.audiences?.forEach((audience) => acc.add(audience.slug));
        course.presentableBy?.forEach((audience) => acc.add(audience.slug));
        return acc;
      }, new Set<string>()) || new Set<string>()
    );
  }
}

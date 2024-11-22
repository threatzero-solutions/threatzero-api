import { Expose } from 'class-transformer';
import { OrganizationBase } from 'src/organizations/common/entities/organizations-base.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { ResourceItem } from 'src/resources/entities/resource.entity';
import { OrganizationPolicyFile } from 'src/safety-management/common/entities/organization-policy-file.entity';
import {
  Entity,
  Column,
  OneToMany,
  Relation,
  ManyToMany,
  Index,
} from 'typeorm';
import { CourseEnrollment } from './course-enrollment.entity';
import { OrganizationTrainingAccessSettingsDto } from '../dto/organization-training-access-settings.dto';

@Entity()
export class Organization extends OrganizationBase {
  @Index()
  @Column({ length: 64, unique: true })
  slug: string;

  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  groupId: string | null;

  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  tatGroupId: string | null;

  @OneToMany(() => Unit, (unit) => unit.organization)
  units: Relation<Unit>[];

  @OneToMany(() => CourseEnrollment, (enrollment) => enrollment.organization, {
    cascade: true,
  })
  enrollments: Relation<CourseEnrollment>[];

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

  @Column({ type: 'jsonb', nullable: true })
  trainingAccessSettings: OrganizationTrainingAccessSettingsDto | null;

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
      this.enrollments?.reduce((acc, enrollment) => {
        const course = enrollment.course;
        course.audiences?.forEach((audience) => acc.add(audience.slug));
        course.presentableBy?.forEach((audience) => acc.add(audience.slug));
        return acc;
      }, new Set<string>()) || new Set<string>()
    );
  }
}

import { OrganizationBase } from 'src/organizations/common/entities/organizations-base.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { Course } from 'src/training/courses/entities/course.entity';
import { Entity, Column, OneToMany, Relation, ManyToMany } from 'typeorm';

@Entity()
export class Organization extends OrganizationBase {
  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  groupId: string | null;

  @OneToMany(() => Unit, (unit) => unit.organization)
  units: Relation<Unit>[];

  @ManyToMany(() => Course, (course) => course.organizations)
  courses: Relation<Course>[];

  //   @BeforeInsert()
  //   @BeforeUpdate()
  //   async beforeInsert() {
  //     const organizationParentGroupId =
  //       config.get<KeycloakConfig>('keycloak').parentOrganizationsGroupId;

  //     if (!organizationParentGroupId) {
  //       logger.error(
  //         {},
  //         'Failed to create organization: Missing parent organization group id',
  //       );
  //       return;
  //     }

  //     const orgGroup = await upsertGroup(
  //       {
  //         id: this.groupId ?? undefined,
  //         name: this.name,
  //         attributes: {
  //           organization: [this.slug],
  //         },
  //       },
  //       organizationParentGroupId,
  //     );

  //     this.groupId = orgGroup.id;
  //   }

  //   @BeforeRemove()
  //   async beforeRemove() {
  //     const kcAdminClient = await getKCAdminClient();

  //     if (this.groupId) {
  //       await kcAdminClient.groups.del({ id: this.groupId }).catch((e) => {
  //         logger.error(e, 'Failed to delete organization group');
  //       });
  //     }
  //   }
}

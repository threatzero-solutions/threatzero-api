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

  //   @BeforeInsert()
  //   @BeforeUpdate()
  //   async beforeInsert() {
  //     if (!this.organization.id) {
  //       return;
  //     }

  //     let organizationGroupId = this.organization.groupId;
  //     if (!organizationGroupId) {
  //       const organization = await getDataRepository(Organization).then((r) =>
  //         r.findOne({
  //           where: {
  //             id: this.organization.id,
  //           },
  //         }),
  //       );

  //       if (organization?.groupId) {
  //         organizationGroupId = organization.groupId;
  //       } else {
  //         return;
  //       }
  //     }

  //     const unitGroup = await upsertGroup(
  //       {
  //         id: this.groupId ?? undefined,
  //         name: this.name,
  //         attributes: {
  //           unit: [this.slug],
  //         },
  //       },
  //       organizationGroupId!,
  //     );

  //     this.groupId = unitGroup.id;

  //     const tatGroup = await upsertGroup(
  //       {
  //         id: this.tatGroupId ?? undefined,
  //         name: `${this.name} TAT`,
  //       },
  //       this.groupId,
  //     );

  //     this.tatGroupId = tatGroup.id;
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

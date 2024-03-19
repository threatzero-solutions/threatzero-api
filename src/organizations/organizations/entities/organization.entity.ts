import { OrganizationBase } from 'src/organizations/common/entities/organizations-base.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { ResourceItem } from 'src/resources/entities/resource.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { Entity, Column, OneToMany, Relation, ManyToMany } from 'typeorm';

@Entity()
export class Organization extends OrganizationBase {
  @Column({ unique: true, nullable: true, type: 'varchar', length: 50 })
  groupId: string | null;

  @OneToMany(() => Unit, (unit) => unit.organization)
  units: Relation<Unit>[];

  @ManyToMany(() => TrainingCourse, (course) => course.organizations)
  courses: Relation<TrainingCourse>[];

  @ManyToMany(() => ResourceItem, (resource) => resource.organizations)
  resources: Relation<ResourceItem>[];
}

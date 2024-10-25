import { Column, Entity, Index, ManyToOne, Relation, Unique } from 'typeorm';
import { TrainingItem } from './item.entity';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { Base } from 'src/common/base.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';

@Entity()
@Index(['organization', 'unit', 'item'])
@Index(['organization', 'unit', 'enrollment'])
@Index(['userId', 'completed'])
@Index(['userId', 'enrollment', 'item'])
@Unique(['userId', 'enrollment', 'item'])
export class ItemCompletion extends Base {
  @ManyToOne(() => TrainingItem, {
    onDelete: 'RESTRICT',
  })
  item: Relation<TrainingItem>;

  @ManyToOne(() => TrainingSection, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  section: Relation<TrainingSection> | null;

  @ManyToOne(() => CourseEnrollment, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  enrollment: Relation<CourseEnrollment> | null;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completedOn: Date | null;

  @Column({ type: 'float', default: 0 })
  progress: number;

  @Column()
  url: string;

  @Index()
  @Column({ length: 64, select: false, update: true })
  userId: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  email: string | null;

  @Column({ type: 'jsonb', nullable: true })
  audienceSlugs?: string[] | null;

  @ManyToOne(() => Organization, {
    onDelete: 'CASCADE',
  })
  organization: Relation<Organization>;

  @ManyToOne(() => Unit, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  unit: Relation<Unit> | null;
}

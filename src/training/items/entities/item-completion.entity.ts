import { Column, Entity, Index, ManyToOne, Relation, Unique } from 'typeorm';
import { TrainingItem } from './item.entity';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { Base } from 'src/common/base.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';

@Entity()
@Index(['organization', 'unit', 'item'])
@Index(['organization', 'unit', 'course'])
@Index(['userId', 'completed'])
@Index(['userId', 'course', 'item'])
@Unique(['userId', 'course', 'item'])
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

  @ManyToOne(() => TrainingCourse, {
    onDelete: 'RESTRICT',
  })
  course: Relation<TrainingCourse>;

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

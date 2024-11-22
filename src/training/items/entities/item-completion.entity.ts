import { Column, Entity, Index, ManyToOne, Relation, Unique } from 'typeorm';
import { TrainingItem } from './item.entity';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { Base } from 'src/common/base.entity';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { UserRepresentation } from 'src/users/entities/user-representation.entity';

@Entity()
@Index(['user', 'item'])
@Index(['user', 'completed'])
@Index(['user', 'enrollment', 'item'])
@Unique(['user', 'enrollment', 'item'])
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
  @Column({ select: false, update: true, nullable: true })
  userId: string | null;

  @ManyToOne(() => UserRepresentation, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  user: Relation<UserRepresentation>;

  @Column({ type: 'varchar', length: 254, nullable: true })
  email: string | null;

  @Column({ type: 'jsonb', nullable: true })
  audienceSlugs?: string[] | null;
}

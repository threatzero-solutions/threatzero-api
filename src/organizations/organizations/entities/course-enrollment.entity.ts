import { Base } from 'src/common/base.entity';
import { TrainingVisibility } from 'src/training/common/training.types';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import { Organization } from './organization.entity';

@Entity()
export class CourseEnrollment extends Base {
  @ManyToOne(() => Organization, (organization) => organization.enrollments, {
    onDelete: 'CASCADE',
  })
  organization: Relation<Organization>;

  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => TrainingCourse, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  course: Relation<TrainingCourse>;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({
    type: 'enum',
    enum: TrainingVisibility,
    default: TrainingVisibility.HIDDEN,
  })
  visibility: TrainingVisibility;
}

import { Base } from 'src/common/base.entity';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { Audience } from 'src/training/audiences/entities/audience.entity';
import { TrainingMetadata } from 'src/training/common/entities/training-metadata.entity';
import { TrainingVisibility } from 'src/training/common/training.types';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  Relation,
} from 'typeorm';

@Entity()
export class TrainingCourse extends Base {
  @Column(() => TrainingMetadata)
  metadata: Relation<TrainingMetadata>;

  @Column({
    type: 'enum',
    enum: TrainingVisibility,
    default: TrainingVisibility.HIDDEN,
  })
  visibility: TrainingVisibility;

  // Keep start month and start day to not break watch stats.
  // TODO: Once watch stats are transferred over completely to "ItemCompletion", we can remove
  // both watch stats and start month and start day.
  @Column({ type: 'smallint', nullable: true })
  startMonth: number | null;

  @Column({ type: 'smallint', nullable: true })
  startDay: number | null;

  @OneToMany(() => TrainingSection, (section) => section.course, {
    eager: true,
    cascade: true,
  })
  sections: Relation<TrainingSection>[];

  @ManyToMany(() => Audience, (audience) => audience.trainingCourses, {
    eager: true,
  })
  @JoinTable()
  audiences: Relation<Audience>[];

  @ManyToMany(() => Audience, (audience) => audience.trainingCourses, {
    eager: true,
  })
  @JoinTable()
  presentableBy: Relation<Audience>[];

  @OneToMany(() => CourseEnrollment, (enrollment) => enrollment.course)
  enrollments: Relation<CourseEnrollment>[];

  async loadVideoThumbnails(
    getVimeoThumbnail: (url: string) => Promise<string | null>,
  ) {
    this.sections &&= await Promise.all(
      this.sections.map((section) =>
        section.loadVideoThumbnails(getVimeoThumbnail),
      ),
    );
  }
}

import { Base } from 'src/common/base.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { Entity, Column, ManyToMany, Relation } from 'typeorm';

@Entity()
export class Audience extends Base {
  @Column({ length: 32, unique: true })
  slug: string;

  @ManyToMany(() => TrainingCourse, (course) => course.audiences)
  trainingCourses: Relation<TrainingCourse>[];
}

import { Base } from 'src/common/base.entity';
import { Course } from 'src/training/courses/entities/course.entity';
import { Entity, Column, ManyToMany, Relation } from 'typeorm';

@Entity()
export class Audience extends Base {
  @Column({ length: 32, unique: true })
  slug: string;

  @ManyToMany(() => Course, (course) => course.audiences)
  trainingCourses: Relation<Course>[];
}

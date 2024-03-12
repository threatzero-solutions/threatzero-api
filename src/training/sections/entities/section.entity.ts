import dayjs from 'dayjs';
import { Base } from 'src/common/base.entity';
import { Course } from 'src/training/courses/entities/course.entity';
import { TrainingMetadata } from 'src/training/common/entities/training-metadata.entity';
import {
  Entity,
  Column,
  ManyToOne,
  Relation,
  OneToMany,
  AfterLoad,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';
import { SectionItem } from './section-item.entity';

export enum TrainingRepeats {
  YEARLY = 'yearly',
  ONCE = 'once',
}

@Entity()
export class Section extends Base {
  @Column(() => TrainingMetadata)
  metadata: TrainingMetadata;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  availableOn: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresOn: Date;

  @Column({ default: TrainingRepeats.ONCE })
  repeats: TrainingRepeats;

  @Column({ nullable: true })
  courseId: string | null;

  @ManyToOne(() => Course, (course) => course.sections, {
    onDelete: 'CASCADE',
  })
  course: Relation<Course>;

  @OneToMany(() => SectionItem, (sectionItem) => sectionItem.section, {
    eager: true,
    cascade: true,
  })
  items: Relation<SectionItem>[];

  @AfterLoad()
  @BeforeUpdate()
  @BeforeInsert()
  updateDatesByRepeatSchedule() {
    if (this.repeats === TrainingRepeats.YEARLY && this.expiresOn) {
      const expiresOn = dayjs(this.expiresOn);

      if (expiresOn.isBefore(dayjs())) {
        this.availableOn = dayjs(this.availableOn).add(1, 'year').toDate();
        this.expiresOn = expiresOn.add(1, 'year').toDate();
      }
    }
  }
}

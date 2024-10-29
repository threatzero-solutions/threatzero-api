import { Base } from 'src/common/base.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { TrainingMetadata } from 'src/training/common/entities/training-metadata.entity';
import { Entity, Column, ManyToOne, Relation, OneToMany } from 'typeorm';
import { TrainingSectionItem } from './section-item.entity';
import { Video } from 'src/training/items/entities/video-item.entity';
import { IPostgresInterval } from 'postgres-interval';
import { intervalTransformer } from 'src/common/entity.utils';

@Entity()
export class TrainingSection extends Base {
  @Column(() => TrainingMetadata)
  metadata: TrainingMetadata;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  availableOn: string;

  @Column({ type: 'date', nullable: true })
  expiresOn: string | null;

  @Column({
    type: 'interval',
    transformer: intervalTransformer,
    default: () => `'1 month'::interval`,
  })
  duration: IPostgresInterval;

  @Column({ nullable: true })
  courseId: string | null;

  @ManyToOne(() => TrainingCourse, (course) => course.sections, {
    onDelete: 'CASCADE',
  })
  course: Relation<TrainingCourse>;

  @OneToMany(() => TrainingSectionItem, (sectionItem) => sectionItem.section, {
    eager: true,
    cascade: true,
  })
  items: Relation<TrainingSectionItem>[];

  async loadVideoThumbnails(
    getVimeoThumbnail: (url: string) => Promise<string | null>,
  ) {
    this.items &&= await Promise.all(
      this.items.map(async (item) => {
        if (item.item instanceof Video) {
          item.item = await item.item.loadThumbnailUrl(getVimeoThumbnail);
        }
        return item;
      }),
    );
    return this;
  }
}
